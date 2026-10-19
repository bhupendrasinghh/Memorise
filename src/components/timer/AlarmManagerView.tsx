'use client';

import React, { useState } from 'react';
import { useAlarm } from '@/context/AlarmContext';
import { Bell, Plus, Trash2, Volume2, Clock, Check, X } from 'lucide-react';
import { StudyAlarm } from '@/lib/types';
import { useToast } from '@/context/ToastContext';

export function AlarmManagerView() {
  const { alarms, reloadAlarms, testSound } = useAlarm();
  const { success } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('08:30');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon - Fri default
  const [sound, setSound] = useState<'bell' | 'chime' | 'digital' | 'gong'>('chime');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const toggleDay = (dayIdx: number) => {
    if (selectedDays.includes(dayIdx)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayIdx));
    } else {
      setSelectedDays([...selectedDays, dayIdx].sort());
    }
  };

  const handleToggleAlarmEnabled = async (alarm: StudyAlarm) => {
    try {
      const res = await fetch(`/api/alarms/${alarm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !alarm.enabled }),
      });
      if (res.ok) {
        reloadAlarms();
      }
    } catch (err) {
      console.error('Error toggling alarm:', err);
    }
  };

  const handleDeleteAlarm = async (id: string) => {
    try {
      const res = await fetch(`/api/alarms/${id}`, { method: 'DELETE' });
      if (res.ok) {
        reloadAlarms();
        success('Alarm Removed', 'Study alarm has been deleted.');
      }
    } catch (err) {
      console.error('Error deleting alarm:', err);
    }
  };

  const handleCreateAlarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !time) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/alarms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          time,
          days: selectedDays,
          sound,
          enabled: true,
        }),
      });

      if (res.ok) {
        reloadAlarms();
        setModalOpen(false);
        setTitle('');
        success('Study Alarm Set!', `Scheduled for ${time} with ${sound} chime.`);
      }
    } catch (err) {
      console.error('Error creating alarm:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl glass border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
              <Bell className="w-4 h-4" />
            </span>
            <h2 className="font-bold text-lg text-slate-900 dark:text-white">
              Study Alarms & Reminders
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Alarms trigger synthesized audio chimes and system notifications when your study block arrives
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/25 transition-all transform active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Set Study Alarm
        </button>
      </div>

      {alarms.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40">
          <p className="text-xs text-slate-500 mb-2">No study alarms configured.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            Create your first alarm
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {alarms.map((alarm) => {
            const isDaily = alarm.days.length === 0 || alarm.days.length === 7;
            const isWeekdays =
              alarm.days.length === 5 &&
              [1, 2, 3, 4, 5].every((d) => alarm.days.includes(d));

            let daysText = 'Daily';
            if (isWeekdays) daysText = 'Mon - Fri';
            else if (!isDaily) {
              daysText = alarm.days.map((d) => dayLabels[d]).join(', ');
            }

            return (
              <div
                key={alarm.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                  alarm.enabled
                    ? 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-xs'
                    : 'border-slate-100 dark:border-slate-800/50 bg-slate-50/40 dark:bg-slate-900/30 opacity-60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl sm:text-3xl font-mono font-extrabold text-slate-900 dark:text-white">
                    {alarm.time}
                  </span>

                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {alarm.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                      <span>{daysText}</span>
                      <span>•</span>
                      <button
                        onClick={() => testSound(alarm.sound)}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
                      >
                        <Volume2 className="w-3 h-3" /> {alarm.sound}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Enable / Disable toggle switch */}
                  <button
                    onClick={() => handleToggleAlarmEnabled(alarm)}
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 focus:outline-none ${
                      alarm.enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        alarm.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>

                  <button
                    onClick={() => handleDeleteAlarm(alarm.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Alarm Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Add Study Alarm
            </h3>

            <form onSubmit={handleCreateAlarm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Alarm Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Afternoon Revision Kickoff"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Alarm Time (24h)
                </label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-none"
                />
              </div>

              {/* Day Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Repeat Days
                </label>
                <div className="flex gap-1.5">
                  {dayLabels.map((label, idx) => {
                    const isSelected = selectedDays.includes(idx);
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleDay(idx)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {label[0]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sound Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Alarm Tone
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['chime', 'bell', 'digital', 'gong'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setSound(s);
                        testSound(s);
                      }}
                      className={`p-2 rounded-xl text-xs font-bold capitalize flex items-center justify-between border ${
                        sound === s
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span>{s}</span>
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/25"
                >
                  {isSubmitting ? 'Saving...' : 'Set Alarm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
