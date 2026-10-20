'use client';

import React, { useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';
import { useFocus } from '@/context/FocusContext';

interface FocusTimerViewProps {
  onSessionSaved?: () => void;
}

export function FocusTimerView({ onSessionSaved }: FocusTimerViewProps) {
  const {
    isRunning,
    totalSeconds,
    remainingSeconds,
    timerType,
    sessionSubject,
    customMinutes,
    setSessionSubject,
    setCustomMinutes,
    handleStart,
    handlePause,
    handleReset,
    setPreset,
    handleCustomApply,
    formatFocusTime,
    registerSessionSavedCallback,
  } = useFocus();

  // Register parent callback (e.g. fetchData) so analytics and heatmaps refresh on completion
  useEffect(() => {
    if (onSessionSaved) {
      return registerSessionSavedCallback(onSessionSaved);
    }
  }, [onSessionSaved, registerSessionSavedCallback]);

  const { formatted: timeFormatted } = formatFocusTime(remainingSeconds);

  const radius = 86;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = totalSeconds > 0 ? (totalSeconds - remainingSeconds) / totalSeconds : 0;
  const strokeDashoffset = circumference * (1 - progressPercent);

  return (
    <div className="p-6 sm:p-8 rounded-3xl glass border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col items-center">
      {/* Preset Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
        <button
          onClick={() => setPreset(25, 'pomodoro')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            totalSeconds === 25 * 60 && timerType === 'pomodoro'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          25m Pomodoro
        </button>
        <button
          onClick={() => setPreset(50, 'pomodoro')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            totalSeconds === 50 * 60 && timerType === 'pomodoro'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          50m Deep Work
        </button>
        <button
          onClick={() => setPreset(15, 'pomodoro')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            totalSeconds === 15 * 60 && timerType === 'pomodoro'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          15m Sprint
        </button>
        <button
          onClick={() => setPreset(5, 'break')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            totalSeconds === 5 * 60 && timerType === 'break'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
          }`}
        >
          5m Break
        </button>
      </div>

      {/* Subject input */}
      <div className="w-full max-w-xs mb-6 text-center">
        <input
          type="text"
          value={sessionSubject}
          onChange={(e) => setSessionSubject(e.target.value)}
          placeholder="Subject / Topic (e.g. Mathematics)"
          className="w-full text-center px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
      </div>

      {/* Circular Countdown Progress */}
      <div className="relative flex items-center justify-center my-2 select-none">
        <svg className="w-64 h-64 sm:w-72 sm:h-72 transform -rotate-90">
          <circle
            cx="144"
            cy="144"
            r={radius}
            className="stroke-slate-100 dark:stroke-slate-800 fill-none"
            strokeWidth="12"
          />
          <circle
            cx="144"
            cy="144"
            r={radius}
            className={`${
              timerType === 'break' ? 'stroke-emerald-500' : 'stroke-indigo-600'
            } fill-none transition-all duration-1000 ease-linear`}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-4xl sm:text-5xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">
            {timeFormatted}
          </span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1 flex items-center gap-1">
            {timerType === 'break' ? (
              <>
                <Coffee className="w-3.5 h-3.5 text-emerald-500" /> Short Break
              </>
            ) : (
              <>
                <Brain className="w-3.5 h-3.5 text-indigo-500" /> Deep Focus
              </>
            )}
          </span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-4 mt-6">
        <button
          onClick={handleReset}
          className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all"
          title="Reset Timer"
          aria-label="Reset Timer"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {isRunning ? (
          <button
            onClick={handlePause}
            className="px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/25 transition-all transform active:scale-95 flex items-center gap-2"
          >
            <Pause className="w-5 h-5 fill-current" /> Pause Focus
          </button>
        ) : (
          <button
            onClick={handleStart}
            className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95 flex items-center gap-2"
          >
            <Play className="w-5 h-5 fill-current" /> Start Focus
          </button>
        )}
      </div>

      {/* Custom Duration Setting */}
      <div className="mt-8 flex items-center gap-2 text-xs text-slate-500">
        <span>Custom Minutes:</span>
        <input
          type="number"
          min="1"
          max="180"
          value={customMinutes}
          onChange={(e) => setCustomMinutes(e.target.value)}
          className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold text-center focus:outline-none"
        />
        <button
          onClick={handleCustomApply}
          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-semibold text-slate-700 dark:text-slate-300 transition-colors"
        >
          Set
        </button>
      </div>
    </div>
  );
}
