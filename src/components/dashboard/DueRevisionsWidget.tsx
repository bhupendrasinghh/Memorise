'use client';

import React from 'react';
import { EnrichedRevisionItem } from '@/app/api/revisions/route';
import { Repeat, Calendar, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEngine } from '@/lib/audio';
import { useToast } from '@/context/ToastContext';
import { getAuthHeaders } from '@/context/AuthContext';

interface DueRevisionsWidgetProps {
  dueRevisions: EnrichedRevisionItem[];
  overdueRevisions: EnrichedRevisionItem[];
  onOpenReview: (revision: EnrichedRevisionItem) => void;
  onRefresh: () => void;
  onViewAllRevisions: () => void;
}

export function DueRevisionsWidget({
  dueRevisions,
  overdueRevisions,
  onOpenReview,
  onRefresh,
  onViewAllRevisions,
}: DueRevisionsWidgetProps) {
  const { success } = useToast();
  const allActionable = [...overdueRevisions, ...dueRevisions];

  const handleQuickComplete = async (e: React.MouseEvent, rev: EnrichedRevisionItem) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/revisions/${rev.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ rating: 'good', status: 'completed' }),
      });

      if (res.ok) {
        soundEngine.playSuccess();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
        success('Revision Completed!', `Day ${rev.intervalDays} review for "${rev.topicTitle}" recorded.`);
        onRefresh();
      }
    } catch (err) {
      console.error('Error completing revision:', err);
    }
  };

  return (
    <div className="p-6 rounded-3xl glass border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Repeat className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              Due Revisions
              {allActionable.length > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                  {allActionable.length} Due
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-500">Day 1, 3, 7, 15, 30 & 60 intervals</p>
          </div>
        </div>

        <button
          onClick={onViewAllRevisions}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
        >
          View All <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {allActionable.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
            <CheckCircle className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">All Caught Up!</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs">
            No pending revisions due for today. Keep up the high retention streak!
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[340px] pr-1">
          {allActionable.slice(0, 5).map((rev) => {
            const isOverdue = rev.computedStatus === 'overdue';

            return (
              <div
                key={rev.id}
                onClick={() => onOpenReview(rev)}
                className={`group p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isOverdue
                    ? 'border-rose-200/80 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 hover:border-rose-300'
                    : 'border-slate-200/70 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-sm'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/90 text-indigo-700 dark:text-indigo-300">
                      Day {rev.intervalDays}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {rev.subject}
                    </span>
                    {isOverdue && (
                      <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                        <AlertCircle className="w-3 h-3" /> Overdue
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {rev.topicTitle}
                  </h4>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={(e) => handleQuickComplete(e, rev)}
                    className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors"
                    title="Quick Mark Reviewed"
                    aria-label="Quick Mark Reviewed"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onOpenReview(rev)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
                  >
                    Review
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
