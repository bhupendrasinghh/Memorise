'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { StudyAlarm } from '@/lib/types';
import { soundEngine } from '@/lib/audio';
import { sendBrowserNotification } from '@/lib/notifications';
import { useAuth, getAuthHeaders } from './AuthContext';
import { Bell, Volume2, X } from 'lucide-react';

interface AlarmContextType {
  alarms: StudyAlarm[];
  activeRingingAlarm: StudyAlarm | null;
  dismissAlarm: () => void;
  reloadAlarms: () => Promise<void>;
  testSound: (sound: 'bell' | 'chime' | 'digital' | 'gong') => void;
}

const AlarmContext = createContext<AlarmContextType | undefined>(undefined);

export function AlarmProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [alarms, setAlarms] = useState<StudyAlarm[]>([]);
  const [activeRingingAlarm, setActiveRingingAlarm] = useState<StudyAlarm | null>(null);
  const lastTriggeredMinuteRef = useRef<string>('');
  const soundIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const reloadAlarms = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/alarms', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAlarms(data.alarms || []);
      }
    } catch (err) {
      console.error('Failed to load alarms:', err);
    }
  }, [user]);

  useEffect(() => {
    reloadAlarms();
  }, [reloadAlarms]);

  const testSound = (sound: 'bell' | 'chime' | 'digital' | 'gong') => {
    soundEngine.playSound(sound);
  };

  const dismissAlarm = useCallback(() => {
    if (soundIntervalRef.current) {
      clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = null;
    }
    setActiveRingingAlarm(null);
  }, []);

  // Alarm clock ticker: checks every 5 seconds
  useEffect(() => {
    if (!user || alarms.length === 0) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const currentDay = now.getDay(); // 0 = Sun ... 6 = Sat

      // Avoid retriggering multiple times in the same minute
      if (lastTriggeredMinuteRef.current === currentTimeStr) return;

      for (const alarm of alarms) {
        if (!alarm.enabled) continue;
        if (alarm.time === currentTimeStr) {
          // Check day recurrence: empty array means every day / once
          const matchesDay = alarm.days.length === 0 || alarm.days.includes(currentDay);
          if (matchesDay) {
            lastTriggeredMinuteRef.current = currentTimeStr;
            setActiveRingingAlarm(alarm);

            // Play alarm sound immediately and repeat every 3s
            soundEngine.playSound(alarm.sound);
            if (soundIntervalRef.current) clearInterval(soundIntervalRef.current);
            soundIntervalRef.current = setInterval(() => {
              soundEngine.playSound(alarm.sound);
            }, 3200);

            // Send system/browser notification
            sendBrowserNotification(`⏰ Study Alarm: ${alarm.title}`, {
              body: `It is ${alarm.time}. Time for your planned study revision block!`,
              requireInteraction: true,
            });

            break;
          }
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user, alarms]);

  return (
    <AlarmContext.Provider value={{ alarms, activeRingingAlarm, dismissAlarm, reloadAlarms, testSound }}>
      {children}

      {/* Ringing Alarm Modal Banner */}
      {activeRingingAlarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border-2 border-indigo-500 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center relative pulse-glow">
            <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center animate-bounce">
              <Bell className="w-8 h-8" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 mb-2">
              <Volume2 className="w-3.5 h-3.5" /> Alarm Ringing ({activeRingingAlarm.time})
            </span>

            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1 mb-2">
              {activeRingingAlarm.title}
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              Time to transition to your scheduled study session or revision review.
            </p>

            <div className="flex gap-3">
              <button
                onClick={dismissAlarm}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95"
              >
                Dismiss Alarm
              </button>
            </div>
          </div>
        </div>
      )}
    </AlarmContext.Provider>
  );
}

export function useAlarm() {
  const context = useContext(AlarmContext);
  if (!context) {
    throw new Error('useAlarm must be used within an AlarmProvider');
  }
  return context;
}
