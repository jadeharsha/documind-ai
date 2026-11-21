import { create } from 'zustand';
import { Workspace } from '../types';
import { api } from '../services/api';

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  fetchWorkspaces: () => Promise<void>;
  setCurrentWorkspace: (workspace: Workspace) => void;
  createWorkspace: (name: string, description?: string) => Promise<Workspace>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  isLoading: false,

  fetchWorkspaces: async () => {
    set({ isLoading: true });
    try {
      const res = await api.getWorkspaces();
      const list = res.results || [];
      const current = get().currentWorkspace;
      let active = current ? list.find(w => w.id === current.id) : null;
      if (!active && list.length > 0) {
        active = list.find(w => w.is_default) || list[0];
      }
      set({ workspaces: list, currentWorkspace: active || null, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  setCurrentWorkspace: (workspace) => {
    set({ currentWorkspace: workspace });
  },

  createWorkspace: async (name, description) => {
    const ws = await api.createWorkspace({ name, description });
    await get().fetchWorkspaces();
    return ws;
  }
}));
