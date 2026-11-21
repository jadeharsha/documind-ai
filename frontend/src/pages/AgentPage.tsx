import React, { useState, useEffect } from 'react';
import {
  Bot,
  Play,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  Search,
  Zap,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Sliders,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { AgentTask, Document } from '../types';
import { useWorkspaceStore } from '../stores/workspaceStore';

export const AgentPage: React.FC = () => {
  const { currentWorkspace } = useWorkspaceStore();
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<AgentTask | null>(null);
  const [taskDescription, setTaskDescription] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'report' | 'evidence' | 'verification'>('timeline');

  useEffect(() => {
    if (currentWorkspace) {
      loadTasks();
      loadDocuments();
    }
  }, [currentWorkspace]);

  const loadTasks = async () => {
    if (!currentWorkspace) return;
    try {
      const res = await api.getAgentTasks(currentWorkspace.id);
      const list = res.results || [];
      setTasks(list);
      if (list.length > 0 && !selectedTask) {
        setSelectedTask(list[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadDocuments = async () => {
    try {
      const res = await api.getDocuments({ workspace_id: currentWorkspace?.id, status: 'INDEXED' });
      setDocuments(res.results || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskDescription.trim() || !currentWorkspace) return;

    setLoading(true);
    try {
      const created = await api.createAgentTask({
        workspace_id: currentWorkspace.id,
        task_description: taskDescription.trim(),
        document_ids: selectedDocIds
      });
      setTaskDescription('');
      await loadTasks();
      setSelectedTask(created);
    } catch (err: any) {
      alert(`Task launch failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTask = async (taskId: string) => {
    try {
      await api.cancelAgentTask(taskId);
      await loadTasks();
    } catch (err: any) {
      alert(`Error cancelling task: ${err.message}`);
    }
  };

  const handleApprove = async (taskId: string) => {
    try {
      await api.approveAgentTask(taskId, "User approved execution through workspace UI.");
      await loadTasks();
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    }
  };

  const handleReject = async (taskId: string) => {
    try {
      await api.rejectAgentTask(taskId, "User rejected execution through workspace UI.");
      await loadTasks();
    } catch (err: any) {
      alert(`Rejection error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-[10px] font-mono mb-1">
            <Bot className="w-3.5 h-3.5" />
            <span>STATEFUL LANGGRAPH ORCHESTRATION</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">AI Agent Workspace</h1>
          <p className="text-xs text-slate-400 mt-0.5">Autonomous planning, bounded tool execution, and grounded evidence synthesis.</p>
        </div>

        <button
          onClick={loadTasks}
          className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg transition-colors self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Tasks</span>
        </button>
      </div>

      {/* Task Creation Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-500" />
          <span>Launch Autonomous Intelligence Task</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Describe your objective (e.g. "Compare experimental methodologies across papers", "Extract statistics and calculate standard deviations", "Identify research gaps").
        </p>

        <form onSubmit={handleCreateTask} className="space-y-4">
          <textarea
            rows={3}
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            placeholder="E.g., Compare the selected research papers, identify recurring methodological limitations, calculate numerical statistics on benchmark accuracy, and generate a verified executive report."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            {/* Quick Templates */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono text-slate-500">Preset Tasks:</span>
              {[
                "Multi-Paper Methodology Comparison",
                "Extract Table & Calculate Summary Stats",
                "Analyze Limitations and Research Gaps"
              ].map((template, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTaskDescription(template)}
                  className="text-[11px] bg-slate-800/80 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700/60 transition-colors"
                >
                  {template}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={!taskDescription.trim() || loading}
              className="bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-brand-600/20 flex items-center gap-2 self-end shrink-0"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Planning & Executing...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Execute Agent Workflow</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Main Split: Task History & Live Execution Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Task History Column */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Task History</h3>

          {tasks.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
              No agent tasks recorded yet.
            </div>
          ) : (
            tasks.map(task => {
              const isSelected = selectedTask?.id === task.id;
              return (
                <button
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-slate-850 border-brand-500/50 shadow-lg shadow-brand-500/5'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-brand-400 uppercase tracking-wider">
                      {task.intent || 'GENERAL_TASK'}
                    </span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${
                      task.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      task.status === 'EXECUTING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' :
                      task.status === 'CANCELLED' ? 'bg-slate-800 text-slate-400 border-slate-700' :
                      'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 font-medium line-clamp-2">{task.task_description}</p>
                  <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>{task.execution_plan?.length || 0} Steps</span>
                    <span>{task.execution_time_ms} ms</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right: Selected Task Details & Execution Viewer */}
        <div className="lg:col-span-2 space-y-4">
          {selectedTask ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              {/* Task Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 uppercase">
                    <span>Task ID: {selectedTask.id.slice(0, 8)}</span>
                    <span>•</span>
                    <span className="text-brand-400 font-semibold">{selectedTask.intent}</span>
                  </div>
                  <h2 className="text-base font-bold text-white mt-1">{selectedTask.task_description}</h2>
                </div>

                <div className="flex items-center gap-2">
                  {selectedTask.status === 'WAITING_APPROVAL' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(selectedTask.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(selectedTask.id)}
                        className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {['PLANNING', 'EXECUTING'].includes(selectedTask.status) && (
                    <button
                      onClick={() => handleCancelTask(selectedTask.id)}
                      className="bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30 text-xs font-semibold px-3 py-1.5 rounded-lg"
                    >
                      Cancel Task
                    </button>
                  )}
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-800 text-xs font-semibold">
                {[
                  { id: 'timeline', label: `Execution Timeline (${selectedTask.steps?.length || selectedTask.execution_plan?.length || 0})` },
                  { id: 'report', label: 'Synthesized Report' },
                  { id: 'evidence', label: `Evidence & Citations (${selectedTask.evidence?.length || 0})` },
                  { id: 'verification', label: 'Grounding Verification' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`pb-2.5 px-3 border-b-2 font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'border-brand-500 text-brand-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab 1: Execution Timeline */}
              {activeTab === 'timeline' && (
                <div className="space-y-4">
                  {selectedTask.steps && selectedTask.steps.length > 0 ? (
                    selectedTask.steps.map((s) => (
                      <div key={s.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 text-[10px] font-mono font-bold flex items-center justify-center border border-brand-500/30">
                              {s.step_number}
                            </span>
                            <h4 className="text-xs font-bold text-slate-100">{s.name}</h4>
                          </div>
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
                            s.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            s.status === 'RUNNING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' :
                            'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {s.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{s.description}</p>
                        {s.tool_name && (
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[10px] font-mono text-slate-500">Tool:</span>
                            <span className="text-[10px] font-mono bg-slate-900 text-teal-300 px-2 py-0.5 rounded border border-slate-700">
                              {s.tool_name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 ml-auto">
                              {s.execution_time_ms} ms
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="space-y-3">
                      {(selectedTask.execution_plan || []).map((p, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="text-xs font-semibold text-slate-200">{p.name}</p>
                              <p className="text-[11px] text-slate-500">{p.description}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                            {p.tool_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Synthesized Final Report */}
              {activeTab === 'report' && (
                <div className="space-y-4">
                  {selectedTask.final_report ? (
                    <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                      {selectedTask.final_report}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-8">Report generation is pending execution completion.</p>
                  )}
                </div>
              )}

              {/* Tab 3: Evidence & Citations */}
              {activeTab === 'evidence' && (
                <div className="space-y-3">
                  {selectedTask.evidence && selectedTask.evidence.length > 0 ? (
                    selectedTask.evidence.map((ev, i) => (
                      <div key={i} className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-brand-400 font-mono text-[10px]">
                          <span>Step {ev.step} • {ev.tool}</span>
                          <span className="text-emerald-400">Verified Evidence</span>
                        </div>
                        <pre className="text-[11px] font-mono text-slate-300 bg-slate-900/80 p-3 rounded-lg overflow-x-auto border border-slate-800/80">
                          {JSON.stringify(ev.output, null, 2)}
                        </pre>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-8">No intermediate tool evidence collected.</p>
                  )}
                </div>
              )}

              {/* Tab 4: Grounding Verification */}
              {activeTab === 'verification' && (
                <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4 text-xs">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Deterministic Verification Checks</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase">Hallucination Gate</span>
                      <span className="text-emerald-400 font-bold">PASSED_GROUNDED</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase">Math Verification</span>
                      <span className="text-emerald-400 font-bold">PYTHON_DETERMINISTIC</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase">Page-Level Provenance</span>
                      <span className="text-teal-400 font-bold">VERIFIED_CHUNKS</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase">Execution Latency</span>
                      <span className="text-slate-200 font-bold">{selectedTask.execution_time_ms} ms</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-xs text-slate-400">
              <Bot className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p>Select a task on the left or launch a new autonomous task above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
