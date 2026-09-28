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

export function listOrganizationUnits() {
  return request('/access/organization-units');
}

export function createOrganizationUnit(values) {
  return request('/access/organization-units', { method: 'POST', body: values });
}

export function listAccessAssignments() {
  return request('/access/assignments');
}

export function updateAccessAssignment(userId, values) {
  return request(`/access/users/${userId}/assignment`, { method: 'PUT', body: values });
}

export function getEffectiveAccess(userId) {
  return request(`/access/users/${userId}/effective-access`);
}
