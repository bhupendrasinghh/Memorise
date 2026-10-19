'use client';

import React, { useState } from 'react';
import { ProductivityStats } from '@/lib/types';
import { BarChart3, TrendingUp, Calendar, Zap } from 'lucide-react';

interface PerformanceChartsProps {
  stats: ProductivityStats | null;
}

export function PerformanceCharts({ stats }: PerformanceChartsProps) {
  const [activeDayIdx, setActiveDayIdx] = useState<number | null>(null);

  if (!stats || !stats.weeklyData || stats.weeklyData.length === 0) {
    return (
      <div className="p-6 rounded-3xl glass border border-slate-200 dark:border-slate-800 animate-pulse h-64" />
    );
  }

  const weekly = stats.weeklyData;
  const maxScore = 100;
  const activeDay = activeDayIdx !== null ? weekly[activeDayIdx] : weekly[weekly.length - 1];

  return (
    <div className="p-6 rounded-3xl glass border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
              <BarChart3 className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              7-Day Productivity Trend
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Interactive daily performance score, completed tasks, and revision retention
          </p>
        </div>

        {activeDay && (
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">
                {activeDay.day} ({activeDay.date})
              </p>
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{activeDay.score}% Score</span>
                <span>• {activeDay.tasksCompleted} Tasks</span>
                <span>• {activeDay.revisionsCompleted} Revisions</span>
                <span>• {activeDay.focusMinutes}m Focus</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SVG Bar & Curve Chart */}
      <div className="relative pt-6 pb-2">
        <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 px-2">
          {weekly.map((d, idx) => {
            const heightPercent = Math.max(12, Math.min(100, d.score));
            const isHovered = activeDayIdx === idx || (activeDayIdx === null && idx === weekly.length - 1);

            return (
              <div
                key={d.date}
                onMouseEnter={() => setActiveDayIdx(idx)}
                onMouseLeave={() => setActiveDayIdx(null)}
                className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="relative w-full flex items-end justify-center h-40">
                  {/* Floating Score Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-7 px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-bold shadow-md whitespace-nowrap animate-slide-up z-10">
                      {d.score}%
                    </div>
                  )}

                  {/* Bar Background Track */}
                  <div className="w-full max-w-[36px] bg-slate-100 dark:bg-slate-800 rounded-xl h-full absolute inset-0 mx-auto" />

                  {/* Animated Score Bar */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[36px] rounded-xl transition-all duration-500 relative z-0 ${
                      isHovered
                        ? 'bg-gradient-to-t from-indigo-600 to-purple-500 shadow-lg shadow-indigo-500/30'
                        : 'bg-indigo-500/70 dark:bg-indigo-600/60 group-hover:bg-indigo-500'
                    }`}
                  >
                    {/* Inner detail stripes / dot */}
                    <div className="w-1.5 h-1.5 rounded-full bg-white/60 mx-auto mt-1.5" />
                  </div>
                </div>

                <div className="text-center">
                  <span
                    className={`text-xs font-semibold block transition-colors ${
                      isHovered
                        ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {d.day}
                  </span>
                  <span className="text-[10px] text-slate-400 hidden sm:block">
                    {d.date.substring(5)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-4 px-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <span>Overall Productivity Score (0-100%)</span>
            </span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
            <Zap className="w-3.5 h-3.5" /> Dynamic Spaced Repetition Engine
          </div>
        </div>
      </div>
    </div>
  );
}
