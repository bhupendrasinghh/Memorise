'use client';

import React, { useState, useEffect } from 'react';
import { ProductivityStats, StudySession } from '@/lib/types';
import { PerformanceCharts } from '../dashboard/PerformanceCharts';
import { SubjectBreakdownCard } from '../dashboard/SubjectBreakdownCard';
import { Flame, Clock, Award, CheckCircle, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface AnalyticsViewProps {
  stats: ProductivityStats | null;
  onRefresh: () => void;
}

export function AnalyticsView({ stats, onRefresh }: AnalyticsViewProps) {
  const { success, error } = useToast();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    fetch('/api/sessions')
      .then((res) => res.json())
      .then((data) => setSessions(data.sessions || []))
      .catch((err) => console.error('Error fetching sessions:', err));
  }, []);

  const handleResetData = async () => {
    if (!confirm('Are you sure you want to restore demo sample data? This will reset the database.')) {
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      if (res.ok) {
        success('Database Reset', 'Initial topics, tasks, and historical stats restored.');
        onRefresh();
      } else {
        error('Reset failed', 'Could not reset database');
      }
    } catch {
      error('Reset failed', 'Network error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Overview Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl glass border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Award className="w-4 h-4 text-indigo-500" />
            <span>Productivity Score</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {stats?.productivityScore || 0}%
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            Weighted composite
          </p>
        </div>

        <div className="p-5 rounded-3xl glass border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Current Streak</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {stats?.streakDays || 1} Days
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
            Active daily study
          </p>
        </div>

        <div className="p-5 rounded-3xl glass border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>Completed Tasks</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {stats?.completedTasksCount || 0}/{stats?.totalTasksCount || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats?.taskCompletionRate || 0}% completion
          </p>
        </div>

        <div className="p-5 rounded-3xl glass border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Clock className="w-4 h-4 text-purple-500" />
            <span>Today Focus Time</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {stats?.todayFocusMinutes || 0}m
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Target: {stats?.targetFocusMinutes || 120}m/day
          </p>
        </div>
      </div>

      {/* 7-Day Trend Chart */}
      <PerformanceCharts stats={stats} />

      {/* Subject Mastery and Breakdown */}
      <SubjectBreakdownCard stats={stats} />

      {/* Focus Study Sessions Log Table */}
      <div className="p-6 rounded-3xl glass border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
          Recent Focus Study Sessions
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Stopwatch laps and Pomodoro sprints logged to your permanent database
        </p>

        {sessions.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No focus sessions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 px-2">Subject / Topic</th>
                  <th className="pb-3 px-2">Type</th>
                  <th className="pb-3 px-2">Duration</th>
                  <th className="pb-3 px-2">Completed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {sessions.slice(0, 8).map((ses) => (
                  <tr key={ses.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-2 font-semibold text-slate-800 dark:text-slate-200">
                      {ses.subject} {ses.topicTitle ? `— ${ses.topicTitle}` : ''}
                    </td>
                    <td className="py-3 px-2 capitalize text-slate-500">{ses.type}</td>
                    <td className="py-3 px-2 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {Math.round(ses.durationSeconds / 60)} mins
                    </td>
                    <td className="py-3 px-2 text-slate-400">
                      {ses.completedAt ? ses.completedAt.substring(0, 16).replace('T', ' ') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Data Management & Demo Reset Action */}
      <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Database Persistence & Sample Controls
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Reset or reload original demo data anytime to test fresh accounts or showcase features.
          </p>
        </div>

        <button
          onClick={handleResetData}
          disabled={isResetting}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {isResetting ? 'Resetting...' : 'Restore Demo Data'}
        </button>
      </div>
    </div>
  );
}
