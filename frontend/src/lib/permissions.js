// Permission model for the Central SaaS Hub.
// Maps the platform auth user role to an ecosystem tier and defines which
// quick-create actions each tier may perform. Consumed by the global "Novo"
// dropdown, the Command Palette (⌘K) and per-page create buttons so every
// entry point exposes only what the logged-in user is allowed to do.

export const ROLE_TIERS = ["superadmin", "delegated_admin", "operator", "viewer"];

// Create-action ids mirror ACTIONS in @/lib/quickActions.
export const ROLE_CAPABILITIES = {
  superadmin: ["saas", "incident", "config", "operation", "manager", "product-user"],
  delegated_admin: ["incident", "config", "operation", "product-user"],
  operator: ["incident", "operation", "product-user"],
  viewer: [],
};

// Resolve the ecosystem tier for the logged-in platform user.
export function tierForUser(user) {
  if (!user) return "viewer";
  if (user.role === "admin") return "superadmin";
  if (user.role === "user") return "viewer";
  if (ROLE_TIERS.includes(user.role)) return user.role;
  return "viewer";
}