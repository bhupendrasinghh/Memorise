'use client';

import React from 'react';
import { useStopwatch } from '@/context/StopwatchContext';
import { useFocus } from '@/context/FocusContext';
import { Play, Pause, ExternalLink, Timer, Brain, Coffee, RotateCcw } from 'lucide-react';

interface FloatingTimerWidgetProps {
  onOpenTimer: (subtab: 'pomodoro' | 'stopwatch') => void;
  isTimerTabActive: boolean;
  activeSubtab?: 'pomodoro' | 'stopwatch';
}

export function FloatingTimerWidget({
  onOpenTimer,
  isTimerTabActive,
  activeSubtab = 'pomodoro',
}: FloatingTimerWidgetProps) {
  const {
    isRunning: swRunning,
    elapsedMs: swElapsedMs,
    sessionSubject: swSubject,
    handleStart: swStart,
    handlePause: swPause,
    formatStopwatch,
  } = useStopwatch();

  const {
    isRunning: focusRunning,
    remainingSeconds: focusRemaining,
    totalSeconds: focusTotal,
    sessionSubject: focusSubject,
    timerType: focusType,
    handleStart: focusStart,
    handlePause: focusPause,
    handleReset: focusReset,
    formatFocusTime,
  } = useFocus();

  const isFocusActive = focusRunning || (focusRemaining < focusTotal && focusRemaining > 0);
  const isSwActive = swRunning || swElapsedMs > 0;

  // Hide specific floating timer if user is already looking at that active screen
  const showFocus = isFocusActive && (!isTimerTabActive || activeSubtab !== 'pomodoro');
  const showStopwatch = isSwActive && (!isTimerTabActive || activeSubtab !== 'stopwatch');

  if (!showFocus && !showStopwatch) {
    return null;
  }

  const swTime = formatStopwatch(swElapsedMs);
  const focusTime = formatFocusTime(focusRemaining);

  return (
    <aside
      aria-label="Active timers floating widget"
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2.5 animate-slide-up select-none pointer-events-auto"
    >
      {/* 1. Deep Focus Floating Bar */}
      {showFocus && (
        <div className="flex items-center gap-3 p-3 pl-4 rounded-2xl bg-slate-900/95 dark:bg-slate-950/95 border border-indigo-500/40 text-white shadow-2xl backdrop-blur-md">
          {/* Pulsing indicator */}
          <div
            onClick={() => onOpenTimer('pomodoro')}
            className="flex items-center gap-2.5 cursor-pointer group"
            title="Click to open Deep Focus View"
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${
                focusRunning
                  ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-md shadow-indigo-500/40 animate-pulse'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {focusType === 'break' ? (
                <Coffee className="w-4 h-4 text-emerald-400" />
              ) : (
                <Brain className="w-4 h-4 text-indigo-300" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5 font-mono text-sm font-extrabold tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                <span>{focusTime.min}:{focusTime.sec}</span>
                <span className="text-[10px] uppercase font-bold text-indigo-400">
                  {focusType === 'break' ? 'Break' : 'Focus'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate max-w-[110px] sm:max-w-[140px]">
                {focusSubject || 'Deep Focus'}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            {focusRunning ? (
              <button
                onClick={focusPause}
                className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 transition-colors"
                title="Pause Deep Focus"
                aria-label="Pause Deep Focus"
              >
                <Pause className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                onClick={focusStart}
                className="p-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 transition-colors"
                title="Resume Deep Focus"
                aria-label="Resume Deep Focus"
              >
                <Play className="w-4 h-4 fill-current" />
              </button>
            )}

            <button
              onClick={focusReset}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Reset Deep Focus"
              aria-label="Reset Deep Focus"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onOpenTimer('pomodoro')}
              className="p-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-colors ml-0.5"
              title="Expand Deep Focus View"
              aria-label="Expand Deep Focus View"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Stopwatch Floating Bar */}
      {showStopwatch && (
        <div className="flex items-center gap-3 p-3 pl-4 rounded-2xl bg-slate-900/95 dark:bg-slate-950/95 border border-emerald-500/40 text-white shadow-2xl backdrop-blur-md">
          {/* Pulsing indicator */}
          <div
            onClick={() => onOpenTimer('stopwatch')}
            className="flex items-center gap-2.5 cursor-pointer group"
            title="Click to open Stopwatch View"
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${
                swRunning
                  ? 'bg-gradient-to-tr from-emerald-500 to-indigo-600 shadow-md shadow-emerald-500/30 animate-pulse'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Timer className="w-4 h-4" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 font-mono text-sm font-extrabold tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                <span>{swTime.min}:{swTime.sec}</span>
                <span className="text-xs text-emerald-400">.{swTime.ms}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate max-w-[110px] sm:max-w-[140px]">
                {swSubject || 'Stopwatch'}
              </p>
            </div>
          </div>

          {/* Quick controls */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            {swRunning ? (
              <button
                onClick={swPause}
                className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 transition-colors"
                title="Pause Stopwatch"
                aria-label="Pause Stopwatch"
              >
                <Pause className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                onClick={swStart}
                className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors"
                title="Resume Stopwatch"
                aria-label="Resume Stopwatch"
              >
                <Play className="w-4 h-4 fill-current" />
              </button>
            )}

            <button
              onClick={() => onOpenTimer('stopwatch')}
              className="p-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white transition-colors ml-0.5"
              title="Expand Stopwatch View"
              aria-label="Expand Stopwatch View"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
