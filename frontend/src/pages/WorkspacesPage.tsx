import React, { useState } from 'react';
import { FolderGit2, Plus, Users, Shield, Trash2, CheckCircle2 } from 'lucide-react';
import { useWorkspaceStore } from '../stores/workspaceStore';

export const WorkspacesPage: React.FC = () => {
  const { workspaces, currentWorkspace, setCurrentWorkspace, createWorkspace } = useWorkspaceStore();
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    setLoading(true);
    try {
      const created = await createWorkspace(newWorkspaceName.trim(), newWorkspaceDesc.trim());
      setCurrentWorkspace(created);
      setNewWorkspaceName('');
      setNewWorkspaceDesc('');
      setShowModal(false);
    } catch (err: any) {
      alert(`Error creating workspace: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Workspaces & Tenant Isolation</h1>
          <p className="text-xs text-slate-400 mt-1">Manage isolated tenant environments, document collections, and membership roles.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-brand-600/20 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>New Workspace</span>
        </button>
      </div>

      {/* Workspaces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workspaces.map((ws) => {
          const isActive = currentWorkspace?.id === ws.id;
          return (
            <div
              key={ws.id}
              className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-slate-900 border-brand-500/50 shadow-xl shadow-brand-500/5'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-brand-500">
                    <FolderGit2 className="w-5 h-5" />
                  </div>
                  {isActive ? (
                    <span className="text-[10px] font-mono font-bold uppercase bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-0.5 rounded">
                      Active
                    </span>
                  ) : ws.is_default ? (
                    <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                      Default
                    </span>
                  ) : null}
                </div>

                <h3 className="text-base font-bold text-white">{ws.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{ws.description || 'No description provided.'}</p>

                <div className="mt-4 flex items-center gap-4 text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>{ws.member_count} Member{ws.member_count !== 1 ? 's' : ''}</span>
                  </span>
                  <span>•</span>
                  <span>{ws.document_count} Document{ws.document_count !== 1 ? 's' : ''}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                {!isActive ? (
                  <button
                    onClick={() => setCurrentWorkspace(ws)}
                    className="text-xs font-semibold text-brand-400 hover:text-brand-300"
                  >
                    Switch to Workspace
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Creating Workspace */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Create New Workspace</h3>
            <p className="text-xs text-slate-400">Workspaces strictly isolate documents, conversations, and Qdrant vector spaces.</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Workspace Name</label>
                <input
                  type="text"
                  required
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="e.g. AI Research Group, Medical Papers"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={newWorkspaceDesc}
                  onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                  placeholder="Brief note about the documents in this workspace"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs px-4 py-2 rounded-lg"
                >
                  {loading ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
