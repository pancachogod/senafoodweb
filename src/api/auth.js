import { apiRequest } from './client.js';

export function login(email, password) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export function register(payload) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: payload,
  });
}

export function getMe(token) {
  return apiRequest('/auth/me', { token });
}

export function updateMe(token, payload) {
  return apiRequest('/auth/me', {
    method: 'PATCH',
    body: payload,
    token,
  });
}

export function requestPasswordReset(value) {
  return apiRequest('/auth/password/forgot', {
    method: 'POST',
    body: { value },
  });
}

export function validatePasswordReset(token) {
  return apiRequest('/auth/password/validate', {
    method: 'POST',
    body: { token },
  });
}

export function confirmPasswordReset(token, password) {
  return apiRequest('/auth/password/reset', {
    method: 'POST',
    body: { token, password },
  });
}
