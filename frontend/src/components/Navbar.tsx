import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Bell, ShieldCheck, Database, HardDrive } from 'lucide-react';
import { useWorkspaceStore } from '../stores/workspaceStore';

export const Navbar: React.FC = () => {
  const { currentWorkspace } = useWorkspaceStore();

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Search Input */}
      <div className="flex items-center gap-4 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search across documents, citations, agent findings..."
            className="w-full bg-slate-950/60 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* System Health Indicators */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] text-slate-400 font-mono bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800/80">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            MySQL Connected
          </span>
          <span className="text-slate-700">|</span>
          <span className="flex items-center gap-1 text-slate-300">
            <Database className="w-3 h-3 text-brand-500" /> Qdrant Vector Engine
          </span>
          <span className="text-slate-700">|</span>
          <span className="flex items-center gap-1 text-slate-300">
            <ShieldCheck className="w-3 h-3 text-teal-400" /> Tenant Isolated
          </span>
        </div>

        {/* Upload Button */}
        <Link
          to="/documents"
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-all shadow-md shadow-brand-600/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Upload Document</span>
        </Link>
      </div>
    </header>
  );
};
