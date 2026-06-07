const API_BASE = 'https://backend-production-9eab.up.railway.app';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'error del servidor' }));
    throw new Error(err.error || 'error del servidor');
  }
  return res.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (data: { email: string; name: string; password: string; role?: string; zone?: string }) =>
      request<{ token: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  leads: {
    list: (params?: Record<string, string | number>) => {
      const qs = params ? '?' + new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      ).toString() : '';
      return request<{ leads: any[]; pagination: any }>(`/leads${qs}`);
    },
    get: (id: string) => request<any>(`/leads/${id}`),
    update: (id: string, data: any) =>
      request<any>(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    changeStatus: (id: string, attentionStatus: string) =>
      request<any>(`/leads/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ attentionStatus }),
      }),
    reassign: (id: string, vendedorAsignadoId: string) =>
      request<any>(`/leads/${id}/reassign`, {
        method: 'POST',
        body: JSON.stringify({ vendedorAsignadoId }),
      }),
    events: (id: string) => request<any[]>(`/leads/${id}/events`),
    interactions: (id: string) => request<any[]>(`/leads/${id}/interactions`),
    sendMessage: (id: string, content: string) =>
      request<any>(`/leads/${id}/send-message`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
  },
  dashboard: {
    stats: () => request<any>('/dashboard/stats'),
  },
  properties: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any[]>(`/properties${qs}`);
    },
    get: (id: string) => request<any>(`/properties/${id}`),
    lots: (id: string, status?: string) =>
      request<any[]>(`/properties/${id}/lots${status ? `?status=${status}` : ''}`),
  },
  users: {
    list: () => request<any[]>('/users'),
    vendedores: () => request<any[]>('/users/vendedores'),
    workload: () => request<any[]>('/users/workload'),
    update: (id: string, data: any) =>
      request<any>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    toggleAvailability: (id: string) =>
      request<any>(`/users/${id}/availability`, { method: 'PATCH' }),
  },
};
