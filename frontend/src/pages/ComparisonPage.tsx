import React, { useState, useEffect } from 'react';
import { GitCompare, Sparkles, CheckCircle2, AlertTriangle, Layers, FileText } from 'lucide-react';
import { api } from '../services/api';
import { Document, DocumentComparison } from '../types';
import { useWorkspaceStore } from '../stores/workspaceStore';

export const ComparisonPage: React.FC = () => {
  const { currentWorkspace } = useWorkspaceStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [comparisons, setComparisons] = useState<DocumentComparison[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentWorkspace) {
      loadDocs();
      loadComparisons();
    }
  }, [currentWorkspace]);

  const loadDocs = async () => {
    try {
      const res = await api.getDocuments({ workspace_id: currentWorkspace?.id, status: 'INDEXED' });
      setDocuments(res.results || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadComparisons = async () => {
    try {
      const res = await api.getComparisons(currentWorkspace?.id);
      setComparisons(res.results || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDocIds.length < 2 || !currentWorkspace) {
      alert("Please select at least 2 documents to compare.");
      return;
    }

    setLoading(true);
    try {
      const created = await api.createComparison({
        workspace_id: currentWorkspace.id,
        document_ids: selectedDocIds,
        title: `Multi-Document Comparison (${selectedDocIds.length} Papers)`
      });
      setComparisons([created, ...comparisons]);
    } catch (err: any) {
      alert(`Comparison failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Multi-Document Comparison & Contradiction Detection</h1>
        <p className="text-xs text-slate-400 mt-1">Simultaneously evaluate multiple research papers to discover shared claims, opposing metrics, and information gaps.</p>
      </div>

      {/* Document Selection for Comparison */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Select Documents to Compare (Min 2)</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {documents.map((d) => {
            const isSelected = selectedDocIds.includes(d.id);
            return (
              <div
                key={d.id}
                onClick={() => {
                  if (isSelected) {
                    setSelectedDocIds(selectedDocIds.filter(id => id !== d.id));
                  } else {
                    setSelectedDocIds([...selectedDocIds, d.id]);
                  }
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-brand-500/10 border-brand-500/50 shadow-md shadow-brand-500/5'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className={`w-4 h-4 ${isSelected ? 'text-brand-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-semibold text-slate-200 truncate">{d.title}</span>
                </div>
                <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-brand-500 border-brand-500 text-slate-950' : 'border-slate-700'
                }`}>
                  {isSelected && <CheckCircle2 className="w-3 h-3" />}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleCompare}
          disabled={selectedDocIds.length < 2 || loading}
          className="bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-semibold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-brand-600/20 flex items-center gap-2"
        >
          <GitCompare className="w-4 h-4" />
          <span>{loading ? 'Analyzing Differences & Contradictions...' : `Compare ${selectedDocIds.length} Selected Documents`}</span>
        </button>
      </div>

      {/* Comparisons History & Results */}
      <div className="space-y-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Comparative Intelligence Reports</h3>

        {comparisons.map((c) => (
          <div key={c.id} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <span className="text-[10px] font-mono text-brand-400 uppercase tracking-wider block mb-1">Comparative Synthesis</span>
              <h3 className="text-base font-bold text-white">{c.title}</h3>
            </div>

            {/* 4 Cards Grid: Similarities, Differences, Contradictions, Missing Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/20 space-y-2">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Commonalities & Similarities</span>
                </h4>
                <ul className="space-y-1 text-xs text-slate-300">
                  {c.similarities.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5">• <span>{item}</span></li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/20 space-y-2">
                <h4 className="text-xs font-bold text-amber-400 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>Key Methodological Differences</span>
                </h4>
                <ul className="space-y-1 text-xs text-slate-300">
                  {c.differences.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5">• <span>{item}</span></li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-rose-500/20 space-y-2">
                <h4 className="text-xs font-bold text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Detected Contradictions</span>
                </h4>
                <ul className="space-y-1 text-xs text-slate-300">
                  {c.contradictions.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5">• <span>{item}</span></li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Missing Information & Omissions</span>
                </h4>
                <ul className="space-y-1 text-xs text-slate-400">
                  {c.missing_information.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5">• <span>{item}</span></li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Narrative Synthesis */}
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
              {c.narrative_report}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
