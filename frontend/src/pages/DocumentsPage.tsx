import React, { useEffect, useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  FolderPlus,
  RefreshCw,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { api } from '../services/api';
import { Document } from '../types';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { Link } from 'react-router-dom';

export const DocumentsPage: React.FC = () => {
  const { currentWorkspace } = useWorkspaceStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
  }, [currentWorkspace, statusFilter]);

  const loadDocuments = async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      const res = await api.getDocuments({
        workspace_id: currentWorkspace.id,
        search: search || undefined,
        status: statusFilter || undefined
      });
      setDocuments(res.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !currentWorkspace) return;

    setUploading(true);
    setUploadProgress(`Uploading ${files[0].name}...`);

    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('workspace_id', currentWorkspace.id);

    try {
      await api.uploadDocument(formData);
      setUploadProgress('Document uploaded. Celery pipeline processing...');
      await loadDocuments();
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (docId: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}"? This will purge the file, database records, and Qdrant vectors.`)) {
      return;
    }
    try {
      await api.deleteDocument(docId);
      setDocuments(documents.filter(d => d.id !== docId));
      if (selectedDoc?.id === docId) setSelectedDoc(null);
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Document Library</h1>
          <p className="text-xs text-slate-400 mt-1">Upload and manage documents indexed in workspace: <span className="text-brand-400 font-semibold">{currentWorkspace?.name}</span></p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-brand-600/20"
          >
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Processing...' : 'Upload Document'}</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.docx,.doc,.txt,.md"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFileUpload(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className="p-8 border-2 border-dashed border-slate-800 hover:border-brand-500/50 bg-slate-900/40 hover:bg-slate-900/80 rounded-2xl text-center cursor-pointer transition-all"
      >
        <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 mx-auto mb-3">
          <Upload className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-white">Drag and drop documents here or click to browse</h4>
        <p className="text-xs text-slate-400 mt-1">Supports PDF (with page-level citations), Word DOCX, and Plain Text (up to 25 MB)</p>
        {uploading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-brand-400 font-mono animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>{uploadProgress}</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title or filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadDocuments()}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="INDEXED">Indexed & Ready</option>
            <option value="PROCESSING">Processing</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>

          <button
            onClick={loadDocuments}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Documents Grid / Table */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500 font-mono">LOADING WORKSPACE DOCUMENTS...</div>
      ) : documents.length === 0 ? (
        <div className="py-20 text-center text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
          <FileText className="w-12 h-12 mx-auto text-slate-700 mb-3" />
          <h3 className="text-sm font-bold text-slate-200">No documents found</h3>
          <p className="text-xs text-slate-500 mt-1">Upload a document above to begin intelligent search and analysis.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-brand-500" />
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold border ${
                    doc.status === 'INDEXED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    doc.status === 'PROCESSING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' :
                    doc.status === 'FAILED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                    'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {doc.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-100 line-clamp-1" title={doc.title}>
                  {doc.title}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{doc.file_name}</p>

                <div className="mt-4 grid grid-cols-3 gap-2 py-2.5 px-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] font-mono text-center">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Pages</span>
                    <span className="text-slate-200 font-semibold">{doc.page_count}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Chunks</span>
                    <span className="text-slate-200 font-semibold">{doc.chunk_count}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Size</span>
                    <span className="text-slate-200 font-semibold">{formatFileSize(doc.file_size)}</span>
                  </div>
                </div>

                {doc.error_message && (
                  <p className="mt-2 text-[11px] text-rose-400 line-clamp-2 bg-rose-500/10 p-2 rounded border border-rose-500/20">
                    {doc.error_message}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <Link
                  to="/chat"
                  className="flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat with Doc</span>
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedDoc(doc)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    title="View Metadata"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id, doc.title)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Delete Document & Qdrant Vectors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Details Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Document Metadata Details</h3>
              <button onClick={() => setSelectedDoc(null)} className="text-slate-400 hover:text-white text-xs">✕ Close</button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Document ID:</span>
                <span className="font-mono text-slate-200">{selectedDoc.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Title:</span>
                <span className="text-slate-200 font-semibold">{selectedDoc.title}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Indexed Pages:</span>
                <span className="font-mono text-slate-200">{selectedDoc.page_count} pages</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Indexed Vectors:</span>
                <span className="font-mono text-slate-200">{selectedDoc.chunk_count} Qdrant points</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Processing Latency:</span>
                <span className="font-mono text-slate-200">{selectedDoc.processing_time_ms} ms</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">MIME Type:</span>
                <span className="font-mono text-slate-200">{selectedDoc.mime_type}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedDoc(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
