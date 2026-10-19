'use client';

import React from 'react';
import { Task, Subtask } from '@/lib/types';
import { Check, Trash2, Calendar, Clock, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEngine } from '@/lib/audio';
import { useToast } from '@/context/ToastContext';

interface TaskItemProps {
  task: Task;
  onToggleTask: (taskId: string, currentStatus: string) => Promise<void>;
  onToggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

export function TaskItem({
  task,
  onToggleTask,
  onToggleSubtask,
  onDeleteTask,
}: TaskItemProps) {
  const { success } = useToast();
  const [subtasksOpen, setSubtasksOpen] = React.useState(true);
  const isDone = task.status === 'completed';

  const completedSubCount = task.subtasks.filter((s) => s.completed).length;
  const totalSubCount = task.subtasks.length;
  const progressPercent = totalSubCount > 0 ? Math.round((completedSubCount / totalSubCount) * 100) : 0;

  const handleMainToggle = async () => {
    const nextStatus = isDone ? 'pending' : 'completed';
    if (nextStatus === 'completed') {
      soundEngine.playSuccess();
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.7 },
      });
      success('Task Completed!', `"${task.title}" has been completed.`);
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
    <div
      className={`p-4 sm:p-5 rounded-3xl border transition-all ${
        isDone
          ? 'border-slate-200/60 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/30 opacity-75'
          : 'border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          {/* Main Checkbox */}
          <button
            onClick={handleMainToggle}
            className={`w-6 h-6 mt-0.5 rounded-xl border flex items-center justify-center shrink-0 transition-all ${
              isDone
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500 bg-white dark:bg-slate-800'
            }`}
            title={isDone ? 'Mark as Incomplete' : 'Mark as Completed'}
            aria-label={isDone ? 'Mark as Incomplete' : 'Mark as Completed'}
          >
            {isDone && <Check className="w-4 h-4 stroke-[3]" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getPriorityBadge(
                  task.priority
                )}`}
              >
                {task.priority}
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {task.category}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Due {task.deadline}
              </span>
            </div>

            <h3
              className={`text-sm sm:text-base font-bold transition-all ${
                isDone
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {task.title}
            </h3>

            {task.description && (
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => onDeleteTask(task.id)}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
          title="Delete task"
          aria-label="Delete task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Subtasks checklist */}
      {totalSubCount > 0 && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>Subtasks: {completedSubCount} of {totalSubCount} done</span>
              <span>({progressPercent}%)</span>
            </div>
            <button
              onClick={() => setSubtasksOpen(!subtasksOpen)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              {subtasksOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Mini progress bar */}
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mb-2 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {subtasksOpen && (
            <div className="space-y-1.5 pl-2 mt-2">
              {task.subtasks.map((st) => (
                <div
                  key={st.id}
                  onClick={() => onToggleSubtask(task.id, st.id)}
                  className="flex items-center gap-2.5 py-1 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                      st.completed
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {st.completed && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span
                    className={`text-xs ${
                      st.completed
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {st.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
