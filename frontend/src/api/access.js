import { request } from './httpClient';

export function listManagers() {
  return request('/access/managers');
}

export function createManager(values) {
  return request('/access/managers', { method: 'POST', body: values });
}
