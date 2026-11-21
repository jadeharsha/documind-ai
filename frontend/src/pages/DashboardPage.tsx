import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  FolderGit2,
  MessageSquare,
  Bot,
  ArrowUpRight,
  Upload,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  GitCompare,
  TrendingUp
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats } from '../types';
import { useWorkspaceStore } from '../stores/workspaceStore';

export const DashboardPage: React.FC = () => {
  const { currentWorkspace } = useWorkspaceStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [currentWorkspace]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardStats(currentWorkspace?.id);
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const summary = stats?.summary || {
    total_documents: 0,
    total_workspaces: 0,
    total_conversations: 0,
    total_agent_tasks: 0,
    indexed_documents: 0,
    processing_documents: 0,
    failed_documents: 0,
    success_rate: 100
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
              Workspace: {currentWorkspace?.name || 'Default Workspace'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Document Intelligence Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time status, vector indexing health, and active agent execution timeline.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/agent"
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition-all"
          >
            <Bot className="w-4 h-4 text-brand-400" />
            <span>Launch Agent Task</span>
          </Link>
          <Link
            to="/documents"
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-brand-600/20"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Files</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Documents', value: summary.total_documents, icon: FileText, change: `${summary.indexed_documents} Indexed`, color: 'text-brand-500' },
          { label: 'Workspaces', value: summary.total_workspaces, icon: FolderGit2, change: 'Multi-Tenant', color: 'text-teal-400' },
          { label: 'AI Conversations', value: summary.total_conversations, icon: MessageSquare, change: 'Grounded RAG', color: 'text-sky-400' },
          { label: 'Agent Tasks', value: summary.total_agent_tasks, icon: Bot, change: `${summary.success_rate}% Success`, color: 'text-emerald-400' },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.label}</span>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-white tracking-tight">{card.value}</span>
                <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                  {card.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2-Column Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Uploads & Status */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Document Uploads</h3>
                <p className="text-xs text-slate-400">Processed through PyMuPDF & Qdrant vector indexer</p>
              </div>
              <Link to="/documents" className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1">
                <span>View Library</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-500 font-mono">LOADING DOCUMENTS...</div>
            ) : !stats?.recent_documents?.length ? (
              <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
                <FileText className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="font-semibold text-slate-300">No documents in this workspace yet.</p>
                <p className="text-[11px] text-slate-500 mt-1">Upload PDF, DOCX, or TXT files to begin semantic search.</p>
                <Link to="/documents" className="mt-3 inline-block bg-brand-600/20 text-brand-400 hover:bg-brand-600/30 text-xs font-semibold px-3 py-1.5 rounded-lg border border-brand-500/30 transition-all">
                  Upload First Document
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recent_documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-brand-500" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-slate-200 truncate">{doc.title}</h4>
                        <p className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{doc.file_extension.toUpperCase()}</span>
                          <span>•</span>
                          <span>{doc.page_count} pages</span>
                          <span>•</span>
                          <span>{doc.chunk_count} chunks</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider font-semibold border ${
                        doc.status === 'INDEXED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        doc.status === 'PROCESSING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' :
                        doc.status === 'FAILED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {doc.status}
                      </span>
                      <Link to="/chat" className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Grounded Chat', to: '/chat', icon: MessageSquare, desc: 'Ask with page citations' },
              { label: 'Agent Workspace', to: '/agent', icon: Bot, desc: 'Multi-step autonomous tasks' },
              { label: 'Doc Comparison', to: '/comparison', icon: GitCompare, desc: 'Detect contradictions' },
              { label: 'Research Deep Dive', to: '/research', icon: Sparkles, desc: 'Methodology & gap analysis' },
            ].map((qa, i) => {
              const Icon = qa.icon;
              return (
                <Link
                  key={i}
                  to={qa.to}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-brand-500/40 hover:bg-slate-850 transition-all group flex flex-col justify-between"
                >
                  <Icon className="w-5 h-5 text-brand-500 mb-3 group-hover:scale-110 transition-transform" />
                  <div>
                    <h5 className="text-xs font-bold text-white">{qa.label}</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">{qa.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Column: Recent Agent Tasks */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Agent Tasks</h3>
                <p className="text-[11px] text-slate-400">LangGraph state machine executions</p>
              </div>
              <Link to="/agent" className="text-xs text-brand-400 hover:text-brand-300 font-semibold">
                All Tasks
              </Link>
            </div>

            {!stats?.recent_tasks?.length ? (
              <div className="py-8 text-center text-xs text-slate-500">
                <Bot className="w-8 h-8 mx-auto text-slate-700 mb-2" />
                <p>No autonomous tasks launched yet.</p>
                <Link to="/agent" className="mt-2 text-brand-400 hover:underline inline-block font-semibold">
                  Launch an Agent Task
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recent_tasks.map((task) => (
                  <Link
                    key={task.id}
                    to="/agent"
                    className="block p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                        {task.intent || 'TASK'}
                      </span>
                      <span className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded border uppercase ${
                        task.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        task.status === 'EXECUTING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' :
                        'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 font-medium line-clamp-2">{task.task_description}</p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>{task.execution_plan?.length || 0} Steps</span>
                      <span>{task.execution_time_ms} ms</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Architecture Verification Widget */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-xs">
            <h4 className="font-bold text-slate-200 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-500" />
              <span>Production AI Safeguards</span>
            </h4>
            <ul className="space-y-2 text-[11px] text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-brand-400 font-bold">✓</span>
                <span>Deterministic calculations execute via Python, avoiding LLM math errors.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-400 font-bold">✓</span>
                <span>Citations verify back to exact page numbers and chunk character offsets.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-400 font-bold">✓</span>
                <span>Workspace-level tenant filtering strictly enforced on every Qdrant query.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
