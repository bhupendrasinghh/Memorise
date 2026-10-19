'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  MessageSquare,
  Clock,
  Phone,
  CheckCircle2,
  Send,
  Copy,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WhatsAppModal({ isOpen, onClose }: WhatsAppModalProps) {
  const { user } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [phone, setPhone] = useState(user?.whatsappNumber || '');
  const [time, setTime] = useState(user?.whatsappTime || '17:00');
  const [enabled, setEnabled] = useState(Boolean(user?.whatsappEnabled));

  const [reportText, setReportText] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [stats, setStats] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  // Fetch report preview and settings on open
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/whatsapp')
        .then((res) => res.json())
        .then((data) => {
          if (data.settings) {
            setPhone(data.settings.whatsappNumber || '');
            setTime(data.settings.whatsappTime || '17:00');
            setEnabled(data.settings.whatsappEnabled);
          }
          if (data.report) setReportText(data.report);
          if (data.whatsappUrl) setWhatsappUrl(data.whatsappUrl);
          if (data.stats) setStats(data.stats);
        })
        .catch((err) => console.error('Failed to load WhatsApp preview:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsappNumber: phone,
          whatsappTime: time,
          whatsappEnabled: enabled,
        }),
      });

      if (!res.ok) throw new Error('Failed to save settings');
      const data = await res.json();
      success('WhatsApp Settings Saved!', `Daily report scheduled at ${time} for ${phone || 'your number'}.`);

      // Refresh preview
      const previewRes = await fetch('/api/whatsapp');
      const previewData = await previewRes.json();
      if (previewData.report) setReportText(previewData.report);
      if (previewData.whatsappUrl) setWhatsappUrl(previewData.whatsappUrl);
    } catch (err: any) {
      toastError('Save Failed', err.message || 'Could not update WhatsApp settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendNow = async () => {
    if (!phone) {
      toastError('Phone Number Required', 'Please enter your WhatsApp number with country code (e.g. +91 95289...).');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank');
      }

      success('Daily Report Ready!', 'Opening WhatsApp with your formatted tasks, revisions & performance score.');
    } catch (err: any) {
      toastError('Send Failed', err.message || 'Could not send WhatsApp report.');
    } finally {
      setSending(false);
    }
  };

  const handleCopy = () => {
    if (!reportText) return;
    navigator.clipboard.writeText(reportText);
    success('Copied to Clipboard!', 'You can paste the formatted report anywhere.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/80 shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                WhatsApp Daily Report & Alerts
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                  5:00 PM
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Receive pending tasks, due revisions & performance % directly on WhatsApp
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
          {/* Quick Metrics Badge */}
          {stats && (
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <div className="text-center">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Pending Tasks</p>
                <p className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
                  {stats.remainingTasksCount} Left
                </p>
              </div>
              <div className="text-center border-x border-slate-200 dark:border-slate-700">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Due Revisions</p>
                <p className="text-sm font-extrabold text-rose-600 dark:text-rose-400">
                  {stats.dueRevisionsCount} Due
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Performance</p>
                <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                  {stats.performancePercent}%
                </p>
              </div>
            </div>
          )}

          {/* Configuration Form */}
          <div className="space-y-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Reminder Schedule & Phone Number
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp Number (with Country Code)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. +91 95289 12345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Daily Report Time
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Enable Daily WhatsApp Digest at {time}
                </span>
              </label>

              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>

          {/* WhatsApp Message Preview Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp Message Preview
              </span>
              <button
                onClick={handleCopy}
                className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> Copy Text
              </button>
            </div>

            <pre className="p-3.5 rounded-2xl bg-emerald-950/10 dark:bg-emerald-950/20 border border-emerald-500/30 text-emerald-950 dark:text-emerald-200 font-mono text-[11px] whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto select-all">
              {reportText || 'Generating today\'s live report...'}
            </pre>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleSendNow}
              disabled={sending}
              className="w-full flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/25 transition-all transform active:scale-95 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Dispatching...' : 'Send Now to WhatsApp'}
            </button>

            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
