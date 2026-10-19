'use client';

import React from 'react';
import { Task } from '@/lib/types';
import { CheckSquare, Check, ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEngine } from '@/lib/audio';
import { useToast } from '@/context/ToastContext';

interface DailyTasksWidgetProps {
  tasks: Task[];
  onToggleTask: (taskId: string, currentStatus: string) => Promise<void>;
  onViewAllTasks: () => void;
  onAddTask: () => void;
}

export function DailyTasksWidget({
  tasks,
  onToggleTask,
  onViewAllTasks,
  onAddTask,
}: DailyTasksWidgetProps) {
  const { success } = useToast();
  const dailyTasks = tasks.filter((t) => t.type === 'daily');
  const pendingCount = dailyTasks.filter((t) => t.status !== 'completed').length;

  const handleToggle = async (task: Task) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    if (nextStatus === 'completed') {
      soundEngine.playSuccess();
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.8 },
      });
      success('Task Completed!', `"${task.title}" checked off.`);
    }
    await onToggleTask(task.id, task.status);
  };

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'urgent':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-900';
      case 'high':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-900';
      case 'medium':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-900';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="p-6 rounded-3xl glass border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              Daily Tasks
              {pendingCount > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                  {pendingCount} Left
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-500">Target daily completion</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAddTask}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 px-2.5 py-1 rounded-lg transition-colors"
          >
            + Add
          </button>
          <button
            onClick={onViewAllTasks}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {dailyTasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">No daily tasks scheduled for today.</p>
          <button
            onClick={onAddTask}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            Create First Daily Task
          </button>
        </div>
      ) : (
        <div className="space-y-2 flex-1 overflow-y-auto max-h-[340px] pr-1">
          {dailyTasks.slice(0, 5).map((task) => {
            const isDone = task.status === 'completed';
            const completedSubCount = task.subtasks.filter((s) => s.completed).length;

            return (
              <div
                key={task.id}
                onClick={() => handleToggle(task)}
                className={`group p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isDone
                    ? 'border-slate-200/50 dark:border-slate-800/50 bg-slate-50/40 dark:bg-slate-900/30 opacity-70'
                    : 'border-slate-200/70 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                      isDone
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  <div className="min-w-0">
                    <p
                      className={`text-xs font-semibold truncate transition-all ${
                        isDone
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.subtasks.length > 0 && (
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {completedSubCount}/{task.subtasks.length} subtasks done
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getPriorityBadge(
                      task.priority
                    )}`}
                  >
                    {task.priority}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
