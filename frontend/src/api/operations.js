import { request } from './httpClient';

export function listOperations(saas) {
  const query = saas ? `?saas=${encodeURIComponent(saas)}` : '';
  return request(`/operations${query}`);
}

export function createOperation(values) {
  return request('/operations', { method: 'POST', body: values });
}

export function updateOperationStatus(id, status, reason = '') {
  return request(`/operations/${id}/status`, { method: 'PATCH', body: { status, reason } });
}
