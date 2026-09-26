import { request } from './httpClient';

export function listSaas() {
  return request('/saas');
}

export function createSaas(values) {
  return request('/saas', { method: 'POST', body: values });
}

export function getSaas(id) {
  return request(`/saas/${id}`);
}

export function updateSaas(id, values) {
  return request(`/saas/${id}`, { method: 'PATCH', body: values });
}

export function listAuditLogs() {
  return request('/audit');
}

export function listCapabilityManifests() {
  return request('/manifests');
}

export function getCapabilityManifest(productId) {
  return request(`/manifests/${productId}`);
}

export function upsertCapabilityManifest(productId, values) {
  return request(`/manifests/${productId}`, { method: 'PUT', body: values });
}
