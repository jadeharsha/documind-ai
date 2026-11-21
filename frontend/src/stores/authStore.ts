import { create } from 'zustand';
import { User } from '../types';
import { api } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('documind_access_token'),
  isLoading: true,
  isAuthenticated: !!localStorage.getItem('documind_access_token'),

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const res = await api.login(credentials);
      localStorage.setItem('documind_access_token', res.tokens.access);
      localStorage.setItem('documind_refresh_token', res.tokens.refresh);
      set({
        user: res.user,
        token: res.tokens.access,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const res = await api.register(data);
      localStorage.setItem('documind_access_token', res.tokens.access);
      localStorage.setItem('documind_refresh_token', res.tokens.refresh);
      set({
        user: res.user,
        token: res.tokens.access,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('documind_access_token');
    localStorage.removeItem('documind_refresh_token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false
    });
  },

  fetchUser: async () => {
    const token = localStorage.getItem('documind_access_token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false, user: null });
      return;
    }
    try {
      const user = await api.getCurrentUser();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('documind_access_token');
      localStorage.removeItem('documind_refresh_token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  }
}));
