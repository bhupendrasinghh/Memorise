'use client';

import React from 'react';
import { LayoutDashboard, Repeat, CheckSquare, Timer, BarChart3, Bell, Trophy } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  dueRevisionsCount?: number;
}

export function MobileNav({ activeTab, setActiveTab, dueRevisionsCount = 0 }: MobileNavProps) {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'revisions', label: 'Revisions', icon: Repeat, badge: dueRevisionsCount > 0 ? dueRevisionsCount : null },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'timer', label: 'Focus', icon: Timer },
    { id: 'leaderboard', label: 'Leaders', icon: Trophy },
    { id: 'analytics', label: 'Stats', icon: BarChart3 },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1.5 backdrop-blur-lg">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
                isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-bold px-1 rounded-full min-w-[14px] text-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
