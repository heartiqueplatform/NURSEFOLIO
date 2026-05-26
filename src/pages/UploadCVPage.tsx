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

  // --- MAMA'S NEW DATA STATE ---
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
      // Mama's Trick: Use the real filename so we have a list!
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const filePath = `${user.id}/${Date.now()}_${cleanFileName}`;

      const storageUrl = await databaseService.uploadFile('documents', filePath, file);

      clearInterval(interval);
      setProgress(100);

      // Update the main profile CV link to the latest one
      await databaseService.updateProfile(user.id, { cv_url: storageUrl });

      await refreshUser();
      await fetchDocs(); // Refresh our list!

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
    <div className="space-y-6 font-sans text-xs">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            Resume & CV Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Upload and manage your professional PDF documents.
          </p>
        </div>
        <button onClick={fetchDocs} className="p-2 text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-400 p-4 rounded-xl font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* UPLOAD ZONE - Always available to add more! */}
      <div
        onDragOver={handleDrag}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); e.dataTransfer.files[0] && processFile(e.dataTransfer.files[0]); }}
        className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all ${dragActive
          ? 'border-teal-500 bg-teal-50/20 dark:bg-teal-950/20'
          : 'border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/30'
          }`}
      >
        <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />

        {uploading ? (
          <div className="space-y-4 max-w-xs mx-auto">
            <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-teal-600 rounded-full animate-spin mx-auto"></div>
            <p className="font-bold text-slate-600 dark:text-slate-400">Uploading {progress}%...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-8 h-8 text-teal-600 dark:text-teal-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Drag & drop a new PDF or <button onClick={() => fileInputRef.current?.click()} className="text-teal-600 dark:text-teal-400 underline cursor-pointer">choose file</button>
            </p>
          </div>
        )}
      </div>

      {/* THE LIST OF PAPERS */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-700 dark:text-slate-300 ml-1">My Vault ({documents.length})</h3>

        {loading ? (
          <p className="text-center py-10 text-slate-400 dark:text-slate-500 italic">Nursefolio loading your papers...</p>
        ) : documents.length === 0 ? (
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-slate-800 p-10 rounded-2xl text-center text-slate-400 dark:text-slate-500">
            No documents yet.
          </div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="bg-white dark:bg-zinc-950 border-2 border-teal-50 dark:border-teal-900/30 p-5 rounded-3xl shadow-sm flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/50 text-rose-500 dark:text-rose-400 rounded-2xl flex items-center justify-center border border-rose-100 dark:border-rose-800">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-xs">
                    {/* We show a pretty name based on the date */}
                    Document_{new Date(doc.created_at).toLocaleDateString()}
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">PDF Document • Ready for download</p>
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href={doc.file_url}

                  className="flex items-center gap-1.5 px-4 py-2 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 rounded-xl font-bold hover:bg-teal-100 dark:hover:bg-teal-900/50 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">View</span>
                </a>
                <button
                  onClick={() => handleDeleteCv(doc.id, doc.file_url)}
                  className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition"
                >
                  <Trash2 className="w-5 h-5" />
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