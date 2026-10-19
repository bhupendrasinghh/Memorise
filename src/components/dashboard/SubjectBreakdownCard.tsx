'use client';

import React from 'react';
import { ProductivityStats } from '@/lib/types';
import { BookMarked, Award, Layers } from 'lucide-react';

interface SubjectBreakdownCardProps {
  stats: ProductivityStats | null;
}

export function SubjectBreakdownCard({ stats }: SubjectBreakdownCardProps) {
  if (!stats) return null;

  const subjects = stats.subjectBreakdown || [];

  return (
    <div className="p-6 rounded-3xl glass border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Subjects & Mastery
              </h3>
              <p className="text-[11px] text-slate-500">Knowledge retention by field</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
            <Award className="w-4 h-4 text-indigo-500" />
            <span>{stats.masteredTopicsCount} Mastered (Day 60)</span>
          </div>
        </div>

        {subjects.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No subjects recorded yet.</p>
        ) : (
          <div className="space-y-3.5 mt-2">
            {subjects.map((sub) => {
              const totalTopics = stats.totalTopicsCount || 1;
              const percent = Math.round((sub.topicCount / totalTopics) * 100);

              return (
                <div key={sub.subject} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: sub.color }}
                      />
                      {sub.subject}
                    </span>
                    <span className="text-slate-500">
                      {sub.topicCount} topic{sub.topicCount > 1 ? 's' : ''} • {sub.revisionCount} reviews
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${percent}%`, backgroundColor: sub.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
        <span>Total Topics: <strong className="text-slate-800 dark:text-slate-200">{stats.totalTopicsCount}</strong></span>
        <span>Revisions Done: <strong className="text-slate-800 dark:text-slate-200">{stats.completedRevisionsCount}</strong></span>
      </div>
    </div>
  );
}
