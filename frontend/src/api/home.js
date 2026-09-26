import { request } from './httpClient';

export function getHomeSummary() {
  return request('/home/summary');
}
