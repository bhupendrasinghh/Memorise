'use client';

import React, { useState } from 'react';
import { EnrichedRevisionItem } from '@/app/api/revisions/route';
import { X, CheckCircle2, Eye, EyeOff, Brain, Sparkles, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEngine } from '@/lib/audio';
import { useToast } from '@/context/ToastContext';
import { RevisionRating } from '@/lib/types';

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
  const { success } = useToast();
  const [showNotes, setShowNotes] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!revision) return null;

  const handleRate = async (rating: RevisionRating) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/revisions/${revision.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          notes: reviewNotes,
          status: 'completed',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative my-8">
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
                  <EyeOff className="w-3.5 h-3.5" /> Hide Notes
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" /> Reveal Notes & Answers
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Test yourself from memory first before revealing your saved notes below.
          </p>
        </div>

        {/* Notes Reveal / Hide Area */}
        {showNotes ? (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 mb-5 max-h-60 overflow-y-auto">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Saved Topic Notes:</h4>
            <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-mono">
              {revision.topicContent || 'No additional notes provided for this topic.'}
            </div>
          </div>
        ) : (
          <div
            onClick={() => setShowNotes(true)}
            className="p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center mb-5 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors"
          >
            <p className="text-xs font-semibold text-slate-500">
              Notes hidden for active memory recall. Click to reveal.
            </p>
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
              <div className="text-[10px] opacity-80 mt-0.5">Slow Recall</div>
            </button>

            <button
              onClick={() => handleRate('good')}
              disabled={isSubmitting}
              className="p-3 rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/70 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-center transition-all transform active:scale-95"
            >
              <div className="text-xs font-bold">Good</div>
              <div className="text-[10px] opacity-80 mt-0.5">On Schedule</div>
            </button>

            <button
              onClick={() => handleRate('easy')}
              disabled={isSubmitting}
              className="p-3 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-center transition-all transform active:scale-95"
            >
              <div className="text-xs font-bold">Easy</div>
              <div className="text-[10px] opacity-80 mt-0.5">Instant recall</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
