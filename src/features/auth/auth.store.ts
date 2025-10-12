import { create } from 'zustand';

type AuthState = {
  token: string | null;
  roles: string[];
  setAuth: (t: string | null, roles?: string[]) => void;
  logout: () => void;
};

export const useAuth = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  roles: JSON.parse(localStorage.getItem('roles') || '[]'),
  setAuth: (t, roles = []) => {
    if (t) localStorage.setItem('token', t); else localStorage.removeItem('token');
    localStorage.setItem('roles', JSON.stringify(roles));
    set({ token: t, roles });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('roles');
    set({ token: null, roles: [] });
  },
}));
