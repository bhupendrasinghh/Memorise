'use client';

import React, { useState, useEffect } from 'react';
import { X, Cloud, Download, Upload, ShieldCheck, Database, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CloudSyncModal({ isOpen, onClose }: CloudSyncModalProps) {
  const { user } = useAuth();
  const { success, error: toastError, info } = useToast();
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/sync')
        .then((res) => res.json())
        .then((data) => setSyncStatus(data))
        .catch((err) => console.error('Failed to load sync status', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownloadBackup = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export' }),
      });
      const data = await res.json();
      
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `memorise_backup_${user?.email || 'user'}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      success('Backup Downloaded!', 'Your complete topics, tasks, and revisions are safely exported.');
    } catch (err) {
      toastError('Download Failed', 'Could not export backup data.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import', data: parsed }),
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to import backup');
      }

      success('Data Restored Successfully!', 'All topics and tasks have been restored. Reloading page...');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      toastError('Import Failed', err.message || 'Invalid backup JSON file.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800/80">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Cloud Sync & Cross-Device Data
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Persistent storage across all your phones, laptops & tablets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Active Account Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Signed In Account:</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">{user?.email || 'Not logged in'}</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs">
              {syncStatus?.isSupabaseConfigured ? (
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Supabase Cloud Database Connected
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
                  <ShieldCheck className="w-4 h-4" /> Git & Local Storage Persistence Active
                </span>
              )}
            </div>
          </div>

          {/* Quick Actions: Backup & Restore */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleDownloadBackup}
              disabled={loading}
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {loading ? 'Exporting...' : 'Download Backup'}
            </button>

            <label className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer border border-slate-300 dark:border-slate-700 transition-all">
              <Upload className="w-4 h-4 text-slate-500" />
              {importing ? 'Restoring...' : 'Restore from Backup'}
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Render Persistent Cloud Setup */}
          <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
            <div className="flex items-start gap-2.5">
              <Database className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                <p className="font-bold text-slate-900 dark:text-white">
                  Connect Free Supabase Cloud (Infinite Cross-Device Sync)
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Render free tier instances restart after periods of inactivity. To ensure your notes and revisions stay 100% saved in the cloud forever:
                </p>
                <ol className="list-decimal list-inside text-[11px] space-y-1 text-slate-600 dark:text-slate-400 pl-0.5">
                  <li>Create a free project on <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 font-semibold underline inline-flex items-center gap-0.5">supabase.com <ExternalLink className="w-2.5 h-2.5" /></a></li>
                  <li>Copy SQL from <code className="px-1 py-0.5 bg-white dark:bg-slate-900 rounded font-mono text-[10px]">supabase/schema.sql</code> and execute in SQL Editor</li>
                  <li>In your Render Dashboard, add Environment Variables:
                    <div className="mt-1.5 p-2 rounded-xl bg-slate-900 text-slate-100 font-mono text-[10px] space-y-0.5">
                      <div>NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co</div>
                      <div>SUPABASE_SERVICE_ROLE_KEY=eyJh...</div>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
