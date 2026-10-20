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
import { sendBrowserNotification } from '@/lib/notifications';
import { useToast } from '@/context/ToastContext';
import { getAuthHeaders } from '@/context/AuthContext';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';

export type FocusTimerType = 'pomodoro' | 'break';

export interface FocusContextType {
  isRunning: boolean;
  totalSeconds: number;
  remainingSeconds: number;
  timerType: FocusTimerType;
  sessionSubject: string;
  customMinutes: string;
  setSessionSubject: (subject: string) => void;
  setCustomMinutes: (mins: string) => void;
  handleStart: () => void;
  handlePause: () => void;
  handleReset: () => void;
  setPreset: (mins: number, type: FocusTimerType) => void;
  handleCustomApply: () => void;
  formatFocusTime: (seconds: number) => { min: string; sec: string; formatted: string };
  registerSessionSavedCallback: (cb: () => void) => () => void;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

const FOCUS_STORAGE_KEY = 'memorise_focus_state_v1';

interface StoredFocusState {
  isRunning: boolean;
  totalSeconds: number;
  remainingSeconds: number;
  targetEndTime: number | null;
  timerType: FocusTimerType;
  sessionSubject: string;
  customMinutes: string;
  sessionDate: string; // 'yyyy-MM-dd'
  updatedAt: number;
}

export function FocusProvider({ children }: { children: ReactNode }) {
  const { success } = useToast();

  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [timerType, setTimerType] = useState<FocusTimerType>('pomodoro');
  const [sessionSubject, setSessionSubject] = useState('Computer Science');
  const [customMinutes, setCustomMinutes] = useState('25');

  const targetEndTimeRef = useRef<number | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const sessionSavedCallbacksRef = useRef<Set<() => void>>(new Set());

  // Helper formatter
  const formatFocusTime = useCallback((seconds: number) => {
    const validSec = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(validSec / 60);
    const secs = validSec % 60;
    const minStr = String(mins).padStart(2, '0');
    const secStr = String(secs).padStart(2, '0');
    return {
      min: minStr,
      sec: secStr,
      formatted: `${minStr}:${secStr}`,
    };
  }, []);

  const registerSessionSavedCallback = useCallback((cb: () => void) => {
    sessionSavedCallbacksRef.current.add(cb);
    return () => {
      sessionSavedCallbacksRef.current.delete(cb);
    };
  }, []);

  // Persist state to localStorage
  const persistState = useCallback(
    (
      running: boolean,
      total: number,
      remaining: number,
      endTime: number | null,
      type: FocusTimerType,
      subject: string,
      customMin: string,
      dateStr: string
    ) => {
      try {
        const payload: StoredFocusState = {
          isRunning: running,
          totalSeconds: total,
          remainingSeconds: remaining,
          targetEndTime: endTime,
          timerType: type,
          sessionSubject: subject,
          customMinutes: customMin,
          sessionDate: dateStr,
          updatedAt: Date.now(),
        };
        localStorage.setItem(FOCUS_STORAGE_KEY, JSON.stringify(payload));
      } catch (err) {
        console.error('Error persisting focus state:', err);
      }
    },
    []
  );

  // Complete session logic
  const handleCompleteSession = useCallback(
    async (completedTotalSec: number, completedType: FocusTimerType, completedSubj: string) => {
      setIsRunning(false);
      targetEndTimeRef.current = null;
      soundEngine.playChime();

      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      const durationMinutes = Math.round(completedTotalSec / 60);

      if (completedType === 'pomodoro') {
        sendBrowserNotification('🎉 Deep Focus Session Completed!', {
          body: `You completed your ${durationMinutes}-minute deep focus session on ${completedSubj}. Fantastic work!`,
          requireInteraction: true,
        });

        try {
          const localNow = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
          const localDate = format(new Date(), 'yyyy-MM-dd');
          await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({
              subject: completedSubj,
              durationSeconds: completedTotalSec,
              type: 'pomodoro',
              notes: 'Completed Deep Focus session',
              completedAt: localNow,
              clientDate: localDate,
            }),
          });

          success(
            'Deep Focus Session Recorded!',
            `+${durationMinutes} minutes added to your daily productivity score.`
          );

          // Notify dashboard / analytics to refresh immediately
          sessionSavedCallbacksRef.current.forEach((cb) => {
            try {
              cb();
            } catch (e) {
              console.error('Error invoking sessionSaved callback:', e);
            }
          });
        } catch (err) {
          console.error('Error recording focus session:', err);
        }

        // Auto switch to 5 min break preset
        const breakSecs = 5 * 60;
        setTimerType('break');
        setTotalSeconds(breakSecs);
        setRemainingSeconds(breakSecs);
        persistState(
          false,
          breakSecs,
          breakSecs,
          null,
          'break',
          completedSubj,
          '5',
          format(new Date(), 'yyyy-MM-dd')
        );
      } else {
        sendBrowserNotification('☕ Break Finished!', {
          body: 'Ready to start another deep focus sprint!',
          requireInteraction: true,
        });
        success('Break Finished!', 'Ready to start another deep focus sprint.');

        // Auto switch back to 25m pomodoro
        const pomoSecs = 25 * 60;
        setTimerType('pomodoro');
        setTotalSeconds(pomoSecs);
        setRemainingSeconds(pomoSecs);
        persistState(
          false,
          pomoSecs,
          pomoSecs,
          null,
          'pomodoro',
          completedSubj,
          '25',
          format(new Date(), 'yyyy-MM-dd')
        );
      }
    },
    [persistState, success]
  );

  // Trigger complete wrapper
  const triggerComplete = useCallback(() => {
    handleCompleteSession(totalSeconds, timerType, sessionSubject);
  }, [handleCompleteSession, totalSeconds, timerType, sessionSubject]);

  // 1. Initial State Restoration:
  // "focus should reset only after 00:00 not ever after reload"
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FOCUS_STORAGE_KEY);
      const todayStr = format(new Date(), 'yyyy-MM-dd');

      if (saved) {
        const parsed: StoredFocusState = JSON.parse(saved);

        // Check if date is from previous day (meaning we crossed 00:00 midnight)
        if (parsed.sessionDate && parsed.sessionDate !== todayStr) {
          // Reset only after 00:00 rollover: fresh default session for new day
          setTotalSeconds(25 * 60);
          setRemainingSeconds(25 * 60);
          setIsRunning(false);
          setTimerType('pomodoro');
          if (parsed.sessionSubject) setSessionSubject(parsed.sessionSubject);
          persistState(
            false,
            25 * 60,
            25 * 60,
            null,
            'pomodoro',
            parsed.sessionSubject || 'Computer Science',
            '25',
            todayStr
          );
        } else {
          // SAME DAY: DO NOT RESET ON RELOAD!
          if (parsed.sessionSubject) setSessionSubject(parsed.sessionSubject);
          if (parsed.timerType) setTimerType(parsed.timerType);
          if (typeof parsed.totalSeconds === 'number') setTotalSeconds(parsed.totalSeconds);
          if (parsed.customMinutes) setCustomMinutes(parsed.customMinutes);

          if (parsed.isRunning && parsed.targetEndTime) {
            const now = Date.now();
            const diffMs = parsed.targetEndTime - now;
            const remaining = Math.max(0, Math.ceil(diffMs / 1000));
            targetEndTimeRef.current = parsed.targetEndTime;

            if (remaining > 0) {
              setRemainingSeconds(remaining);
              setIsRunning(true);
            } else {
              // Timer finished while page was reloading or browser was closed
              setRemainingSeconds(0);
              setIsRunning(false);
              setTimeout(() => {
                handleCompleteSession(parsed.totalSeconds, parsed.timerType, parsed.sessionSubject || 'Study');
              }, 100);
            }
          } else if (typeof parsed.remainingSeconds === 'number') {
            // Paused session: keep remaining seconds exactly as it was!
            setRemainingSeconds(parsed.remainingSeconds);
            setIsRunning(false);
          }
        }
      }
    } catch (err) {
      console.error('Error restoring focus state:', err);
    }
  }, [handleCompleteSession, persistState]);

  // 2. Midnight Rollover Listener:
  // Automatically resets focus state right after 00:00:00 if idle/completed from yesterday
  useEffect(() => {
    const getMsUntilMidnight = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 2);
      return Math.max(1000, tomorrow.getTime() - now.getTime());
    };

    let timerId: NodeJS.Timeout;
    const scheduleMidnightReset = () => {
      const ms = getMsUntilMidnight();
      timerId = setTimeout(() => {
        // Midnight reached! Reset focus to clean 25m Pomodoro for the new day
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        setIsRunning(false);
        targetEndTimeRef.current = null;
        setTotalSeconds(25 * 60);
        setRemainingSeconds(25 * 60);
        setTimerType('pomodoro');
        persistState(
          false,
          25 * 60,
          25 * 60,
          null,
          'pomodoro',
          sessionSubject,
          '25',
          todayStr
        );

        // Notify analytics / dashboard to refresh so score and today's focus minutes roll over to 0
        sessionSavedCallbacksRef.current.forEach((cb) => {
          try {
            cb();
          } catch {}
        });

        scheduleMidnightReset();
      }, ms);
    };

    scheduleMidnightReset();

    return () => {
      clearTimeout(timerId);
    };
  }, [sessionSubject, persistState]);

  // 3. Web Worker for True Background Execution (Same as Stopwatch)
  useEffect(() => {
    try {
      const workerCode = `
        let timer = null;
        self.onmessage = function(e) {
          if (e.data === 'start') {
            if (timer) clearInterval(timer);
            timer = setInterval(() => {
              self.postMessage('tick');
            }, 200);
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
        if (targetEndTimeRef.current) {
          const diffMs = targetEndTimeRef.current - Date.now();
          const rem = Math.max(0, Math.ceil(diffMs / 1000));
          setRemainingSeconds(rem);
          if (rem <= 0) {
            triggerComplete();
          }
        }
      };

      workerRef.current = worker;

      return () => {
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
      };
    } catch {
      workerRef.current = null;
    }
  }, [triggerComplete]);

  // 4. Main Timer Loop & Background Tab Synchronization
  useEffect(() => {
    if (isRunning) {
      if (workerRef.current) {
        workerRef.current.postMessage('start');
      }

      const syncCountdown = () => {
        if (targetEndTimeRef.current) {
          const diffMs = targetEndTimeRef.current - Date.now();
          const rem = Math.max(0, Math.ceil(diffMs / 1000));
          setRemainingSeconds(rem);
          if (rem <= 0) {
            triggerComplete();
          }
        }
      };

      const interval = window.setInterval(syncCountdown, 250);

      const onVisibility = () => {
        syncCountdown();
      };

      document.addEventListener('visibilitychange', onVisibility);
      window.addEventListener('focus', onVisibility);

      return () => {
        clearInterval(interval);
        if (workerRef.current) workerRef.current.postMessage('stop');
        document.removeEventListener('visibilitychange', onVisibility);
        window.removeEventListener('focus', onVisibility);
      };
    } else {
      if (workerRef.current) workerRef.current.postMessage('stop');
    }
  }, [isRunning, triggerComplete]);

  // 5. Update browser document.title dynamically in background
  useEffect(() => {
    if (isRunning && remainingSeconds > 0) {
      const { min, sec } = formatFocusTime(remainingSeconds);
      const icon = timerType === 'break' ? '☕' : '🧠';
      const label = timerType === 'break' ? 'Break' : 'Deep Focus';
      document.title = `${icon} ${min}:${sec} — ${label} (${sessionSubject || 'Study'})`;
    } else {
      if (document.title.includes('🧠') || document.title.includes('☕')) {
        document.title = 'Memorise — Smart Revision & Personal Productivity';
      }
    }
  }, [isRunning, remainingSeconds, timerType, sessionSubject, formatFocusTime]);

  // Control Handlers
  const handleStart = useCallback(() => {
    soundEngine.playTick();
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const target = Date.now() + remainingSeconds * 1000;
    targetEndTimeRef.current = target;
    setIsRunning(true);
    persistState(
      true,
      totalSeconds,
      remainingSeconds,
      target,
      timerType,
      sessionSubject,
      customMinutes,
      todayStr
    );
  }, [remainingSeconds, totalSeconds, timerType, sessionSubject, customMinutes, persistState]);

  const handlePause = useCallback(() => {
    soundEngine.playTick();
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    let currentRem = remainingSeconds;
    if (targetEndTimeRef.current) {
      currentRem = Math.max(0, Math.ceil((targetEndTimeRef.current - Date.now()) / 1000));
    }
    targetEndTimeRef.current = null;
    setIsRunning(false);
    setRemainingSeconds(currentRem);
    persistState(
      false,
      totalSeconds,
      currentRem,
      null,
      timerType,
      sessionSubject,
      customMinutes,
      todayStr
    );
  }, [remainingSeconds, totalSeconds, timerType, sessionSubject, customMinutes, persistState]);

  const handleReset = useCallback(() => {
    soundEngine.playTick();
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    targetEndTimeRef.current = null;
    setIsRunning(false);
    setRemainingSeconds(totalSeconds);
    persistState(
      false,
      totalSeconds,
      totalSeconds,
      null,
      timerType,
      sessionSubject,
      customMinutes,
      todayStr
    );
  }, [totalSeconds, timerType, sessionSubject, customMinutes, persistState]);

  const setPreset = useCallback(
    (mins: number, type: FocusTimerType) => {
      soundEngine.playTick();
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      targetEndTimeRef.current = null;
      setIsRunning(false);
      setTimerType(type);
      const secs = mins * 60;
      setTotalSeconds(secs);
      setRemainingSeconds(secs);
      setCustomMinutes(String(mins));
      persistState(
        false,
        secs,
        secs,
        null,
        type,
        sessionSubject,
        String(mins),
        todayStr
      );
    },
    [sessionSubject, persistState]
  );

  const handleCustomApply = useCallback(() => {
    const parsed = parseInt(customMinutes, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 180) {
      setPreset(parsed, 'pomodoro');
    }
  }, [customMinutes, setPreset]);

  return (
    <FocusContext.Provider
      value={{
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
      }}
    >
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error('useFocus must be used within a FocusProvider');
  }
  return context;
}
