import React, { useState, useEffect } from 'react';
import { Layers, Sparkles, RotateCw, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { api } from '../services/api';
import { Document, FlashcardDeck, Flashcard } from '../types';
import { useWorkspaceStore } from '../stores/workspaceStore';

export const FlashcardsPage: React.FC = () => {
  const { currentWorkspace } = useWorkspaceStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentWorkspace) {
      loadDocs();
      loadDecks();
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

  const loadDecks = async () => {
    try {
      const res = await api.getFlashcardDecks();
      const list = res.results || [];
      setDecks(list);
      if (list.length > 0 && !activeDeck) {
        setActiveDeck(list[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId) return;

    setLoading(true);
    try {
      const created = await api.generateFlashcardDeck({
        document_id: selectedDocId
      });
      setDecks([created, ...decks]);
      setActiveDeck(created);
      setCurrentCardIndex(0);
      setFlipped(false);
    } catch (err: any) {
      alert(`Deck creation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const cards = activeDeck?.cards || [];
  const currentCard = cards[currentCardIndex];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Active Recall Study Flashcards</h1>
        <p className="text-xs text-slate-400 mt-1">Spaced repetition and active recall study decks synthesized from document evidence.</p>
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

        <button
          type="submit"
          disabled={!selectedDocId || loading}
          className="w-full sm:w-auto self-end bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-semibold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-brand-600/20 flex items-center justify-center gap-2 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>{loading ? 'Synthesizing...' : 'Generate Flashcards'}</span>
        </button>
      </form>

      {/* Interactive Flashcard Viewer */}
      {currentCard ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-2">
            <span>Deck: {activeDeck?.title}</span>
            <span>Card {currentCardIndex + 1} of {cards.length}</span>
          </div>

          <div
            onClick={() => setFlipped(!flipped)}
            className="min-h-[260px] p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-brand-500/40 cursor-pointer shadow-2xl flex flex-col justify-between transition-all select-none"
          >
            <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400">
              <span className="text-brand-400 font-bold">{flipped ? 'Answer' : 'Question (Click to Flip)'}</span>
              <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">Source: Page {currentCard.source_page}</span>
            </div>

            <div className="my-auto py-6 text-center">
              <p className="text-base sm:text-lg font-bold text-slate-100 leading-relaxed">
                {flipped ? currentCard.back_answer : currentCard.front_question}
              </p>
            </div>

            <div className="text-center text-[10px] font-mono text-slate-500">
              {flipped ? 'Click to see question again' : 'Click card to flip and verify answer'}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                setFlipped(false);
                setCurrentCardIndex(Math.max(0, currentCardIndex - 1));
              }}
              disabled={currentCardIndex === 0}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={() => setFlipped(!flipped)}
              className="bg-brand-600/20 text-brand-300 border border-brand-500/30 text-xs font-semibold px-4 py-2 rounded-xl hover:bg-brand-600/30 transition-all flex items-center gap-1.5"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Flip Card</span>
            </button>

            <button
              onClick={() => {
                setFlipped(false);
                setCurrentCardIndex(Math.min(cards.length - 1, currentCardIndex + 1));
              }}
              disabled={currentCardIndex === cards.length - 1}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-800"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
          No active flashcard deck. Select an indexed document above to generate one.
        </div>
      )}
    </div>
  );
};
