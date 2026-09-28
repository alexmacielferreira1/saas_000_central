import { request } from './httpClient';

export const listControlResources = (kind = '') => request(`/control-resources${kind ? `?kind=${encodeURIComponent(kind)}` : ''}`);
export const createControlResource = (values) => request('/control-resources', { method: 'POST', body: values });
export const updateControlResource = (id, values) => request(`/control-resources/${id}`, { method: 'PATCH', body: values });
