/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/databaseService';
import { Upload, FileText, Check, AlertCircle, Trash2, ExternalLink, RefreshCw } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export default function UploadCVPage() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- DATA STATE ---
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Delete State
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, url: string } | null>(null);

  // --- FETCH THE LIST ---
  const fetchDocs = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await databaseService.getUserDocuments(user.id);
      setDocuments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [user]);

  if (!user) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const processFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Only PDF documents are allowed.');
      return;
    }
    setError('');
    setUploading(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? 90 : prev + 10));
    }, 100);

    try {
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const filePath = `${user.id}/${Date.now()}_${cleanFileName}`;

      const storageUrl = await databaseService.uploadFile('documents', filePath, file);

      clearInterval(interval);
      setProgress(100);

      // Update the main profile CV link to the latest one
      await databaseService.updateProfile(user.id, { cv_url: storageUrl });

      await refreshUser();
      await fetchDocs();

      setSuccess(`"${file.name}" uploaded successfully!`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCv = (id: string, url: string) => {
    setItemToDelete({ id, url });
    setShowConfirmDelete(true);
  };

  const purseDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      // 1. Find the path from the URL
      const path = itemToDelete.url.split('/public/documents/')[1];

      // 2. Delete the actual file
      await databaseService.deleteFile('documents', path);

      // 3. If this was the main CV, clear it from profile
      if (user.cv_url === itemToDelete.url) {
        await databaseService.updateProfile(user.id, { cv_url: null });
      }

      await refreshUser();
      await fetchDocs();
      setSuccess('Document removed.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Delete failed.');
    } finally {
      setShowConfirmDelete(false);
      setItemToDelete(null);
    }
  };

  return (
    <div className="space-y-0 md:space-y-6 font-sans text-xs -mx-3 md:mx-0">

      {/* Header - full width on mobile */}
      <div className="bg-white dark:bg-zinc-950 md:rounded-2xl md:border md:border-slate-100 md:dark:border-slate-800 p-4 md:p-6 md:shadow-sm flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-100">
        <div>
          <h2 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 md:gap-2">
            <FileText className="w-5 h-5 md:w-6 md:h-6 text-teal-600 dark:text-teal-400" />
            Resume & CV Management
          </h2>
          <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-0.5 md:mt-1">
            Upload and manage your professional PDF documents.
          </p>
        </div>
        <button onClick={fetchDocs} className="p-1.5 md:p-2 text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition">
          <RefreshCw className={`w-3.5 h-3.5 md:w-4 md:h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {success && (
        <div className="mx-3 md:mx-0 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 p-2.5 md:p-4 rounded-lg md:rounded-xl font-semibold flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs">
          <Check className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="mx-3 md:mx-0 bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-400 p-2.5 md:p-4 rounded-lg md:rounded-xl font-semibold flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs">
          <AlertCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* UPLOAD ZONE - full width on mobile */}
      <div
        onDragOver={handleDrag}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); e.dataTransfer.files[0] && processFile(e.dataTransfer.files[0]); }}
        className={`mx-3 md:mx-0 border-2 border-dashed md:rounded-3xl rounded-2xl p-6 md:p-10 text-center transition-all ${dragActive
          ? 'border-teal-500 bg-teal-50/20 dark:bg-teal-950/20'
          : 'border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/30'
          }`}
      >
        <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />

        {uploading ? (
          <div className="space-y-3 md:space-y-4 max-w-xs mx-auto">
            <div className="w-8 h-8 md:w-10 md:h-10 border-3 md:border-4 border-slate-200 dark:border-slate-700 border-t-teal-600 rounded-full animate-spin mx-auto"></div>
            <p className="font-bold text-slate-600 dark:text-slate-400 text-xs md:text-sm">Uploading {progress}%...</p>
            {/* Progress bar for mobile */}
            <div className="w-full h-1.5 md:h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-600 transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5 md:space-y-2">
            <Upload className="w-6 h-6 md:w-8 md:h-8 text-teal-600 dark:text-teal-400 mx-auto mb-1 md:mb-2" />
            <p className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200">
              Drag & drop a new PDF or{' '}
              <button onClick={() => fileInputRef.current?.click()} className="text-teal-600 dark:text-teal-400 underline cursor-pointer">
                choose file
              </button>
            </p>
            <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500">PDF files only</p>
          </div>
        )}
      </div>

      {/* THE LIST OF PAPERS - feed style on mobile */}
      <div className="space-y-0 md:space-y-4">
        <h3 className="font-bold text-slate-700 dark:text-slate-300 ml-1 px-3 md:px-0 text-xs md:text-sm pt-2 md:pt-0">
          My Vault ({documents.length})
        </h3>

        {loading ? (
          <p className="text-center py-8 md:py-10 text-slate-400 dark:text-slate-500 italic text-[11px] md:text-xs">
            Loading your papers...
          </p>
        ) : documents.length === 0 ? (
          <div className="mx-3 md:mx-0 bg-white dark:bg-zinc-950 md:border md:border-slate-100 md:dark:border-slate-800 p-8 md:p-10 md:rounded-2xl text-center text-slate-400 dark:text-slate-500 text-[11px] md:text-xs">
            No documents yet.
          </div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="bg-white dark:bg-zinc-950 md:border-2 md:border-teal-50 md:dark:border-teal-900/30 p-4 md:p-5 md:rounded-3xl md:shadow-sm flex items-center justify-between group border-b border-slate-100 dark:border-zinc-800 md:border-b-2 md:border-teal-50">
              <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-rose-50 dark:bg-rose-950/50 text-rose-500 dark:text-rose-400 rounded-xl md:rounded-2xl flex items-center justify-center border border-rose-100 dark:border-rose-800 flex-shrink-0">
                  <FileText className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs md:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-[150px] md:max-w-xs">
                    Document_{new Date(doc.created_at).toLocaleDateString()}
                  </h3>
                  <p className="text-[9px] md:text-[10px] text-slate-400 dark:text-slate-500">PDF Document • Ready for download</p>
                </div>
              </div>

              <div className="flex gap-1.5 md:gap-2 flex-shrink-0 ml-2">
                <a
                  href={doc.file_url}

                  className="flex items-center gap-1 md:gap-1.5 px-3 md:px-4 py-1.5 md:py-2 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 rounded-lg md:rounded-xl font-bold hover:bg-teal-100 dark:hover:bg-teal-900/50 transition text-[10px] md:text-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">View</span>
                </a>
                <button
                  onClick={() => handleDeleteCv(doc.id, doc.file_url)}
                  className="p-1.5 md:p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg md:rounded-xl transition"
                >
                  <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={showConfirmDelete}
        title="Remove Document"
        message="Are you sure? This will delete this specific paper from your vault."
        onConfirm={purseDeleteConfirm}
        onCancel={() => setShowConfirmDelete(false)}
      />
    </div>
  );
}