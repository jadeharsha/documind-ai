import React from 'react';
import { Outlet, Link, Navigate } from 'react-router-dom';
import { Bot, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export const AuthLayout: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand-500/10 blur-[140px] pointer-events-none rounded-full"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">DocuMind<span className="text-brand-500">.ai</span></span>
        </Link>
        <p className="text-xs text-slate-400">Production-Oriented Agentic Document Intelligence SaaS</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
          <Outlet />
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-brand-500" />
          <span>Tenant Isolated • Zero Data Leaks • Encrypted Transport</span>
        </div>
      </div>
    </div>
  );
};
