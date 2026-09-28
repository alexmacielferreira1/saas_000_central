import ApiGuides from '@/pages/ApiGuides'
import AuditLog from '@/pages/AuditLog'
import Configurations from '@/pages/Configurations'
import ForgotPassword from '@/pages/ForgotPassword'
import Home from '@/pages/Home'
import Incidents from '@/pages/Incidents'
import Integrations from '@/pages/Integrations'
import Login from '@/pages/Login'
import OperationCenter from '@/pages/OperationCenter'
import Register from '@/pages/Register'
import ResetPassword from '@/pages/ResetPassword'
import ResolutionCenter from '@/pages/ResolutionCenter'
import SaasDetail from '@/pages/SaasDetail'
import SaasList from '@/pages/SaasList'
import UsersAccess from '@/pages/UsersAccess'
import ImportWorkbench from '@/pages/ImportWorkbench'
import { AdministrationOverview, EcosystemMap, ErrorCenter, HealthCenter, JobsCenter } from '@/pages/ControlSurfaces'
import { AiGovernance, CommercialCenter, ContinuityCenter, DocumentationCenter, FeatureCenter, PrivacyCenter, ReleaseCenter, ScreenGovernance, SecurityCenter, StorageCenter, UsageCostCenter } from '@/pages/CapabilityCenters'

export const PUBLIC_ROUTES = [
  { path: '/login', Component: Login },
  { path: '/register', Component: Register },
  { path: '/forgot-password', Component: ForgotPassword },
  { path: '/reset-password', Component: ResetPassword },
]

export const ADMIN_ROUTES = [
  { path: '/', Component: Home },
  { path: '/control-map', Component: EcosystemMap },
  { path: '/resolution', Component: ResolutionCenter },
  { path: '/api-guides', Component: ApiGuides },
  { path: '/saas', Component: SaasList },
  { path: '/saas/:id', Component: SaasDetail },
  { path: '/administration', Component: UsersAccess },
  { path: '/administration/overview', Component: AdministrationOverview },
  { path: '/experience/screens', Component: ScreenGovernance },
  { path: '/experience/feature-flags', Component: FeatureCenter },
  { path: '/users', Component: UsersAccess },
  { path: '/configurations', Component: Configurations },
  { path: '/operations', Component: OperationCenter },
  { path: '/operations/jobs', Component: JobsCenter },
  { path: '/audit', Component: AuditLog },
  { path: '/incidents', Component: Incidents },
  { path: '/integrations', Component: Integrations },
  { path: '/health', Component: HealthCenter },
  { path: '/errors', Component: ErrorCenter },
  { path: '/commercial/plans', Component: CommercialCenter },
  { path: '/usage', Component: UsageCostCenter },
  { path: '/costs', Component: UsageCostCenter },
  { path: '/ai/governance', Component: AiGovernance },
  { path: '/storage', Component: StorageCenter },
  { path: '/operations/releases', Component: ReleaseCenter },
  { path: '/security', Component: SecurityCenter },
  { path: '/privacy/data-inventory', Component: PrivacyCenter },
  { path: '/continuity/backups', Component: ContinuityCenter },
  { path: '/docs', Component: DocumentationCenter },
  { path: '/data/imports/new', Component: ImportWorkbench },
]
