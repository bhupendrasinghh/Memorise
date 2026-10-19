'use client';

import React from 'react';
import { ProductivityStats } from '@/lib/types';
import { Sparkles, TrendingUp, CheckCircle, Repeat, Clock } from 'lucide-react';

interface ProductivityCardProps {
  stats: ProductivityStats | null;
  loading?: boolean;
}

export function ProductivityCard({ stats, loading }: ProductivityCardProps) {
  if (loading || !stats) {
    return (
      <div className="p-6 rounded-3xl glass border border-slate-200 dark:border-slate-800 animate-pulse h-64 flex items-center justify-center">
        <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  const score = stats.productivityScore;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = (val: number) => {
    if (val >= 80) return 'text-emerald-500 stroke-emerald-500';
    if (val >= 50) return 'text-indigo-500 stroke-indigo-500';
    return 'text-amber-500 stroke-amber-500';
  };

  const getScoreBadge = (val: number) => {
    if (val >= 85) return { text: 'Peak Productivity', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' };
    if (val >= 65) return { text: 'Great Consistency', bg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300' };
    if (val >= 40) return { text: 'Steady Progress', bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300' };
    return { text: 'Action Needed', bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300' };
  };

  const badge = getScoreBadge(score);

  return (
    <div className="p-6 rounded-3xl glass border border-slate-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
        {/* Left: Score Ring & Headline */}
        <div className="flex items-center gap-6">
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-slate-100 dark:stroke-slate-800 fill-none"
                strokeWidth="10"
              />
              <circle
                cx="64"
                cy="64"
                r={radius}
                className={`${getScoreColor(score)} fill-none transition-all duration-1000 ease-out`}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {score}%
              </span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Productivity
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${badge.bg}`}>
                {badge.text}
              </span>
              <span className="flex items-center text-xs text-slate-500 font-medium">
                <TrendingUp className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Auto-calculated
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Today’s Performance
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1 leading-relaxed">
              Calculated dynamically from your completed spaced revisions, task checklist, and study focus hours.
            </p>
          </div>
        </div>

        {/* Right: Key Breakdown Indicators */}
        <div className="grid grid-cols-3 gap-3 w-full md:w-auto shrink-0">
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center min-w-[95px]">
            <div className="w-7 h-7 mx-auto mb-1.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Repeat className="w-3.5 h-3.5" />
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white">
              {stats.revisionCompletionRate}%
            </div>
            <div className="text-[10px] text-slate-500 font-medium truncate">Revisions</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center min-w-[95px]">
            <div className="w-7 h-7 mx-auto mb-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white">
              {stats.taskCompletionRate}%
            </div>
            <div className="text-[10px] text-slate-500 font-medium truncate">Tasks Done</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center min-w-[95px]">
            <div className="w-7 h-7 mx-auto mb-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white">
              {stats.todayFocusMinutes}m
            </div>
            <div className="text-[10px] text-slate-500 font-medium truncate">Focus Time</div>
          </div>
        </div>
      </div>
    </div>
  );
}
