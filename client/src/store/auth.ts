import { create } from 'zustand';
import type { User } from '@/types';

const API_BASE = 'https://backend-production-9eab.up.railway.app/api';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  load: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'error del servidor' }));
      throw new Error(err.error || 'error del servidor');
    }
    const data = await res.json();
    localStorage.setItem('token', data.token);
    set({ user: data.user, token: data.token });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
  updateUser: (user) => set({ user }),
  load: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ loading: false });
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        localStorage.removeItem('token');
        set({ user: null, token: null, loading: false });
        return;
      }
      const user = await res.json();
      set({ user, token, loading: false });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, loading: false });
    }
  },
}));
