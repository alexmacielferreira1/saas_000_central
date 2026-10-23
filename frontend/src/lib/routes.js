import { Suspense, createElement, lazy } from 'react'
import Login from '@/pages/Login'

// Cada página administrativa vira um chunk próprio, carregado sob demanda. O Suspense
// fica dentro do componente da rota para manter o contrato { path, Component } intacto.
function lazyPage(loader, exportName = 'default') {
  const Page = lazy(() => loader().then((module) => ({ default: module[exportName] })))
  function LazyRoute(props) {
    return createElement(
      Suspense,
      { fallback: createElement('div', { className: 'h-64 animate-pulse rounded-xl bg-slate-100' }) },
      createElement(Page, props),
    )
  }
  LazyRoute.lazyRoute = true
  return LazyRoute
}

const controlSurfaces = () => import('@/pages/ControlSurfaces')
const capabilityCenters = () => import('@/pages/CapabilityCenters')

const ApiGuides = lazyPage(() => import('@/pages/ApiGuides'))
const AuditLog = lazyPage(() => import('@/pages/AuditLog'))
const Configurations = lazyPage(() => import('@/pages/Configurations'))
const ForgotPassword = lazyPage(() => import('@/pages/ForgotPassword'))
const Home = lazyPage(() => import('@/pages/Home'))
const Incidents = lazyPage(() => import('@/pages/Incidents'))
const Integrations = lazyPage(() => import('@/pages/Integrations'))
const OperationCenter = lazyPage(() => import('@/pages/OperationCenter'))
const Register = lazyPage(() => import('@/pages/Register'))
const ResetPassword = lazyPage(() => import('@/pages/ResetPassword'))
const ResolutionCenter = lazyPage(() => import('@/pages/ResolutionCenter'))
const SaasDetail = lazyPage(() => import('@/pages/SaasDetail'))
const SaasList = lazyPage(() => import('@/pages/SaasList'))
const UsersAccess = lazyPage(() => import('@/pages/UsersAccess'))
const ImportWorkbench = lazyPage(() => import('@/pages/ImportWorkbench'))
const AdministrationOverview = lazyPage(controlSurfaces, 'AdministrationOverview')
const EcosystemMap = lazyPage(controlSurfaces, 'EcosystemMap')
const ErrorCenter = lazyPage(controlSurfaces, 'ErrorCenter')
const HealthCenter = lazyPage(controlSurfaces, 'HealthCenter')
const JobsCenter = lazyPage(controlSurfaces, 'JobsCenter')
const AiGovernance = lazyPage(capabilityCenters, 'AiGovernance')
const CommercialCenter = lazyPage(capabilityCenters, 'CommercialCenter')
const ContinuityCenter = lazyPage(capabilityCenters, 'ContinuityCenter')
const DocumentationCenter = lazyPage(capabilityCenters, 'DocumentationCenter')
const FeatureCenter = lazyPage(capabilityCenters, 'FeatureCenter')
const PrivacyCenter = lazyPage(capabilityCenters, 'PrivacyCenter')
const ReleaseCenter = lazyPage(capabilityCenters, 'ReleaseCenter')
const ScreenGovernance = lazyPage(capabilityCenters, 'ScreenGovernance')
const SecurityCenter = lazyPage(capabilityCenters, 'SecurityCenter')
const StorageCenter = lazyPage(capabilityCenters, 'StorageCenter')
const UsageCostCenter = lazyPage(capabilityCenters, 'UsageCostCenter')

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
