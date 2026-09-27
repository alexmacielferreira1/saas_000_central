import { request } from './httpClient';

export function listManagers() {
  return request('/access/managers');
}

export function createManager(values) {
  return request('/access/managers', { method: 'POST', body: values });
}

export function listPermissions() {
  return request('/access/permissions');
}

export function createPermission(values) {
  return request('/access/permissions', { method: 'POST', body: values });
}

export function listProfiles() {
  return request('/access/profiles');
}

export function createProfile(values) {
  return request('/access/profiles', { method: 'POST', body: values });
}
