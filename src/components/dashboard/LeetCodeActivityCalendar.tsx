'use client';

import React, { useState } from 'react';
import { ActivityHeatmapDay } from '@/lib/types';
import { Calendar, Flame, Info } from 'lucide-react';

interface LeetCodeActivityCalendarProps {
  activityHeatmap?: ActivityHeatmapDay[];
  totalActiveDays?: number;
  maxStreak?: number;
}

export function LeetCodeActivityCalendar({
  activityHeatmap = [],
  totalActiveDays = 0,
  maxStreak = 0,
}: LeetCodeActivityCalendarProps) {
  const [hoveredDay, setHoveredDay] = useState<ActivityHeatmapDay | null>(null);

  // Group days into 52 weeks (7 days per week)
  const weeks: ActivityHeatmapDay[][] = [];
  let currentWeek: ActivityHeatmapDay[] = [];

  activityHeatmap.forEach((day, index) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || index === activityHeatmap.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  // Month labels positioning across the top
  const monthLabels = [
    'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'
  ];

  // LeetCode green color levels
  const getColorClass = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-[#0e4429] border-[#0e4429]'; // Low
      case 2:
        return 'bg-[#006d32] border-[#006d32]'; // Medium
      case 3:
        return 'bg-[#26a641] border-[#26a641] shadow-[0_0_8px_rgba(38,166,65,0.4)]'; // High
      case 4:
        return 'bg-[#39d353] border-[#39d353] shadow-[0_0_10px_rgba(57,211,83,0.6)]'; // Bright LeetCode Green
      default:
        return 'bg-[#161b22] border-[#1b2129] hover:border-slate-600'; // Blank / Inactive
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-[#0b0f17] border border-[#21262d] text-slate-100 shadow-xl overflow-hidden">
      {/* Header with stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-2">
              LeetCode Study Activity Calendar
            </h3>
            <p className="text-[11px] text-slate-400">
              Only active study & revision days are illuminated; inactive days remain blank
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#161b22] border border-[#30363d] text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-[#39d353] animate-pulse" />
            <span>{totalActiveDays} Active Days</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#161b22] border border-[#30363d] text-amber-400 font-bold">
            <Flame className="w-3.5 h-3.5 fill-current text-amber-500" />
            <span>Max Streak: {maxStreak}d</span>
          </div>
        </div>
      </div>

      {/* Main Heatmap Grid with horizontal scroll */}
      <div className="relative pt-2 pb-2 overflow-x-auto select-none">
        {/* Month labels header */}
        <div className="flex text-[10px] font-semibold text-slate-400 mb-2 pl-8 min-w-[760px] justify-between pr-4">
          {monthLabels.map((m, idx) => (
            <span key={idx}>{m}</span>
          ))}
        </div>

        {/* Heatmap Row & Columns */}
        <div className="flex items-start gap-1 min-w-[760px]">
          {/* Day of week labels */}
          <div className="flex flex-col justify-between text-[9px] font-bold text-slate-500 h-[86px] pr-2 shrink-0 py-0.5">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
          </div>

          {/* 52 Columns of 7 Squares */}
          <div className="flex gap-1 flex-1">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1">
                {week.map((day) => (
                  <div
                    key={day.date}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`w-[11px] h-[11px] rounded-[2.5px] border transition-all cursor-pointer ${getColorClass(
                      day.level
                    )}`}
                    title={`${day.date}: ${day.count} active contributions`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Hover Tooltip display */}
        <div className="h-5 mt-2 flex items-center justify-start text-[11px] text-slate-300 font-mono">
          {hoveredDay ? (
            <span className="flex items-center gap-2">
              <strong className="text-white font-sans">{hoveredDay.date}:</strong>
              {hoveredDay.count === 0 ? (
                <span className="text-slate-500 font-sans">No activity recorded (Blank)</span>
              ) : (
                <span className="text-emerald-400 font-sans">
                  {hoveredDay.count} activities ({hoveredDay.details.revisions} revisions,{' '}
                  {hoveredDay.details.tasks} tasks, {hoveredDay.details.focusMinutes}m focus)
                </span>
              )}
            </span>
          ) : (
            <span className="text-slate-500 text-[10px] font-sans">
              Hover over any square to view date and daily revision counts.
            </span>
          )}
        </div>
      </div>

      {/* Footer & Legend */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#21262d] text-xs text-slate-400 mt-2">
        <div className="flex items-center gap-1.5 text-[11px] hover:text-slate-200 cursor-pointer">
          <Info className="w-3.5 h-3.5 text-indigo-400" />
          <span>Active days count completed spaced repetitions, finished tasks, and focus timer blocks.</span>
        </div>

        {/* Less to More squares */}
        <div className="flex items-center gap-1.5 text-[11px] shrink-0 font-medium">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#161b22] border border-[#1b2129]" title="0" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#0e4429] border border-[#0e4429]" title="1" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#006d32] border border-[#006d32]" title="2" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#26a641] border border-[#26a641]" title="3-4" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#39d353] border border-[#39d353]" title="5+" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
