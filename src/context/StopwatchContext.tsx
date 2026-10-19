'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { soundEngine } from '@/lib/audio';

export interface LapTime {
  lapNumber: number;
  timeMs: number;
  overallMs: number;
}

interface StopwatchContextType {
  isRunning: boolean;
  elapsedMs: number;
  laps: LapTime[];
  sessionSubject: string;
  setSessionSubject: (subject: string) => void;
  handleStart: () => void;
  handlePause: () => void;
  handleReset: () => void;
  handleLap: () => void;
  formatStopwatch: (ms: number) => { min: string; sec: string; ms: string; formatted: string };
}

const StopwatchContext = createContext<StopwatchContextType | undefined>(undefined);

const STORAGE_KEY = 'memorise_stopwatch_state_v1';

export function StopwatchProvider({ children }: { children: ReactNode }) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [laps, setLaps] = useState<LapTime[]>([]);
  const [sessionSubject, setSessionSubject] = useState('Computer Science');

  // Wall-clock reference timestamp: startTime = Date.now() - elapsedMs
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<number | null>(null);
  const workerRef = useRef<Worker | null>(null);

  // Helper formatter
  const formatStopwatch = useCallback((ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const hundredths = Math.floor((ms % 1000) / 10);

    const min = String(minutes).padStart(2, '0');
    const sec = String(seconds).padStart(2, '0');
    const hundredthStr = String(hundredths).padStart(2, '0');

    return {
      min,
      sec,
      ms: hundredthStr,
      formatted: `${min}:${sec}.${hundredthStr}`,
    };
  }, []);

  // 1. Restore state on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sessionSubject) setSessionSubject(parsed.sessionSubject);
        if (Array.isArray(parsed.laps)) setLaps(parsed.laps);

        if (parsed.isRunning && parsed.startTime) {
          const now = Date.now();
          const currentElapsed = Math.max(0, now - parsed.startTime);
          startTimeRef.current = parsed.startTime;
          setElapsedMs(currentElapsed);
          setIsRunning(true);
        } else if (typeof parsed.elapsedMs === 'number') {
          setElapsedMs(parsed.elapsedMs);
          setIsRunning(false);
        }
      }
    } catch (err) {
      console.error('Error restoring stopwatch state:', err);
    }
  }, []);

  // 2. Persist state changes to localStorage
  const persistState = useCallback(
    (running: boolean, start: number, elapsed: number, currentLaps: LapTime[], subject: string) => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            isRunning: running,
            startTime: start,
            elapsedMs: elapsed,
            laps: currentLaps,
            sessionSubject: subject,
            updatedAt: Date.now(),
          })
        );
      } catch (err) {
        console.error('Error saving stopwatch state:', err);
      }
    },
    []
  );

  // 3. Inline Web Worker for true background execution when browser tab is inactive / minimized
  useEffect(() => {
    try {
      const workerCode = `
        let timer = null;
        self.onmessage = function(e) {
          if (e.data === 'start') {
            if (timer) clearInterval(timer);
            timer = setInterval(() => {
              self.postMessage('tick');
            }, 50);
          } else if (e.data === 'stop') {
            if (timer) clearInterval(timer);
            timer = null;
          }
        };
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);

      worker.onmessage = () => {
        if (startTimeRef.current > 0) {
          setElapsedMs(Date.now() - startTimeRef.current);
        }
      };

      workerRef.current = worker;

      return () => {
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
      };
    } catch {
      // Fallback if Web Workers are restricted in environment
      workerRef.current = null;
    }
  }, []);

  // 4. Main Timer Loop & Background Tab Synchronization
  useEffect(() => {
    if (isRunning) {
      // Start Web Worker if available
      if (workerRef.current) {
        workerRef.current.postMessage('start');
      }

      // Also run local interval
      const tick = () => {
        if (startTimeRef.current > 0) {
          const current = Date.now() - startTimeRef.current;
          setElapsedMs(current);
        }
      };

      intervalRef.current = window.setInterval(tick, 30);

      // Handle visibility changes (e.g. coming back to tab after being in background)
      const handleVisibilityChange = () => {
        if (startTimeRef.current > 0) {
          const current = Date.now() - startTimeRef.current;
          setElapsedMs(current);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleVisibilityChange);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (workerRef.current) workerRef.current.postMessage('stop');
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleVisibilityChange);
      };
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (workerRef.current) workerRef.current.postMessage('stop');
    }
  }, [isRunning]);

  // 5. Update browser document.title dynamically when running in background
  useEffect(() => {
    if (isRunning && elapsedMs > 0) {
      const t = formatStopwatch(elapsedMs);
      document.title = `⏱️ ${t.min}:${t.sec} — Memorise Stopwatch`;
    } else {
      // Reset title when not running
      if (document.title.includes('⏱️')) {
        document.title = 'Memorise — Smart Revision & Personal Productivity';
      }
    }
  }, [isRunning, elapsedMs, formatStopwatch]);

  // Control Handlers
  const handleStart = useCallback(() => {
    soundEngine.playTick();
    const now = Date.now();
    const start = now - elapsedMs;
    startTimeRef.current = start;
    setIsRunning(true);
    persistState(true, start, elapsedMs, laps, sessionSubject);
  }, [elapsedMs, laps, sessionSubject, persistState]);

  const handlePause = useCallback(() => {
    soundEngine.playTick();
    const current = startTimeRef.current > 0 ? Date.now() - startTimeRef.current : elapsedMs;
    startTimeRef.current = 0;
    setIsRunning(false);
    setElapsedMs(current);
    persistState(false, 0, current, laps, sessionSubject);
  }, [elapsedMs, laps, sessionSubject, persistState]);

  const handleReset = useCallback(() => {
    soundEngine.playTick();
    startTimeRef.current = 0;
    setIsRunning(false);
    setElapsedMs(0);
    setLaps([]);
    persistState(false, 0, 0, [], sessionSubject);
    document.title = 'Memorise — Smart Revision & Personal Productivity';
  }, [sessionSubject, persistState]);

  const handleLap = useCallback(() => {
    soundEngine.playTick();
    const current = startTimeRef.current > 0 ? Date.now() - startTimeRef.current : elapsedMs;
    const lastLapOverall = laps.length > 0 ? laps[0].overallMs : 0;
    const lapDuration = current - lastLapOverall;

    const newLap: LapTime = {
      lapNumber: laps.length + 1,
      timeMs: lapDuration,
      overallMs: current,
    };
    const updatedLaps = [newLap, ...laps];
    setLaps(updatedLaps);
    persistState(isRunning, startTimeRef.current, current, updatedLaps, sessionSubject);
  }, [elapsedMs, laps, isRunning, sessionSubject, persistState]);

  return (
    <StopwatchContext.Provider
      value={{
        isRunning,
        elapsedMs,
        laps,
        sessionSubject,
        setSessionSubject,
        handleStart,
        handlePause,
        handleReset,
        handleLap,
        formatStopwatch,
      }}
    >
      {children}
    </StopwatchContext.Provider>
  );
}

export function useStopwatch() {
  const context = useContext(StopwatchContext);
  if (!context) {
    throw new Error('useStopwatch must be used within a StopwatchProvider');
  }
  return context;
}
