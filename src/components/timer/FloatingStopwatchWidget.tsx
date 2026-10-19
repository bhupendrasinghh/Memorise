'use client';

import React from 'react';
import { useStopwatch } from '@/context/StopwatchContext';
import { Play, Pause, RotateCcw, Flag, ExternalLink, Minimize2, Timer } from 'lucide-react';

interface FloatingStopwatchWidgetProps {
  onOpenTimer: () => void;
  isTimerTabActive: boolean;
}

export function FloatingStopwatchWidget({
  onOpenTimer,
  isTimerTabActive,
}: FloatingStopwatchWidgetProps) {
  const { isRunning, elapsedMs, sessionSubject, handleStart, handlePause, handleLap, formatStopwatch } =
    useStopwatch();

  // If user is already on the timer tab, or stopwatch hasn't started yet, hide floating widget
  if (isTimerTabActive || elapsedMs === 0) {
    return null;
  }

  const time = formatStopwatch(elapsedMs);

  return (
    <aside
      aria-label="Active Stopwatch floating widget"
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 animate-slide-up select-none"
    >
      <div className="flex items-center gap-3 p-3 pl-4 rounded-2xl bg-slate-900/95 dark:bg-slate-950/95 border border-indigo-500/40 text-white shadow-2xl backdrop-blur-md">
        {/* Pulsing indicator */}
        <div
          onClick={onOpenTimer}
          className="flex items-center gap-2.5 cursor-pointer group"
          title="Click to open Stopwatch View"
        >
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${
              isRunning
                ? 'bg-gradient-to-tr from-emerald-500 to-indigo-600 shadow-md shadow-emerald-500/30 animate-pulse'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Timer className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-1.5 font-mono text-sm font-extrabold tracking-tight text-white group-hover:text-indigo-300 transition-colors">
              <span>{time.min}:{time.sec}</span>
              <span className="text-xs text-indigo-400">.{time.ms}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium truncate max-w-[110px] sm:max-w-[140px]">
              {sessionSubject || 'Study Session'}
            </p>
          </div>
        </div>

        {/* Quick controls */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
          {isRunning ? (
            <button
              onClick={handlePause}
              className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 transition-colors"
              title="Pause Stopwatch"
              aria-label="Pause Stopwatch"
            >
              <Pause className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors"
              title="Resume Stopwatch"
              aria-label="Resume Stopwatch"
            >
              <Play className="w-4 h-4 fill-current" />
            </button>
          )}

          {isRunning && (
            <button
              onClick={handleLap}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Record Lap"
              aria-label="Record Lap"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onOpenTimer}
            className="p-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-colors ml-0.5"
            title="Expand to Full Stopwatch View"
            aria-label="Expand to Full Stopwatch View"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
