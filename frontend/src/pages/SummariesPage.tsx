import React, { useState, useEffect } from 'react';
import { FileStack, Sparkles, BookOpen, Clock, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { Document, DocumentSummary } from '../types';
import { useWorkspaceStore } from '../stores/workspaceStore';

export const SummariesPage: React.FC = () => {
  const { currentWorkspace } = useWorkspaceStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [summaries, setSummaries] = useState<DocumentSummary[]>([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [summaryType, setSummaryType] = useState('EXECUTIVE');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentWorkspace) {
      loadDocs();
      loadSummaries();
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

  const loadSummaries = async () => {
    try {
      const res = await api.getSummaries();
      setSummaries(res.results || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId) return;

    setLoading(true);
    try {
      const created = await api.generateSummary({
        document_id: selectedDocId,
        summary_type: summaryType
      });
      setSummaries([created, ...summaries]);
    } catch (err: any) {
      alert(`Summary generation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Document Summarization Engine</h1>
        <p className="text-xs text-slate-400 mt-1">Multi-granularity executive, section-wise, and key-finding synthesis with exact page citations.</p>
      </div>

      {/* Generation Bar */}
      <form onSubmit={handleGenerate} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1 w-full">
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">Select Document</label>
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

        <div className="w-full sm:w-56">
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">Summary Format</label>
          <select
            value={summaryType}
            onChange={(e) => setSummaryType(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="EXECUTIVE">Executive Summary</option>
            <option value="DETAILED">Detailed Analysis</option>
            <option value="SHORT">Short Overview</option>
            <option value="SECTION_WISE">Section-Wise Breakdown</option>
            <option value="KEY_POINTS">Key Bullet Points</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={!selectedDocId || loading}
          className="w-full sm:w-auto self-end bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-semibold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-brand-600/20 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>{loading ? 'Synthesizing...' : 'Generate Summary'}</span>
        </button>
      </form>

      {/* Summaries List */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Generated Summaries</h3>
        {summaries.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
            No document summaries generated yet. Select an indexed document above.
          </div>
        ) : (
          summaries.map((sum) => (
            <div key={sum.id} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400 font-bold text-xs">
                    <FileStack className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white">{sum.document_title}</h4>
                    <span className="text-[10px] font-mono text-brand-400 uppercase tracking-wider">{sum.summary_type}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  <span>Source Pages: {sum.source_pages?.join(', ') || '1'}</span>
                </div>
              </div>

              <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {sum.content}
              </div>

              {sum.key_findings && sum.key_findings.length > 0 && (
                <div className="pt-3 border-t border-slate-800/80">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">Key Takeaways</span>
                  <ul className="space-y-1.5">
                    {sum.key_findings.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
