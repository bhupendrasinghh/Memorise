'use client';

import React, { useState } from 'react';
import { EnrichedRevisionItem } from '@/app/api/revisions/route';
import {
  X,
  Brain,
  Eye,
  EyeOff,
  File,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Plus,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEngine } from '@/lib/audio';
import { useToast } from '@/context/ToastContext';
import { RevisionRating, TopicAttachment, AttachmentType } from '@/lib/types';
import { format } from 'date-fns';
import { getAuthHeaders } from '@/context/AuthContext';
import { AttachmentViewerModal } from './AttachmentViewerModal';

interface RevisionReviewModalProps {
  revision: EnrichedRevisionItem | null;
  onClose: () => void;
  onCompleted: () => void;
}

export function RevisionReviewModal({
  revision,
  onClose,
  onCompleted,
}: RevisionReviewModalProps) {
  const { success, error } = useToast();
  const [showNotes, setShowNotes] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active attachment being viewed
  const [selectedAttachment, setSelectedAttachment] = useState<TopicAttachment | null>(null);

  // Local state for attachments on this revision topic
  const [attachments, setAttachments] = useState<TopicAttachment[]>(
    revision?.attachments || []
  );
  const [isUploading, setIsUploading] = useState(false);

  if (!revision) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    const newItems: TopicAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 15 * 1024 * 1024) {
        error('File too large', `"${file.name}" exceeds 15MB limit.`);
        continue;
      }

      let type: AttachmentType = 'other';
      const lower = file.name.toLowerCase();
      if (file.type === 'application/pdf' || lower.endsWith('.pdf')) {
        type = 'pdf';
      } else if (
        file.type.includes('word') ||
        file.type.includes('officedocument') ||
        lower.endsWith('.docx') ||
        lower.endsWith('.doc')
      ) {
        type = 'word';
      } else if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(lower)) {
        type = 'image';
      }

      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        newItems.push({
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          type,
          size: file.size,
          dataUrl,
          uploadedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Error reading file:', err);
      }
    }

    if (newItems.length > 0) {
      const updatedList = [...attachments, ...newItems];
      setAttachments(updatedList);

      // Persist to topic in DB
      try {
        await fetch(`/api/topics/${revision.topicId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ attachments: updatedList }),
        });
        success('Attachment Added', `${newItems.length} file(s) saved to this topic.`);
      } catch (e) {
        console.error('Failed to update topic attachments:', e);
      }
    }
    setIsUploading(false);
  };

  const handleRate = async (rating: RevisionRating) => {
    setIsSubmitting(true);
    const localNow = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const localDate = format(new Date(), 'yyyy-MM-dd');
    try {
      const res = await fetch(`/api/revisions/${revision.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          rating,
          notes: reviewNotes,
          status: 'completed',
          completedAt: localNow,
          clientDate: localDate,
        }),
      });

      if (res.ok) {
        soundEngine.playSuccess();
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });

        const ratingLabels = {
          again: 'Reset for follow-up review tomorrow',
          hard: 'Noted as Hard - review kept close',
          good: 'Great retention! Scheduled next interval',
          easy: 'Mastered! Extended retention achieved',
        };

        success('Revision Logged!', ratingLabels[rating]);
        onCompleted();
        onClose();
      }
    } catch (err) {
      console.error('Error rating revision:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
              Interval: Day {revision.intervalDays} (Step {revision.step}/6)
            </span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {revision.subject}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1 mb-4">
            {revision.topicTitle}
          </h2>

          {/* Active Recall Prompt Box */}
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 mb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                <Brain className="w-4 h-4" />
                <span>Active Recall Challenge</span>
              </div>
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                {showNotes ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" /> Hide Study Materials
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" /> Reveal Notes & Attachments
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Test your memory first, then reveal your attached PDFs, Word documents, diagrams, and notes.
            </p>
          </div>

          {/* Notes & Revision Attachments Area */}
          {showNotes ? (
            <div className="space-y-4 mb-5">
              {/* Text Notes */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 max-h-56 overflow-y-auto">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Saved Topic Notes:
                </h4>
                <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-mono">
                  {revision.topicContent || 'No additional text notes provided.'}
                </div>
              </div>

              {/* PDF, Word & Image Attachments for Revision */}
              <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Paperclip className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Study Materials & Revision Documents ({attachments.length})</span>
                  </div>

                  {/* Add more attachments button */}
                  <label className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Uploading...' : 'Attach PDF/Doc/Image'}</span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                </div>

                {attachments.length === 0 ? (
                  <div className="text-center py-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
                    No documents attached yet. Click &quot;Attach PDF/Doc/Image&quot; above to add study slides or diagrams.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {attachments.map((file) => (
                      <div
                        key={file.id}
                        onClick={() => setSelectedAttachment(file)}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 hover:border-indigo-500/60 dark:hover:border-indigo-500/60 shadow-xs cursor-pointer group transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              file.type === 'pdf'
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                : file.type === 'word'
                                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                                : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                            }`}
                          >
                            {file.type === 'pdf' ? (
                              <File className="w-4 h-4" />
                            ) : file.type === 'word' ? (
                              <FileText className="w-4 h-4" />
                            ) : (
                              <ImageIcon className="w-4 h-4" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {file.name}
                            </p>
                            <p className="text-[10px] text-slate-400 uppercase font-semibold">
                              {file.type} • {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>

                        <span className="shrink-0 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/40 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              onClick={() => setShowNotes(true)}
              className="p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center mb-5 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors"
            >
              <p className="text-xs font-semibold text-slate-500">
                Notes & attachments hidden for active memory recall. Click to reveal.
              </p>
              {attachments.length > 0 && (
                <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                  📎 {attachments.length} revision document(s) attached
                </p>
              )}
            </div>
          )}

          {/* Optional Reflection / Notes Input */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Revision Takeaway (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Remembered formulas well, struggled on proof step 3..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* 4 SM-2 Spaced Repetition Rating Buttons */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">
              How well did you recall this topic?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                onClick={() => handleRate('again')}
                disabled={isSubmitting}
                className="p-3 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/70 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-center transition-all transform active:scale-95"
              >
                <div className="text-xs font-bold">Again</div>
                <div className="text-[10px] opacity-80 mt-0.5">&lt; 1 Day</div>
              </button>

              <button
                onClick={() => handleRate('hard')}
                disabled={isSubmitting}
                className="p-3 rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/70 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-center transition-all transform active:scale-95"
              >
                <div className="text-xs font-bold">Hard</div>
                <div className="text-[10px] opacity-80 mt-0.5">Short Interval</div>
              </button>

              <button
                onClick={() => handleRate('good')}
                disabled={isSubmitting}
                className="p-3 rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-center transition-all transform active:scale-95"
              >
                <div className="text-xs font-bold">Good</div>
                <div className="text-[10px] opacity-80 mt-0.5">Next Interval</div>
              </button>

              <button
                onClick={() => handleRate('easy')}
                disabled={isSubmitting}
                className="p-3 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-center transition-all transform active:scale-95"
              >
                <div className="text-xs font-bold">Easy</div>
                <div className="text-[10px] opacity-80 mt-0.5">Extended Interval</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded File Viewer for PDF, Word & Image */}
      <AttachmentViewerModal
        attachment={selectedAttachment}
        onClose={() => setSelectedAttachment(null)}
      />
    </>
  );
}
