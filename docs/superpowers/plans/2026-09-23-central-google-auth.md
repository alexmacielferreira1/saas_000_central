# Central Google Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Central's Base44 authentication path with independent email/password and Google OAuth login backed by PostgreSQL, including an idempotently bootstrapped superadmin account.

**Architecture:** FastAPI owns identity, memberships, opaque sessions, password verification and OAuth code exchange. React uses a small credentialed HTTP client and restores the server session on startup; the Google callback only authenticates a pre-existing authorized account. PostgreSQL state, cookies, OAuth configuration and deployment remain independent from MediaMind.

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy 2, Alembic, PostgreSQL 16, Argon2 password hashing, httpx, React 18, Vite, Vitest/jsdom.

**Spec:** `docs/superpowers/specs/2026-09-23-central-google-auth-design.md`

## Global Constraints

- `alexmacielferreira@gmail.com` is configured as the initial Central superadmin through environment values, never inferred as superadmin from a Google profile.
- Google login never creates a user, tenant, membership, role or permission.
- The Central does not share database, sessions, cookies, OAuth secrets or runtime code with MediaMind.
- Session tokens are opaque, stored only as hashes, revocable, and delivered only in `HttpOnly` cookies.
- Production requires HTTPS, `SESSION_COOKIE_SECURE=true`, exact CORS origin and an exact Google callback URI.
- No authentication token is stored in browser storage or returned in a URL.
- Bootstrap is creation-only and idempotent; it never resets an existing password or silently promotes an existing account.
- Central local and Central Neon each need their own one-time bootstrap because neither can see MediaMind's user database; remove `BOOTSTRAP_ADMIN_PASSWORD` from the environment after successful creation is verified.
- Every production-code change follows red-green-refactor and receives a focused commit.
- No Render, Neon or Google Cloud mutation occurs in this plan without a separately confirmed target and explicit deploy step.

## File Structure

### Backend identity and persistence

- `backend/app/models/identity.py`: `User`, `Tenant`, `Membership` and `AuthSession` tables.
- `backend/app/repositories/identity.py`: identity/session lookups and revocation operations.
- `backend/app/security/passwords.py`: Argon2 hash and verify boundary.
- `backend/app/security/sessions.py`: opaque token generation and SHA-256 token hashing.
- `backend/app/services/auth.py`: normalize e-mail, authenticate and create sessions.
- `backend/app/services/google_oauth.py`: Google authorization URL and code/profile exchange.
- `backend/app/services/bootstrap.py`: creation-only initial tenant/user/membership transaction.
- `backend/app/schemas/auth.py`: safe request/response models.
- `backend/app/tenancy/context.py`: resolve the current authenticated session.
- `backend/app/api/v1/auth.py`: login, OAuth, session and logout endpoints.
- `backend/app/api/v1/router.py`: versioned API router.
- `alembic/versions/0002_identity_auth.py`: identity/session schema only; no seeded credentials.

### Frontend authentication

- `frontend/src/api/httpClient.js`: credentialed JSON client and typed public error.
- `frontend/src/lib/AuthContext.jsx`: session restoration, login, logout and Google start URL.
- `frontend/src/pages/Login.jsx`: local API login and OAuth error presentation.
- `frontend/src/components/ProtectedRoute.jsx`: wait for session resolution, then allow or redirect.
- `frontend/src/lib/TenantContext.jsx`: derive tenants from authenticated memberships without Base44.

### Bootstrap and configuration

- `.env.example`: non-secret authentication variables.
- `frontend/.env.example`: `VITE_API_URL` only for the new auth path.
- `scripts/bootstrap-admin.py`: operational entry point.
- `scripts/bootstrap-admin.ps1`: Windows wrapper using the project virtual environment.

## Review Focus

- A Google callback arrives after the state cookie expired or from another browser: reject with `invalid_state`, clear temporary state and create no session (Task 4).
- An existing local e-mail has no membership or has an inactive membership: both password and Google paths must refuse a usable session (Tasks 2–4).
- Bootstrap finds an existing user with a different password or non-superadmin membership: make no silent mutation and fail with an actionable operational result (Task 5).
- The production frontend and backend are cross-origin: cookie uses `Secure; SameSite=None`, CORS is exact and the client includes credentials (Tasks 3 and 6).
- The session expires between route render and a protected API request: clear local identity once, show login and avoid a navigation loop (Tasks 6 and 7).

---

### Task 1: Identity schema and PostgreSQL migration

**Files:**
- Create: `backend/app/models/identity.py`
- Modify: `backend/app/models/__init__.py`
- Create: `alembic/versions/0002_identity_auth.py`
- Create: `backend/tests/test_identity_models.py`
- Modify: `tests/test_postgres_integration.py`

**Interfaces:**
- Produces: `User`, `Tenant`, `Membership`, `AuthSession` SQLAlchemy models with UUID string identifiers.
- Produces: `AuthSession.token_hash: str`, `AuthSession.expires_at: datetime`, `AuthSession.revoked_at: datetime | None`, `AuthSession.selected_tenant_id: str | None`.
- Consumes: existing `app.db.session.Base` and Alembic metadata.

- [ ] **Step 1: Write failing model tests**

```python
def test_user_email_and_membership_are_unique(session):
    user = User(email="Alex@Example.com", email_normalized="alex@example.com", password_hash="hash", full_name="Alex")
    tenant = Tenant(name="Central", slug="central")
    session.add_all([user, tenant])
    session.flush()
    session.add(Membership(user_id=user.id, tenant_id=tenant.id, role="superadmin"))
    session.commit()
    session.add(User(email="alex@example.com", email_normalized="alex@example.com", password_hash="other", full_name="Other"))
    with pytest.raises(IntegrityError):
        session.commit()
```

Add a real PostgreSQL test that upgrades to `head`, queries the four tables, downgrades to `0001_bootstrap`, then upgrades again.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `.\.venv\Scripts\python.exe -m pytest backend/tests/test_identity_models.py -q`

Expected: collection/import failure because `app.models.identity` does not exist.

- [ ] **Step 3: Implement the four focused models**

```python
class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    email_normalized: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
```

Add tenant slug uniqueness, one membership per `(user_id, tenant_id)`, indexed session token hash, expiration/revocation fields and foreign keys with explicit delete behavior. Import the models in `backend/app/models/__init__.py` and `alembic/env.py` so metadata is complete.

- [ ] **Step 4: Implement migration `0002_identity_auth`**

Create only schema and indexes. Do not create Alex, any password, tenant data or role data in the migration.

- [ ] **Step 5: Verify GREEN with SQLite model tests and PostgreSQL migration tests**

Run:

```powershell
.\.venv\Scripts\python.exe -m pytest backend/tests/test_identity_models.py -q
.\.venv\Scripts\python.exe -m pytest -m integration tests/test_postgres_integration.py -q
```

Expected: all targeted tests pass and Alembic reaches `0002_identity_auth` twice.

- [ ] **Step 6: Commit**

```powershell
git add backend/app/models backend/tests/test_identity_models.py alembic tests/test_postgres_integration.py
git commit -m "feat(auth): add Central identity schema"
```

### Task 2: Passwords, opaque sessions and authorization context

**Files:**
- Modify: `pyproject.toml`
- Modify: `requirements.lock`
- Create: `backend/app/security/passwords.py`
- Create: `backend/app/security/sessions.py`
- Create: `backend/app/repositories/identity.py`
- Create: `backend/app/services/auth.py`
- Create: `backend/app/tenancy/context.py`
- Create: `backend/tests/test_auth_service.py`

**Interfaces:**
- Consumes: identity models from Task 1.
- Produces: `hash_password(password: str) -> str` and `verify_password(password: str, encoded: str) -> bool`.
- Produces: `new_session_token() -> str` and `hash_session_token(token: str) -> str`.
- Produces: `authenticate(session, email, password, *, session_hours, max_attempts, lockout_minutes, now=None) -> LoginResult | None`.
- Produces: `create_session_for_user(session, user, *, session_hours, now=None) -> LoginResult` that refuses users without active membership.
- Produces: `get_current_session(request, session, central_session cookie) -> CurrentSession`.

- [ ] **Step 1: Write failing service tests**

```python
def test_authenticate_normalizes_email_and_creates_hashed_session(db_session):
    seeded = seed_authorized_user(db_session, password="secret-value")
    result = authenticate(db_session, "  ALEX@EXAMPLE.COM ", "secret-value", session_hours=8)
    assert result.user.id == seeded.id
    assert result.token not in db_session.scalars(select(AuthSession.token_hash)).all()
    assert hash_session_token(result.token) == result.auth_session.token_hash

def test_user_without_active_membership_gets_no_session(db_session):
    user = seed_user_without_membership(db_session)
    with pytest.raises(AccountNotAllowed):
        create_session_for_user(db_session, user, session_hours=8)
```

Add tests for wrong/unknown password using the same result, inactive user, lockout threshold, expired/revoked session and a membership deactivated immediately before login.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `.\.venv\Scripts\python.exe -m pytest backend/tests/test_auth_service.py -q`

Expected: imports fail because security/service modules do not exist.

- [ ] **Step 3: Add Argon2 dependency and minimal security boundaries**

Add `pwdlib[argon2]>=0.3,<1` to project dependencies. Regenerate `requirements.lock` using the repository setup convention rather than editing transitive versions by guesswork.

```python
password_hash = PasswordHash.recommended()

def hash_password(password: str) -> str:
    return password_hash.hash(password)

def verify_password(password: str, encoded: str) -> bool:
    return password_hash.verify(password, encoded)
```

Use `secrets.token_urlsafe(32)` for tokens and SHA-256 only for stored token lookup. Do not use SHA-256 for passwords.

- [ ] **Step 4: Implement repository, service and current-session dependency**

Repository queries must filter active memberships explicitly. `authenticate` must perform a dummy hash verification for unknown accounts and use a single public failure result. `create_session_for_user` selects the first active membership and raises `AccountNotAllowed` when none exists.

- [ ] **Step 5: Verify GREEN and run the existing backend suite**

Run:

```powershell
.\.venv\Scripts\python.exe -m pytest backend/tests/test_auth_service.py -q
.\.venv\Scripts\python.exe -m pytest backend/tests -q
```

Expected: all tests pass; no password, plaintext session token or SQL parameter appears in test logs.

- [ ] **Step 6: Commit**

```powershell
git add pyproject.toml requirements.lock backend/app/security backend/app/repositories backend/app/services/auth.py backend/app/tenancy/context.py backend/tests/test_auth_service.py
git commit -m "feat(auth): add password and session services"
```

### Task 3: Auth configuration, CORS and local login API

**Files:**
- Modify: `backend/app/core/config.py`
- Create: `backend/app/schemas/auth.py`
- Create: `backend/app/api/v1/__init__.py`
- Create: `backend/app/api/v1/router.py`
- Create: `backend/app/api/v1/auth.py`
- Modify: `backend/app/main.py`
- Modify: `.env.example`
- Create: `backend/tests/test_auth_api.py`
- Create: `backend/tests/test_production_config.py`

**Interfaces:**
- Consumes: Task 2 auth/session services and `CurrentSession`.
- Produces: `POST /api/v1/auth/login`, `GET /api/v1/auth/session`, `POST /api/v1/auth/logout`.
- Produces: settings fields `frontend_url`, `session_hours`, `session_cookie_secure`, `login_max_attempts`, `login_lockout_minutes`.
- Produces: `SessionResponse` with `user`, `memberships`, `selected_tenant_id` and no secret fields.

- [ ] **Step 1: Write failing API/config tests**

```python
def test_login_sets_central_http_only_cookie_and_returns_superadmin(auth_client):
    response = auth_client.post("/api/v1/auth/login", json={"email": "alex@example.com", "password": PASSWORD})
    assert response.status_code == 200
    assert response.json()["memberships"][0]["role"] == "superadmin"
    assert "central_session=" in response.headers["set-cookie"]
    assert "HttpOnly" in response.headers["set-cookie"]
    assert PASSWORD not in response.text

def test_production_rejects_insecure_cookie(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("SESSION_COOKIE_SECURE", "false")
    with pytest.raises(ValidationError):
        Settings(_env_file=None)
```

Add tests for 401 uniform errors, session restoration, expiration, logout idempotency, exact CORS origin, secure `SameSite=None` cookie, and a rejected request from an unconfigured Origin.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `.\.venv\Scripts\python.exe -m pytest backend/tests/test_auth_api.py backend/tests/test_production_config.py -q`

Expected: endpoints return 404 and production fields are absent.

- [ ] **Step 3: Implement settings and production validation**

```python
@model_validator(mode="after")
def validate_production_auth(self) -> "Settings":
    if self.environment == "production":
        if not self.session_cookie_secure:
            raise ValueError("SESSION_COOKIE_SECURE deve ser true em production")
        if not self.frontend_url.startswith("https://"):
            raise ValueError("FRONTEND_URL deve usar HTTPS em production")
    return self
```

Extend `environment` to `local | test | staging | production`. Add non-secret examples only.

- [ ] **Step 4: Implement schemas, endpoints and exact CORS**

Use cookie name `central_session`. `set_session_cookie` chooses `none` only when secure, otherwise `lax`. Install `CORSMiddleware` with `[settings.frontend_url]`, `allow_credentials=True`, explicit methods and headers. Include the versioned router at `/api/v1`.

- [ ] **Step 5: Verify GREEN and existing error contract**

Run:

```powershell
.\.venv\Scripts\python.exe -m pytest backend/tests/test_auth_api.py backend/tests/test_production_config.py backend/tests/test_bootstrap.py -q
```

Expected: all pass, including 405 `Allow` header and structured public errors.

- [ ] **Step 6: Commit**

```powershell
git add .env.example backend/app/core/config.py backend/app/schemas backend/app/api backend/app/main.py backend/tests/test_auth_api.py backend/tests/test_production_config.py
git commit -m "feat(auth): expose Central session API"
```

### Task 4: Google OAuth with pre-authorized accounts only

**Files:**
- Create: `backend/app/services/google_oauth.py`
- Modify: `backend/app/api/v1/auth.py`
- Modify: `backend/app/core/config.py`
- Modify: `.env.example`
- Modify: `backend/tests/test_auth_api.py`

**Interfaces:**
- Consumes: `create_session_for_user`, local user repository and Task 3 cookie helpers.
- Produces: `authorization_url(*, client_id: str, redirect_uri: str, state: str) -> str`.
- Produces: `exchange_google_code(*, code: str, client_id: str, client_secret: str, redirect_uri: str) -> dict`.
- Produces: `GET /api/v1/auth/google/start` and `GET /api/v1/auth/google/callback`.

- [ ] **Step 1: Write failing OAuth tests**

```python
def test_google_callback_creates_session_only_for_existing_authorized_user(auth_client, monkeypatch):
    start = auth_client.get("/api/v1/auth/google/start", follow_redirects=False)
    state = parse_qs(urlparse(start.headers["location"]).query)["state"][0]
    monkeypatch.setattr("app.api.v1.auth.exchange_google_code", AsyncMock(return_value={
        "email": "alexmacielferreira@gmail.com", "email_verified": True,
    }))
    response = auth_client.get(f"/api/v1/auth/google/callback?code=abc&state={state}", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "http://127.0.0.1:5174/"
    assert "central_session=" in response.headers["set-cookie"]
```

Add explicit tests for missing configuration, expired/mismatched state, denied consent, missing code, Google timeout/invalid response, unknown user, inactive user, unverified email, no active membership, cleared state cookie on every exit, and no database row created for an unknown Google account.

- [ ] **Step 2: Run OAuth tests and verify RED**

Run: `.\.venv\Scripts\python.exe -m pytest backend/tests/test_auth_api.py -k google -q`

Expected: Google endpoints return 404.

- [ ] **Step 3: Implement Google service and settings**

Add `google_client_id`, `google_client_secret: SecretStr | None`, `google_redirect_uri`. Production must reject an HTTP redirect whenever either Google credential is configured. The service uses a 15-second httpx timeout and only sends secrets to Google's token endpoint.

- [ ] **Step 4: Implement start and callback**

Use cookie `central_google_state`, 10-minute maximum age, `HttpOnly`, `SameSite=Lax`, and path `/api/v1/auth/google`. Callback parameters are optional so cancellation never becomes a 422. Clear state on success and every failure. Map outcomes to `invalid_state`, `access_denied`, `not_configured`, `provider_failed`, or `account_not_allowed` in the frontend login query string.

- [ ] **Step 5: Verify GREEN and scan output for secrets**

Run:

```powershell
.\.venv\Scripts\python.exe -m pytest backend/tests/test_auth_api.py -k google -q
.\.venv\Scripts\python.exe -m pytest backend/tests -q
```

Expected: all pass and test output contains no client secret, authorization code or access token.

- [ ] **Step 6: Commit**

```powershell
git add .env.example backend/app/core/config.py backend/app/services/google_oauth.py backend/app/api/v1/auth.py backend/tests/test_auth_api.py
git commit -m "feat(auth): add Central Google OAuth"
```

### Task 5: Creation-only superadmin bootstrap

**Files:**
- Modify: `backend/app/core/config.py`
- Create: `backend/app/services/bootstrap.py`
- Create: `scripts/bootstrap-admin.py`
- Create: `scripts/bootstrap-admin.ps1`
- Modify: `.env.example`
- Create: `backend/tests/test_admin_bootstrap.py`
- Modify: `README.md`

**Interfaces:**
- Consumes: Task 1 models and Task 2 password hashing.
- Produces: `bootstrap_initial_admin(session: Session, settings: Settings) -> BootstrapResult`.
- Produces: result statuses `created`, `already_configured`, `conflict`, without secret data.

- [ ] **Step 1: Write failing bootstrap tests**

```python
def test_bootstrap_creates_alex_superadmin_once(db_session, settings):
    first = bootstrap_initial_admin(db_session, settings)
    second = bootstrap_initial_admin(db_session, settings)
    assert first.status == "created"
    assert second.status == "already_configured"
    assert db_session.scalar(select(func.count(User.id))) == 1
    assert db_session.scalar(select(Membership.role)) == "superadmin"

def test_bootstrap_does_not_promote_or_reset_existing_user(db_session, settings):
    existing = seed_viewer(db_session, email=settings.bootstrap_admin_email)
    original_hash = existing.password_hash
    result = bootstrap_initial_admin(db_session, settings)
    assert result.status == "conflict"
    assert existing.password_hash == original_hash
    assert db_session.scalar(select(Membership.role)) == "viewer"
```

Add tests for missing email/password/name, invalid e-mail normalization and repeated execution in real PostgreSQL.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `.\.venv\Scripts\python.exe -m pytest backend/tests/test_admin_bootstrap.py -q`

Expected: import failure because the bootstrap service does not exist.

- [ ] **Step 3: Implement creation-only transaction**

Create a tenant with configured slug only when neither account nor tenant conflicts. If the e-mail exists without the required active superadmin membership, return `conflict` and roll back. Never compare or replace the existing password. Never run this service from application startup or OAuth callback.

- [ ] **Step 4: Add operational command and wrapper**

`scripts/bootstrap-admin.py` opens one database session, calls the service and exits nonzero for `conflict`/invalid configuration. The PowerShell wrapper validates the project virtual environment and invokes the script without echoing environment secrets.

Run it once against local PostgreSQL for local validation and once against Central's future Neon database during the controlled deployment. Never point this command at MediaMind's database. After the Neon run is verified through password login, remove `BOOTSTRAP_ADMIN_PASSWORD` from the service environment; the stored Argon2 hash remains valid.

- [ ] **Step 5: Verify GREEN in unit and PostgreSQL modes**

Run:

```powershell
.\.venv\Scripts\python.exe -m pytest backend/tests/test_admin_bootstrap.py -q
.\.venv\Scripts\python.exe -m pytest -m integration -q
```

Expected: bootstrap is idempotent and conflict leaves existing records unchanged.

- [ ] **Step 6: Commit**

```powershell
git add .env.example backend/app/core/config.py backend/app/services/bootstrap.py backend/tests/test_admin_bootstrap.py scripts/bootstrap-admin.py scripts/bootstrap-admin.ps1 README.md
git commit -m "feat(auth): add safe superadmin bootstrap"
```

### Task 6: Credentialed frontend client and AuthContext

**Files:**
- Create: `frontend/src/api/httpClient.js`
- Modify: `frontend/src/lib/AuthContext.jsx`
- Modify: `frontend/.env.example`
- Create: `frontend/src/api/httpClient.test.js`
- Create: `frontend/src/lib/AuthContext.test.jsx`

**Interfaces:**
- Consumes: Task 3 API response contract.
- Produces: `request(path: string, options?: {method?: string, body?: unknown}) -> Promise<unknown>`.
- Produces: `ApiError` with `status`, `errorCode`, `message`, `retryable`, `publicReference`.
- Produces: auth context `{user, memberships, selectedTenantId, isAuthenticated, isLoadingAuth, authChecked, authError, login, loginWithGoogle, logout, checkUserAuth}`.

- [ ] **Step 1: Write failing client and provider tests**

```javascript
it('restores a credentialed session without browser storage', async () => {
  fetch.mockResolvedValue(okResponse(sessionPayload));
  render(<AuthProvider><Probe /></AuthProvider>);
  expect(await screen.findByText('alexmacielferreira@gmail.com')).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledWith(expect.stringEndingWith('/auth/session'), expect.objectContaining({ credentials: 'include' }));
  expect(localStorage.length).toBe(0);
});
```

Add tests for 401 as anonymous without noisy error, non-401 restoration failure, login state update, logout state cleanup after server 401/204, and `loginWithGoogle` building the backend start URL only.

- [ ] **Step 2: Run frontend tests and verify RED**

Run: `npm test -- src/api/httpClient.test.js src/lib/AuthContext.test.jsx`

Expected: missing `httpClient.js` and Base44 calls observed by the provider test.

- [ ] **Step 3: Implement the focused HTTP client**

```javascript
export async function request(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${API_URL}/api/v1${path}`, {
    method,
    credentials: 'include',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw await ApiError.fromResponse(response);
  return response.status === 204 ? null : response.json();
}
```

Reject a missing `VITE_API_URL` in production build configuration; local default may be `http://127.0.0.1:8011` only during development.

- [ ] **Step 4: Replace AuthContext's Base44 auth calls**

Restore with `/auth/session`, login with `/auth/login`, logout with `/auth/logout`, and navigate Google to `${API_URL}/api/v1/auth/google/start`. Preserve the context names already consumed by `App.jsx`, `ProtectedRoute.jsx` and `AdminLayout.jsx`. Map the selected membership role onto `user.role` for the existing permissions layer.

- [ ] **Step 5: Verify GREEN and run full frontend tests**

Run:

```powershell
npm test -- src/api/httpClient.test.js src/lib/AuthContext.test.jsx
npm test
```

Expected: all frontend tests pass and assertions confirm no auth token in local/session storage.

- [ ] **Step 6: Commit**

```powershell
git add frontend/.env.example frontend/src/api/httpClient.js frontend/src/api/httpClient.test.js frontend/src/lib/AuthContext.jsx frontend/src/lib/AuthContext.test.jsx
git commit -m "feat(auth): connect Central frontend session"
```

### Task 7: Login, protected routes and tenant selection

**Files:**
- Modify: `frontend/src/pages/Login.jsx`
- Modify: `frontend/src/components/ProtectedRoute.jsx`
- Modify: `frontend/src/lib/TenantContext.jsx`
- Modify: `frontend/src/App.jsx`
- Create: `frontend/src/pages/Login.test.jsx`
- Create: `frontend/src/components/ProtectedRoute.test.jsx`
- Create: `frontend/src/lib/TenantContext.test.jsx`

**Interfaces:**
- Consumes: Task 6 auth context.
- Produces: login error copy for `invalid_state`, `access_denied`, `not_configured`, `provider_failed`, `account_not_allowed`.
- Produces: tenant list derived only from `memberships` returned by the backend.

- [ ] **Step 1: Write failing UI behavior tests**

```javascript
it('shows configuration guidance for a Google callback configuration error', () => {
  window.history.replaceState({}, '', '/login?google_error=not_configured');
  render(<Login />);
  expect(screen.getByRole('alert')).toHaveTextContent('Google ainda não está configurado neste ambiente');
});

it('does not redirect while session restoration is pending', () => {
  renderProtected({ isLoadingAuth: true, authChecked: false });
  expect(screen.getByTestId('auth-loading')).toBeInTheDocument();
  expect(mockNavigate).not.toHaveBeenCalled();
});
```

Add tests for e-mail/password submit, Google button, account-not-allowed copy, one redirect after a settled 401, superadmin role mapping, membership-derived tenants and no call to `base44.auth.updateMe`.

- [ ] **Step 2: Run UI tests and verify RED**

Run: `npm test -- src/pages/Login.test.jsx src/components/ProtectedRoute.test.jsx src/lib/TenantContext.test.jsx`

Expected: Base44 methods are still called and OAuth errors are not rendered.

- [ ] **Step 3: Connect Login and callback messages**

Use `login(email, password)` from context and `loginWithGoogle()` for the button. Preserve the existing visual structure. Translate public error codes without showing raw provider messages. Remove callback error from the URL after reading it so refresh does not repeat a stale warning.

- [ ] **Step 4: Stabilize route and tenant behavior**

ProtectedRoute renders loading until `authChecked`, redirects once on settled anonymous state, and renders its outlet only for authenticated users. TenantContext uses context memberships and keeps selection in server session only when a tenant-selection endpoint exists; until that endpoint is implemented, it must not pretend persistence or call Base44.

- [ ] **Step 5: Verify GREEN, lint, typecheck and build**

Run:

```powershell
npm test
npm run lint
npm run typecheck
npm run build
```

Expected: all pass. Build contains no required Base44 auth import in `AuthContext`, `Login`, `ProtectedRoute` or `TenantContext`.

- [ ] **Step 6: Commit**

```powershell
git add frontend/src/pages/Login.jsx frontend/src/pages/Login.test.jsx frontend/src/components/ProtectedRoute.jsx frontend/src/components/ProtectedRoute.test.jsx frontend/src/lib/TenantContext.jsx frontend/src/lib/TenantContext.test.jsx frontend/src/App.jsx
git commit -m "feat(auth): complete Central login experience"
```

### Task 8: Full verification, operational documentation and GitHub synchronization

**Files:**
- Modify: `README.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/PROJECT_STATUS.md`
- Modify: `docs/CODEX_BACKLOG.md`
- Modify: `docs/CODEX_HANDOFF.md`
- Modify: `project-status.json`
- Create: `docs/CENTRAL_AUTH_DEPLOY_CHECKLIST.md`

**Interfaces:**
- Consumes: Tasks 1–7.
- Produces: exact local/staging/production setup checklist without secrets.
- Produces: evidence-backed project status and remote `origin/main` containing reviewed commits.

- [ ] **Step 1: Run the complete local quality gate**

Run:

```powershell
.\scripts\test.ps1
.\scripts\lint.ps1
.\scripts\check.ps1
```

Expected: every check changed by this feature passes. Record any unrelated pre-existing failure by exact check name; do not hide or relabel it.

- [ ] **Step 2: Run local browser validation**

Start with `.\scripts\dev.ps1`, then verify:

1. password login as configured superadmin;
2. refresh restores the session;
3. superadmin routes and actions are available;
4. logout revokes and redirects;
5. second refresh remains logged out;
6. Google missing-configuration error is friendly until local credentials exist;
7. when Google credentials are supplied locally, Google returns to the Central callback and creates a Central session only for the existing Alex account.

Capture only non-sensitive URLs/statuses and never screenshots containing secrets.

- [ ] **Step 3: Write deployment checklist**

Document exact variable names, separate Central Google client recommendation, exact callback registration, `VITE_API_URL`, migrations-before-startup, bootstrap command, CORS/cookie checks, backup, rollback and the rule that bootstrap runs once without resetting an existing account.

- [ ] **Step 4: Update status and handoff from actual evidence**

Mark authentication checks passed only when their tests and browser validation passed. Keep M0 blocked if coverage, Base44 domain dependencies or any other M0 gate remain unresolved.

- [ ] **Step 5: Review the branch diff and secret scan**

Run:

```powershell
git diff --check origin/main...HEAD
git grep -n -E "GOOGLE_CLIENT_SECRET=.+|BOOTSTRAP_ADMIN_PASSWORD=.+|access_token|central_session=" -- ':!requirements.lock' ':!docs/superpowers/*'
git status --short
```

Expected: no committed secret values, no accidental generated files and only intentional changes.

- [ ] **Step 6: Commit documentation**

```powershell
git add README.md docs/ARCHITECTURE.md docs/PROJECT_STATUS.md docs/CODEX_BACKLOG.md docs/CODEX_HANDOFF.md docs/CENTRAL_AUTH_DEPLOY_CHECKLIST.md project-status.json
git commit -m "docs(auth): record Central authentication readiness"
```

- [ ] **Step 7: Synchronize GitHub only after all reviews**

Run:

```powershell
git fetch origin
git rebase origin/main
git push origin main
git status --short
```

Expected: push succeeds, local `main` equals `origin/main`, and working tree is clean. If remote changed, stop and reconcile commits; never force-push.
