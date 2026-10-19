'use client';

import React from 'react';
import {
  LayoutDashboard,
  Repeat,
  CheckSquare,
  Timer,
  Bell,
  BarChart3,
  BookOpen,
  Info,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  dueRevisionsCount?: number;
  pendingTasksCount?: number;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  dueRevisionsCount = 0,
  pendingTasksCount = 0,
}: SidebarProps) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'revisions',
      label: 'Smart Revisions',
      icon: Repeat,
      badge: dueRevisionsCount > 0 ? `${dueRevisionsCount} Due` : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'tasks',
      label: 'Task Management',
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? `${pendingTasksCount}` : null,
      badgeColor: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300',
    },
    {
      id: 'timer',
      label: 'Stopwatch & Focus',
      icon: Timer,
      badge: null,
    },
    {
      id: 'alarms',
      label: 'Study Alarms',
      icon: Bell,
      badge: null,
    },
    {
      id: 'analytics',
      label: 'Performance & Stats',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'guide',
      label: 'Science & Notifications',
      icon: BookOpen,
      badge: null,
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 p-4 border-r border-slate-200/80 dark:border-slate-800/80 min-h-[calc(100vh-4rem)] bg-white/50 dark:bg-slate-900/40 backdrop-blur-sm select-none">
      <div className="space-y-1.5">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all text-left ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Spaced Repetition Pro Tip Card in Sidebar */}
      <div className="mt-auto pt-6">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-indigo-500/5 border border-indigo-200/60 dark:border-indigo-800/60">
          <div className="flex items-center gap-2 mb-2 text-indigo-700 dark:text-indigo-300">
            <Info className="w-4 h-4" />
            <span className="text-xs font-bold">Spaced Repetition</span>
          </div>
          <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Revising on <strong className="text-slate-900 dark:text-slate-200">Day 1, 3, 7, 15, 30, and 60</strong> interrupts the forgetting curve and boosts long-term recall to over 90%.
          </p>
          <button
            onClick={() => setActiveTab('guide')}
            className="mt-3 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            Learn the science →
          </button>
        </div>
      </div>
    </aside>
  );
}
