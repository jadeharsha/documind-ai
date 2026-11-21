import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Bot,
  FileStack,
  GitCompare,
  GraduationCap,
  Sparkles,
  Layers,
  FolderGit2,
  BarChart3,
  Settings,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useAuthStore } from '../stores/authStore';

export const Sidebar: React.FC = () => {
  const { workspaces, currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  const { user, logout } = useAuthStore();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Documents', path: '/documents', icon: FileText },
    { label: 'AI Chat (RAG)', path: '/chat', icon: MessageSquare },
    { label: 'AI Agent Workspace', path: '/agent', icon: Bot, badge: 'Pro' },
    { label: 'Summarization', path: '/summaries', icon: FileStack },
    { label: 'Doc Comparison', path: '/comparison', icon: GitCompare },
    { label: 'Research Paper Deep Dive', path: '/research', icon: GraduationCap },
    { label: 'Quiz Generator', path: '/quizzes', icon: Sparkles },
    { label: 'Study Flashcards', path: '/flashcards', icon: Layers },
    { label: 'Workspaces', path: '/workspaces', icon: FolderGit2 },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-lg tracking-tight text-white block">DocuMind<span className="text-brand-500">.ai</span></span>
          <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase block -mt-1">Document Intelligence</span>
        </div>
      </div>

      {/* Workspace Selector */}
      <div className="p-4 border-b border-slate-800/80">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 px-1">
          Active Workspace
        </label>
        <div className="relative">
          <select
            className="w-full bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-medium text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer pr-8"
            value={currentWorkspace?.id || ''}
            onChange={(e) => {
              const selected = workspaces.find(w => w.id === e.target.value);
              if (selected) setCurrentWorkspace(selected);
            }}
          >
            {workspaces.map(w => (
              <option key={w.id} value={w.id}>
                {w.name} {w.is_default ? '(Default)' : ''}
              </option>
            ))}
            {workspaces.length === 0 && <option value="">Default Workspace</option>}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-brand-500/10 text-brand-500 border border-brand-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-500 border border-brand-500/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-brand-500">
            {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.full_name || 'DocuMind User'}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.email || 'user@documind.ai'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          title="Sign Out"
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
