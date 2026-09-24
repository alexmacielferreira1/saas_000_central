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

export const PUBLIC_ROUTES = [
  { path: '/login', Component: Login },
  { path: '/register', Component: Register },
  { path: '/forgot-password', Component: ForgotPassword },
  { path: '/reset-password', Component: ResetPassword },
]

export const ADMIN_ROUTES = [
  { path: '/', Component: Home },
  { path: '/resolution', Component: ResolutionCenter },
  { path: '/api-guides', Component: ApiGuides },
  { path: '/saas', Component: SaasList },
  { path: '/saas/:id', Component: SaasDetail },
  { path: '/users', Component: UsersAccess },
  { path: '/configurations', Component: Configurations },
  { path: '/operations', Component: OperationCenter },
  { path: '/audit', Component: AuditLog },
  { path: '/incidents', Component: Incidents },
  { path: '/integrations', Component: Integrations },
]
