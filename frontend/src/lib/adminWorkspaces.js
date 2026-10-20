const adm1Definitions = [
  ['home', 'Home do ecossistema', '/'],
  ['control-map', 'Mapa de controle', '/control-map'],
  ['resolution', 'Central de Resolução', '/resolution'],
  ['api-guides', 'Guias das APIs', '/api-guides'],
  ['saas', 'SaaS 360', '/saas'],
  ['saas-detail', 'Detalhe SaaS 360', '/saas/:id', '/saas'],
  ['administration', 'Administração', '/administration'],
  ['administration-overview', 'Visão da administração', '/administration/overview'],
  ['screen-governance', 'Governança de telas', '/experience/screens'],
  ['feature-flags', 'Módulos e feature flags', '/experience/feature-flags'],
  ['users', 'Usuários e acessos', '/users'],
  ['configurations', 'Configurações e flags', '/configurations'],
  ['operations', 'Centro de Operações', '/operations'],
  ['jobs', 'Jobs e execuções', '/operations/jobs'],
  ['audit', 'Auditoria', '/audit'],
  ['incidents', 'Incidentes', '/incidents'],
  ['integrations', 'Integrações e saúde', '/integrations'],
  ['health', 'Saúde operacional', '/health'],
  ['errors', 'Erros e evidências', '/errors'],
  ['commercial', 'Planos e produtos', '/commercial/plans'],
  ['usage', 'Uso', '/usage'],
  ['costs', 'Custos', '/costs'],
  ['ai-governance', 'Governança de IA', '/ai/governance'],
  ['storage', 'Storage e arquivos', '/storage'],
  ['releases', 'Versões e publicações', '/operations/releases'],
  ['security', 'Segurança', '/security'],
  ['privacy', 'Privacidade e LGPD', '/privacy/data-inventory'],
  ['continuity', 'Continuidade e backups', '/continuity/backups'],
  ['docs', 'Documentação operacional', '/docs'],
  ['imports', 'Importar dados', '/data/imports/new'],
]

export const ADM1_ITEMS = adm1Definitions.map(([id, label, to, entryTo = to]) => ({ id, label, to, entryTo }))

export const ADM2_ITEMS = [
  { id: 'overview', label: 'Visão do Adm 2', description: 'Mapa honesto do que já está integrado e do que ainda será construído.', iconKey: 'layout', status: 'PARCIAL', to: '/adm2' },
  { id: 'home', label: 'Minha manhã', description: 'Resumo operacional com dados disponíveis na Central.', iconKey: 'sun', status: 'PARCIAL', to: '/adm2/home' },
  { id: 'panorama', label: 'Panorama', description: 'Leitura consolidada do ecossistema sem métricas demonstrativas.', iconKey: 'chart', status: 'PARCIAL', to: '/adm2/panorama' },
  { id: 'saas', label: 'SaaS e produtos', description: 'Catálogo real de produtos conectado ao registro atual.', iconKey: 'boxes', status: 'REAL', to: '/adm2/saas' },
  { id: 'customers', label: 'Clientes e empresas', description: 'Cadastro e visão consolidada de organizações.', iconKey: 'building', status: 'PLANEJADO' },
  { id: 'access', label: 'Usuários e acessos', description: 'Identidades, papéis e permissões efetivas.', iconKey: 'users', status: 'PLANEJADO' },
  { id: 'incidents', label: 'Ocorrências e decisões', description: 'Incidentes, erros, resolução e decisões operacionais.', iconKey: 'alert', status: 'PLANEJADO' },
  { id: 'automation', label: 'Automações e IA', description: 'Execuções assistidas com governança e rastreabilidade.', iconKey: 'sparkles', status: 'PLANEJADO' },
  { id: 'operations', label: 'Jobs e processos', description: 'Fila, execução e evidências operacionais.', iconKey: 'workflow', status: 'PLANEJADO' },
  { id: 'finance', label: 'Financeiro, custos e uso', description: 'Métricas financeiras somente quando houver contratos reais.', iconKey: 'coins', status: 'BLOQUEADO' },
  { id: 'reports', label: 'Relatórios', description: 'Relatórios derivados de dados persistidos e auditáveis.', iconKey: 'file-chart', status: 'PLANEJADO' },
  { id: 'documentation', label: 'Documentação e runbooks', description: 'Operação, fontes de verdade e procedimentos vigentes.', iconKey: 'book', status: 'PLANEJADO' },
]

export const ADM2_IMPLEMENTED_ROUTES = ADM2_ITEMS.flatMap((item) => item.to ? [item.to] : [])

export function getWorkspaceForPath(pathname) {
  return pathname === '/adm2' || pathname.startsWith('/adm2/') ? 'adm2' : 'adm1'
}
