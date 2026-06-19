import { User, BusinessUnit, Meeting, Attachment, LdapConfig } from '../types';

const BASE_URL = '/api';

function getToken(): string | null {
  return sessionStorage.getItem('agemar_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erro ${res.status}: ${res.statusText}`);
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

// Auth
export async function login(networkLogin: string, password: string): Promise<{ token: string; user: User }> {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ networkLogin, password }),
  });
}

// Unidades de Negócio
export async function getUnidades(): Promise<BusinessUnit[]> {
  return request('/unidades-negocio');
}

export async function createUnidade(data: Omit<BusinessUnit, 'id' | 'createdAt' | 'updatedAt'>): Promise<BusinessUnit> {
  return request('/unidades-negocio', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateUnidade(id: string, data: Partial<BusinessUnit>): Promise<BusinessUnit> {
  return request(`/unidades-negocio/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteUnidade(id: string): Promise<void> {
  return request(`/unidades-negocio/${id}`, { method: 'DELETE' });
}

// Reuniões
export async function getReunioes(): Promise<Meeting[]> {
  return request('/reunioes');
}

export async function createReuniao(data: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt' | 'attachments'>): Promise<Meeting> {
  return request('/reunioes', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateReuniao(id: string, data: Partial<Meeting>): Promise<Meeting> {
  return request(`/reunioes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteReuniao(id: string): Promise<void> {
  return request(`/reunioes/${id}`, { method: 'DELETE' });
}

// Anexos
export async function createAnexo(meetingId: string, data: Omit<Attachment, 'id' | 'meetingId' | 'uploadedAt'>): Promise<Attachment> {
  return request(`/reunioes/${meetingId}/anexos`, { method: 'POST', body: JSON.stringify(data) });
}

export async function deleteAnexo(id: string): Promise<void> {
  return request(`/anexos/${id}`, { method: 'DELETE' });
}

// Configuração LDAP
export async function getLdapConfig(): Promise<LdapConfig & { updatedAt?: string }> {
  return request('/configuracao-ldap');
}

export async function saveLdapConfig(data: LdapConfig): Promise<void> {
  return request('/configuracao-ldap', { method: 'PUT', body: JSON.stringify(data) });
}

export async function testLdapConnection(): Promise<{ success: boolean; message: string }> {
  return request('/configuracao-ldap/testar', { method: 'POST' });
}

// Usuários (admin)
export async function getUsuarios(): Promise<User[]> {
  return request('/usuarios');
}

export async function createUsuario(data: Omit<User, 'id'>): Promise<User> {
  return request('/usuarios', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateUsuario(id: string, data: Partial<User>): Promise<User> {
  return request(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteUsuario(id: string): Promise<void> {
  return request(`/usuarios/${id}`, { method: 'DELETE' });
}
