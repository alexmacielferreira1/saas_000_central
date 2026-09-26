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
