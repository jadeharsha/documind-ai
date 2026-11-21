import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Sparkles,
  BookOpen,
  Copy,
  Check,
  RotateCw,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Document, Citation, Message } from '../types';
import { useWorkspaceStore } from '../stores/workspaceStore';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  confidence_score?: number;
}

export const ChatPage: React.FC = () => {
  const { currentWorkspace } = useWorkspaceStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentWorkspace) {
      loadDocuments();
    }
  }, [currentWorkspace]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadDocuments = async () => {
    try {
      const res = await api.getDocuments({ workspace_id: currentWorkspace?.id, status: 'INDEXED' });
      const docs = res.results || [];
      setDocuments(docs);
      if (docs.length > 0 && selectedDocIds.length === 0) {
        setSelectedDocIds([docs[0].id]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || !currentWorkspace || loading) return;

    const userText = inputQuery.trim();
    setInputQuery('');

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userText
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await api.queryRAG({
        query: userText,
        workspace_id: currentWorkspace.id,
        document_ids: selectedDocIds.length > 0 ? selectedDocIds : undefined
      });

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.answer,
        citations: res.citations || [],
        confidence_score: res.confidence_score
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Error: ${err.message || 'Unable to retrieve grounded evidence from Qdrant.'}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col max-w-6xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Top Header / Document Filter */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Grounded Document Q&A</h2>
            <p className="text-[11px] text-slate-400">Evidence verified with page-level citations from Qdrant</p>
          </div>
        </div>

        {/* Selected Documents Pills */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-lg pb-1 sm:pb-0">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider shrink-0">Source Context:</span>
          {documents.length === 0 ? (
            <span className="text-xs text-amber-400 italic">No indexed documents</span>
          ) : (
            documents.slice(0, 3).map(doc => {
              const isSelected = selectedDocIds.includes(doc.id);
              return (
                <button
                  key={doc.id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedDocIds(selectedDocIds.filter(id => id !== doc.id));
                    } else {
                      setSelectedDocIds([...selectedDocIds, doc.id]);
                    }
                  }}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 border ${
                    isSelected
                      ? 'bg-brand-500/20 text-brand-300 border-brand-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {doc.title}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-brand-500 mb-4 shadow-inner">
              <Bot className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-200">Ask Anything About Your Documents</h3>
            <p className="text-xs text-slate-400 max-w-md mt-1.5 leading-relaxed">
              Every factual assertion is grounded strictly in uploaded documents with page-level citations.
            </p>

            <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-lg">
              {[
                "Summarize the main methodology across pages",
                "What empirical benchmarks were tested?",
                "Are there any limitations acknowledged?",
                "Compare the findings with the baseline model"
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputQuery(suggestion)}
                  className="text-xs bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg px-3 py-2 transition-colors text-left"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/10'
                  : 'bg-slate-950/80 text-slate-200 border border-slate-800 shadow-md'
              }`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Citations Preview Box */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      Verified Citations & Evidence ({msg.citations.length})
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {msg.citations.map((c, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center justify-between text-brand-400 font-semibold mb-1">
                            <span className="truncate">Source {c.source_index}: {c.document_title}</span>
                            <span className="font-mono text-[10px] bg-brand-500/10 px-1.5 py-0.5 rounded border border-brand-500/20">
                              Page {c.page_number}
                            </span>
                          </div>
                          <p className="text-slate-400 line-clamp-2 italic">"{c.passage_excerpt}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {msg.role === 'assistant' && (
                  <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/40">
                    <span className="flex items-center gap-1 text-teal-400">
                      <ShieldCheck className="w-3 h-3" /> Grounded Proof
                    </span>
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="hover:text-slate-300 flex items-center gap-1 transition-colors"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex items-center gap-3 text-xs text-brand-400 font-mono animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <span>Retrieving chunks from Qdrant and verifying citations...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-900/95 flex items-center gap-3">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask a question grounded in selected documents..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || loading}
          className="bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-semibold text-xs px-5 py-3 rounded-xl transition-all shadow-md shadow-brand-600/20 flex items-center gap-2"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
