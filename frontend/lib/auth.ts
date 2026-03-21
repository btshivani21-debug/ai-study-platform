import apiClient from './apiClient';

export async function register(name: string, email: string, password: string) {
  const res = await apiClient.post('/auth/register', { name, email, password });
  return res.data;
}

export async function login(email: string, password: string) {
  const res = await apiClient.post('/auth/login', { email, password });
  if (res.data.accessToken) {
    localStorage.setItem('accessToken', res.data.accessToken);
  }
  return res.data;
}

export async function logout() {
  await apiClient.post('/auth/logout');
  localStorage.removeItem('accessToken');
}

export async function refreshToken() {
  const res = await apiClient.post('/auth/refresh');
  if (res.data.accessToken) {
    localStorage.setItem('accessToken', res.data.accessToken);
  }
  return res.data;
}

export async function getMe() {
  const res = await apiClient.get('/auth/me');
  return res.data;
}
