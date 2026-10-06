/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/databaseService';
import {
  Upload, FileText, Check, AlertCircle, Trash2,
  ExternalLink, Loader2, RefreshCw
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

// ==========================================================
// TYPES
// ==========================================================
interface VaultDocument {
  id: string;
  file_url: string;
  file_path?: string;      // preferred: exact storage path
  name?: string;
  size?: number;
  created_at: string;
}

// ==========================================================
// HELPERS
// ==========================================================
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatSize(bytes?: number): string {
  if (!bytes) return 'PDF';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Fallback for older records that don't have `file_path` stored
function extractStoragePath(url: string): string | null {
  try {
    // Supabase public URL shape:
    // .../storage/v1/object/public/{bucket}/{path}
    const marker = '/object/public/';
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    const rest = url.slice(idx + marker.length);
    // rest = "{bucket}/{path...}"
    const firstSlash = rest.indexOf('/');
    if (firstSlash === -1) return null;
    return rest.slice(firstSlash + 1);
  } catch {
    return null;
  }
}

// ==========================================================
// MAIN
// ==========================================================
export default function UploadCVPage() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Messages
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Delete
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<VaultDocument | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ----------------------------------------------------------
  // Fetch
  // ----------------------------------------------------------
  const fetchDocs = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await databaseService.getUserDocuments(user.id);
      setDocuments(data || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError('Could not load your vault. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  // ----------------------------------------------------------
  // Upload
  // ----------------------------------------------------------
  const processFile = useCallback(async (file: File) => {
    if (!user?.id) return;

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are accepted.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10 MB.');
      return;
    }

    setError('');
    setSuccess('');
    setUploading(true);
    setProgress(0);

    // Fake progress that eases toward 90%
    const interval = setInterval(() => {
      setProgress(prev => (prev >= 90 ? 90 : prev + 8));
    }, 120);

    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const filePath = `${user.id}/${Date.now()}_${cleanName}`;

      const storageUrl = await databaseService.uploadFile('documents', filePath, file);

      clearInterval(interval);
      setProgress(100);

      // Update the main profile CV link to the latest upload
      await databaseService.updateProfile(user.id, { cv_url: storageUrl });
      await refreshUser();
      await fetchDocs();

      setSuccess(`"${file.name}" uploaded successfully.`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err?.message || 'Upload failed. Please try again.');
    } finally {
      clearInterval(interval);
      setUploading(false);
      // Reset input so the same file can be re-picked
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [user?.id, refreshUser, fetchDocs]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  // ----------------------------------------------------------
  // Delete
  // ----------------------------------------------------------
  const handleDeleteRequest = useCallback((doc: VaultDocument) => {
    setItemToDelete(doc);
    setShowConfirmDelete(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    if (deleting) return;
    setShowConfirmDelete(false);
    setItemToDelete(null);
  }, [deleting]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!itemToDelete || !user) return;
    setDeleting(true);
    setError('');

    try {
      // Prefer stored path; fall back to parsing the URL
      const storagePath = itemToDelete.file_path || extractStoragePath(itemToDelete.file_url);

      if (!storagePath) {
        throw new Error('Could not determine file location');
      }

      await databaseService.deleteFile('documents', storagePath);

      // Clear from profile if this was the active CV
      if (user.cv_url === itemToDelete.file_url) {
        await databaseService.updateProfile(user.id, { cv_url: null });
      }

      // Optimistic removal from list
      setDocuments(prev => prev.filter(d => d.id !== itemToDelete.id));

      await refreshUser();
      setSuccess('Document removed.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Could not delete the document. Please try again.');
    } finally {
      setDeleting(false);
      setShowConfirmDelete(false);
      setItemToDelete(null);
    }
  }, [itemToDelete, user, refreshUser]);

  if (!user) return null;

  // ==========================================================
  // RENDER
  // ==========================================================
  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-zinc-950">
      <div className="max-w-2xl mx-auto md:px-6 md:py-8 pb-24">

        {/* ============================================
            HEADER
            ============================================ */}
        <div className="px-4 md:px-0 pt-4 md:pt-0 pb-4 md:pb-6 flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-2xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
              Upload CV
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Manage your PDF documents and resume vault
            </p>
          </div>
          <button
            onClick={fetchDocs}
            disabled={loading}
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-zinc-900 transition disabled:opacity-50 flex-shrink-0"
            aria-label="Refresh documents"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* ============================================
            MESSAGES
            ============================================ */}
        {success && (
          <div className="mx-4 md:mx-0 mb-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-2xl text-sm font-semibold flex items-start gap-2 animate-in fade-in duration-150">
            <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="mx-4 md:mx-0 mb-4 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-2xl text-sm font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ============================================
            UPLOAD ZONE
            ============================================ */}
        <section className="mx-4 md:mx-0 mb-8">
          <div
            onDragOver={handleDrag}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`rounded-3xl p-8 md:p-10 text-center transition cursor-pointer ${dragActive
              ? 'bg-teal-50 dark:bg-teal-950/30 ring-2 ring-teal-500/40'
              : 'bg-slate-100 dark:bg-zinc-900 active:bg-slate-200 dark:active:bg-zinc-800'
              } ${uploading ? 'cursor-default' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processFile(file);
              }}
            />

            {uploading ? (
              <div className="max-w-xs mx-auto">
                <Loader2 className="w-8 h-8 mx-auto text-teal-600 dark:text-teal-400 animate-spin mb-4" />
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                  Uploading {Math.round(progress)}%
                </p>
                <div className="h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 mx-auto rounded-full bg-white dark:bg-zinc-950 flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Drop a PDF here, or tap to browse
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                  PDF only · Max 10 MB
                </p>
              </>
            )}
          </div>
        </section>

        {/* ============================================
            DOCUMENT LIST
            ============================================ */}
        <section className="mx-4 md:mx-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              My vault
            </h2>
            {documents.length > 0 && (
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {documents.length} {documents.length === 1 ? 'file' : 'files'}
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div
                  key={i}
                  className="h-16 bg-slate-100 dark:bg-zinc-900 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center mb-4">
                <FileText className="w-7 h-7 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No documents yet
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
                Upload your CV or resume to share it on your public profile.
              </p>
            </div>
          ) : (
            <div>
              {documents.map(doc => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  isActive={user.cv_url === doc.file_url}
                  onDelete={handleDeleteRequest}
                />
              ))}
            </div>
          )}
        </section>

      </div>

      {/* ============================================
          DELETE CONFIRMATION
          ============================================ */}
      <ConfirmModal
        isOpen={showConfirmDelete}
        title="Remove document?"
        message="This will permanently remove this file from your vault. This cannot be undone."
        confirmText={deleting ? 'Removing' : 'Remove'}
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}

// ==========================================================
// DOCUMENT ROW
// ==========================================================
const DocumentRow = React.memo<{
  doc: VaultDocument;
  isActive: boolean;
  onDelete: (doc: VaultDocument) => void;
}>(({ doc, isActive, onDelete }) => {
  const displayName = doc.name || `CV_${formatDate(doc.created_at)}.pdf`;

  return (
    <article className="bg-white dark:bg-zinc-950 p-4 border-b border-slate-100 dark:border-zinc-900 first:border-t md:first:border-t-0">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-rose-500 dark:text-rose-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {displayName}
            </h3>
            {isActive && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400">
                <Check className="w-3 h-3" />
                Active CV
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {formatSize(doc.size)} · Uploaded {formatDate(doc.created_at)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <a
          href={doc.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 active:bg-teal-100 dark:active:bg-teal-950/60 transition"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View
        </a>
        <button
          onClick={() => onDelete(doc)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 active:bg-rose-100 dark:active:bg-rose-950/50 transition ml-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Remove
        </button>
      </div>
    </article>
  );
});
DocumentRow.displayName = 'DocumentRow';