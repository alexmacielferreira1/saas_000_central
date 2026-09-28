import { request } from './httpClient';

export const listConnections = () => request('/integrations/connections');
export const createConnection = (values) => request('/integrations/connections', { method: 'POST', body: values });
export const listObservations = (connectionId = '') => request(`/integrations/observations${connectionId ? `?connection_id=${encodeURIComponent(connectionId)}` : ''}`);
export const probeConnection = (connectionId) => request(`/integrations/connections/${connectionId}/probe`, { method: 'POST' });
