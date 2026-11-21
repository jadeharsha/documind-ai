import React, { useState, useEffect } from 'react';
import { GraduationCap, Sparkles, BookOpen, Layers, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { Document, ResearchAnalysis } from '../types';
import { useWorkspaceStore } from '../stores/workspaceStore';

export const ResearchPage: React.FC = () => {
  const { currentWorkspace } = useWorkspaceStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [analyses, setAnalyses] = useState<ResearchAnalysis[]>([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentWorkspace) {
      loadDocs();
      loadAnalyses();
    }
  }, [currentWorkspace]);

  const loadDocs = async () => {
    try {
      const res = await api.getDocuments({ workspace_id: currentWorkspace?.id, status: 'INDEXED' });
      const docs = res.results || [];
      setDocuments(docs);
      if (docs.length > 0 && !selectedDocId) {
        setSelectedDocId(docs[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAnalyses = async () => {
    try {
      const res = await api.getResearchAnalyses();
      setAnalyses(res.results || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId) return;

    setLoading(true);
    try {
      const res = await api.analyzeResearchPaper(selectedDocId);
      setAnalyses([res, ...analyses]);
    } catch (err: any) {
      alert(`Research analysis failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[10px] font-mono mb-1">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>ACADEMIC DECONSTRUCTION & GAP MINING</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Research Paper Analysis Workspace</h1>
        <p className="text-xs text-slate-400 mt-0.5">Automated extraction of research objectives, methodologies, empirical datasets, and discovery of open research gaps.</p>
      </div>

      {/* Trigger Bar */}
      <form onSubmit={handleAnalyze} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1 w-full">
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">Select Research Paper</label>
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {documents.map((d) => (
              <option key={d.id} value={d.id}>{d.title} ({d.page_count} pages)</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={!selectedDocId || loading}
          className="w-full sm:w-auto self-end bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-semibold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-brand-600/20 flex items-center justify-center gap-2 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>{loading ? 'Deconstructing Paper Architecture...' : 'Analyze Research Paper'}</span>
        </button>
      </form>

      {/* Analysis Results */}
      <div className="space-y-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deconstructed Papers</h3>

        {analyses.map((an) => (
          <div key={an.id} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[10px] font-mono text-teal-400 uppercase tracking-wider block mb-1">Academic Breakdown</span>
              <h3 className="text-base font-bold text-white">{an.title}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-brand-400 font-bold block">1. Research Objectives</span>
                <p className="text-slate-300 leading-relaxed">{an.objectives}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-teal-400 font-bold block">2. Methodology & Architecture</span>
                <p className="text-slate-300 leading-relaxed">{an.methodology}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">3. Datasets & Benchmarks</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {an.datasets.map((ds, i) => (
                    <span key={i} className="bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800 font-mono text-[11px]">
                      {ds}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-rose-400 font-bold block">4. Boundary Conditions & Limitations</span>
                <p className="text-slate-300 leading-relaxed">{an.limitations}</p>
              </div>
            </div>

            {/* Potential Research Gaps Section */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-brand-950/40 to-slate-950 border border-brand-500/30 space-y-3">
              <h4 className="text-xs font-bold text-brand-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                <span>Identified Potential Research Gaps (Open Questions for Future Work)</span>
              </h4>
              <ul className="space-y-2 text-xs">
                {an.research_gaps.map((gap, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-200">
                    <span className="text-brand-400 font-bold font-mono">[{i+1}]</span>
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
