'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flag, Save, CheckCircle2, Clock } from 'lucide-react';
import { soundEngine } from '@/lib/audio';
import { useToast } from '@/context/ToastContext';

interface LapTime {
  lapNumber: number;
  timeMs: number;
  overallMs: number;
}

export function StopwatchView({ onSessionSaved }: { onSessionSaved?: () => void }) {
  const { success } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [laps, setLaps] = useState<LapTime[]>([]);
  const [sessionSubject, setSessionSubject] = useState('Computer Science');
  const [isSaving, setIsSaving] = useState(false);

  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - elapsedMs;
      intervalRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTimeRef.current);
      }, 30);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, elapsedMs]);

  const handleStart = () => {
    soundEngine.playTick();
    setIsRunning(true);
  };

  const handlePause = () => {
    soundEngine.playTick();
    setIsRunning(false);
  };

  const handleReset = () => {
    soundEngine.playTick();
    setIsRunning(false);
    setElapsedMs(0);
    setLaps([]);
  };

  const handleLap = () => {
    soundEngine.playTick();
    const lastLapOverall = laps.length > 0 ? laps[0].overallMs : 0;
    const lapDuration = elapsedMs - lastLapOverall;

    const newLap: LapTime = {
      lapNumber: laps.length + 1,
      timeMs: lapDuration,
      overallMs: elapsedMs,
    };
    setLaps([newLap, ...laps]);
  };

  const handleSaveSession = async () => {
    if (elapsedMs < 10000) {
      alert('Session too short to record (less than 10 seconds).');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: sessionSubject,
          durationSeconds: Math.round(elapsedMs / 1000),
          type: 'stopwatch',
          notes: `Tracked with stopwatch (${laps.length} laps recorded)`,
        }),
      });

      if (res.ok) {
        soundEngine.playSuccess();
        success('Focus Session Saved!', `${Math.round(elapsedMs / 60000)} minutes logged to your performance dashboard.`);
        handleReset();
        if (onSessionSaved) onSessionSaved();
      }
    } catch (err) {
      console.error('Error saving session:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const formatStopwatch = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const hundredths = Math.floor((ms % 1000) / 10);

    return {
      min: String(minutes).padStart(2, '0'),
      sec: String(seconds).padStart(2, '0'),
      ms: String(hundredths).padStart(2, '0'),
    };
  };

  const time = formatStopwatch(elapsedMs);

  // Determine fastest and slowest laps
  let fastestLap = Infinity;
  let slowestLap = -Infinity;
  if (laps.length > 1) {
    laps.forEach((l) => {
      if (l.timeMs < fastestLap) fastestLap = l.timeMs;
      if (l.timeMs > slowestLap) slowestLap = l.timeMs;
    });
  }

  return (
    <div className="p-6 sm:p-8 rounded-3xl glass border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col items-center">
      {/* Subject input for logging */}
      <div className="w-full max-w-xs mb-6 text-center">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
          Study Subject / Topic Focus
        </label>
        <input
          type="text"
          value={sessionSubject}
          onChange={(e) => setSessionSubject(e.target.value)}
          placeholder="e.g. Computer Science"
          className="w-full text-center px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
      </div>

      {/* Large Digital Display */}
      <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white shadow-2xl flex items-baseline justify-center gap-1 sm:gap-2 mb-8 min-w-[280px] sm:min-w-[340px] border border-slate-800 select-none">
        <span className="text-5xl sm:text-7xl font-mono font-extrabold tracking-tight">
          {time.min}:{time.sec}
        </span>
        <span className="text-2xl sm:text-3xl font-mono font-bold text-indigo-400">
          .{time.ms}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 sm:gap-4 mb-6">
        <button
          onClick={handleReset}
          disabled={elapsedMs === 0}
          className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all disabled:opacity-40"
          title="Reset Stopwatch"
          aria-label="Reset Stopwatch"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {isRunning ? (
          <button
            onClick={handlePause}
            className="px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/25 transition-all transform active:scale-95 flex items-center gap-2"
          >
            <Pause className="w-5 h-5 fill-current" /> Pause
          </button>
        ) : (
          <button
            onClick={handleStart}
            className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95 flex items-center gap-2"
          >
            <Play className="w-5 h-5 fill-current" /> {elapsedMs > 0 ? 'Resume' : 'Start'}
          </button>
        )}

        <button
          onClick={handleLap}
          disabled={!isRunning}
          className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all disabled:opacity-40"
          title="Record Lap"
          aria-label="Record Lap"
        >
          <Flag className="w-5 h-5" />
        </button>
      </div>

      {/* Save Session Button when paused */}
      {!isRunning && elapsedMs > 10000 && (
        <button
          onClick={handleSaveSession}
          disabled={isSaving}
          className="mb-6 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/25 transition-all animate-bounce"
        >
          <Save className="w-4 h-4" /> Save {Math.round(elapsedMs / 60000)}m to Productivity Score
        </button>
      )}

      {/* Laps List */}
      {laps.length > 0 && (
        <div className="w-full max-w-md border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400 mb-2 px-2">
            <span>Lap</span>
            <span>Split Time</span>
            <span>Total</span>
          </div>

          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {laps.map((lap) => {
              const split = formatStopwatch(lap.timeMs);
              const total = formatStopwatch(lap.overallMs);
              const isFastest = laps.length > 1 && lap.timeMs === fastestLap;
              const isSlowest = laps.length > 1 && lap.timeMs === slowestLap;

              return (
                <div
                  key={lap.lapNumber}
                  className={`flex items-center justify-between p-2 rounded-xl text-xs font-mono ${
                    isFastest
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold'
                      : isSlowest
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                      : 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="font-sans font-medium text-slate-500">
                    Lap {lap.lapNumber} {isFastest ? '⚡' : isSlowest ? '🐢' : ''}
                  </span>
                  <span>+{split.min}:{split.sec}.{split.ms}</span>
                  <span className="text-slate-500">{total.min}:{total.sec}.{total.ms}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
