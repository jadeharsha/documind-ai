import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, XCircle, HelpCircle, ArrowRight, BookOpen } from 'lucide-react';
import { api } from '../services/api';
import { Document, Quiz, QuizQuestion } from '../types';
import { useWorkspaceStore } from '../stores/workspaceStore';

export const QuizzesPage: React.FC = () => {
  const { currentWorkspace } = useWorkspaceStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [loading, setLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (currentWorkspace) {
      loadDocs();
      loadQuizzes();
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

  const loadQuizzes = async () => {
    try {
      const res = await api.getQuizzes();
      setQuizzes(res.results || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId) return;

    setLoading(true);
    try {
      const created = await api.generateQuiz({
        document_id: selectedDocId,
        difficulty,
        question_count: 5
      });
      setQuizzes([created, ...quizzes]);
      setUserAnswers({});
      setShowResults(false);
    } catch (err: any) {
      alert(`Quiz generation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">AI Quiz & Knowledge Assessment</h1>
        <p className="text-xs text-slate-400 mt-1">Generate multi-format questions grounded in uploaded documents with verified page justifications.</p>
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

        <div className="w-full sm:w-48">
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="EASY">Easy / Foundational</option>
            <option value="MEDIUM">Medium / Analytical</option>
            <option value="HARD">Hard / Mastery</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={!selectedDocId || loading}
          className="w-full sm:w-auto self-end bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-semibold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-brand-600/20 flex items-center justify-center gap-2 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>{loading ? 'Synthesizing...' : 'Generate Quiz'}</span>
        </button>
      </form>

      {/* Quizzes List */}
      <div className="space-y-6">
        {quizzes.map((q) => (
          <div key={q.id} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{q.title}</h3>
                <span className="text-[10px] font-mono text-brand-400 uppercase tracking-wider">{q.difficulty} • {q.questions?.length || 0} Questions</span>
              </div>
              <button
                onClick={() => setShowResults(!showResults)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                {showResults ? 'Hide Answers' : 'Reveal Answers & Explanations'}
              </button>
            </div>

            {/* Questions List */}
            <div className="space-y-5">
              {q.questions?.map((item, idx) => (
                <div key={item.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-slate-200">
                      Q{idx + 1}. {item.question_text}
                    </span>
                    <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 shrink-0">
                      Page {item.source_page}
                    </span>
                  </div>

                  {/* Options */}
                  {item.options && item.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {item.options.map((opt, oi) => {
                        const isChosen = userAnswers[item.id] === opt;
                        const isCorrect = item.correct_answer === opt;
                        return (
                          <button
                            key={oi}
                            type="button"
                            onClick={() => setUserAnswers({ ...userAnswers, [item.id]: opt })}
                            className={`p-3 rounded-lg border text-left text-xs transition-all ${
                              showResults && isCorrect
                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-semibold'
                                : isChosen
                                ? 'bg-brand-500/10 border-brand-500/40 text-brand-300'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {showResults && (
                    <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] space-y-1 text-slate-300">
                      <p><strong className="text-emerald-400">Correct Answer:</strong> {item.correct_answer}</p>
                      <p><strong className="text-slate-400">Explanation:</strong> {item.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
