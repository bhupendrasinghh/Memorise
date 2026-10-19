'use client';

import React from 'react';
import {
  Brain,
  Repeat,
  Bell,
  Smartphone,
  Laptop,
  CheckCircle,
  Database,
  ExternalLink,
  Shield,
  Zap,
} from 'lucide-react';
import { NOTIFICATION_PLATFORM_GUIDE } from '@/lib/notifications';

export function SpacedRepetitionGuide() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Hero Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-indigo-100 text-xs font-bold mb-4 backdrop-blur-md">
            <Brain className="w-4 h-4" /> The Science of Memory Retention
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            The Ebbinghaus Forgetting Curve & Spaced Repetition
          </h1>
          <p className="text-indigo-100 text-sm sm:text-base max-w-2xl mt-2 leading-relaxed">
            Without systematic revision, humans forget approximately <strong className="text-white">70%</strong> of newly learned information within 24 hours. Memorise automates timely reviews on <strong className="text-white">Day 1, 3, 7, 15, 30, and 60</strong> to cement knowledge permanently into long-term memory.
          </p>
        </div>
      </div>

      {/* Interval Breakdown */}
      <div className="p-6 rounded-3xl glass border border-slate-200/80 dark:border-slate-800/80">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Repeat className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          The 6 Golden Spaced Repetition Milestones
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs mb-2">
              Day 1
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">First Consolidation</h3>
            <p className="text-xs text-slate-500 mt-1">
              Interrupts the steepest part of the forgetting curve within 24 hours of first study.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs mb-2">
              Day 3
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Synaptic Stabilisation</h3>
            <p className="text-xs text-slate-500 mt-1">
              Strengthens early neural pathways and tests initial unassisted recall.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs mb-2">
              Day 7
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">One-Week Mastery</h3>
            <p className="text-xs text-slate-500 mt-1">
              Solidifies memory against decay over a full weekly lifecycle.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs mb-2">
              Day 15
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Bi-Weekly Retention</h3>
            <p className="text-xs text-slate-500 mt-1">
              Transitions knowledge from working memory toward permanent neural encoding.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs mb-2">
              Day 30
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Monthly Verification</h3>
            <p className="text-xs text-slate-500 mt-1">
              Ensures high-fidelity recall across weeks of non-exposure.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 font-bold flex items-center justify-center text-xs mb-2">
              Day 60
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Permanent Mastery</h3>
            <p className="text-xs text-slate-500 mt-1">
              The topic reaches the highest tier of retention, retained for years with minimal effort.
            </p>
          </div>
        </div>
      </div>

      {/* Browser and Mobile Notification Limitations & Capabilities */}
      <div className="p-6 rounded-3xl glass border border-slate-200/80 dark:border-slate-800/80">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-500" />
          Notification Guide & Platform Compatibility
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          How revision reminders and study alarms operate across browsers and mobile operating systems.
        </p>

        <div className="space-y-4">
          {NOTIFICATION_PLATFORM_GUIDE.map((item) => (
            <div
              key={item.platform}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  {item.platform}
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                  {item.status}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {item.description}
              </p>
              <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                <strong>When tab is closed:</strong> {item.closedTabSupport}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Supabase Database Connection Details */}
      <div className="p-6 rounded-3xl glass border border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Permanent Database & Cloud Supabase Setup
          </h2>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
          The app includes an isolated, atomic local file database in <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400">data/db.json</code> that persists all users, notes, revision schedules, tasks, alarms, and focus sessions permanently out of the box with zero setup.
        </p>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
          To connect to your own Supabase project:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 dark:text-slate-400 pl-1">
          <li>Create a project on <strong>supabase.com</strong>.</li>
          <li>Run the provided SQL script from <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400">supabase/schema.sql</code> in the Supabase SQL editor.</li>
          <li>Add your keys to <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400">.env.local</code>:
            <pre className="mt-2 p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`}
            </pre>
          </li>
        </ol>
      </div>
    </div>
  );
}
