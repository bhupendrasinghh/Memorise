'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ToastProvider, useToast } from '@/context/ToastContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AlarmProvider } from '@/context/AlarmContext';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { MobileNav } from '@/components/MobileNav';
import { AuthModal } from '@/components/AuthModal';
import { WhatsAppModal } from '@/components/whatsapp/WhatsAppModal';

import { ProductivityCard } from '@/components/dashboard/ProductivityCard';
import { DueRevisionsWidget } from '@/components/dashboard/DueRevisionsWidget';
import { DailyTasksWidget } from '@/components/dashboard/DailyTasksWidget';
import { PerformanceCharts } from '@/components/dashboard/PerformanceCharts';
import { SubjectBreakdownCard } from '@/components/dashboard/SubjectBreakdownCard';
import { LeetCodeActivityCalendar } from '@/components/dashboard/LeetCodeActivityCalendar';

import { TopicModal } from '@/components/revisions/TopicModal';
import { RevisionReviewModal } from '@/components/revisions/RevisionReviewModal';
import { TopicCard } from '@/components/revisions/TopicCard';
import { SpacedRepetitionGuide } from '@/components/revisions/SpacedRepetitionGuide';

import { TaskModal } from '@/components/tasks/TaskModal';
import { TaskItem } from '@/components/tasks/TaskItem';

import { FocusTimerView } from '@/components/timer/FocusTimerView';
import { StopwatchView } from '@/components/timer/StopwatchView';
import { AlarmManagerView } from '@/components/timer/AlarmManagerView';

import { AnalyticsView } from '@/components/analytics/AnalyticsView';
import { LeaderboardView } from '@/components/leaderboard/LeaderboardView';

import { Topic, Task, ProductivityStats, RevisionScheduleItem, TaskType } from '@/lib/types';
import { EnrichedRevisionItem } from './api/revisions/route';
import {
  Repeat,
  CheckSquare,
  Plus,
  Search,
  Filter,
  Brain,
  Timer,
  Clock,
  Sparkles,
  Award,
  AlertCircle,
  HelpCircle,
  Flame,
} from 'lucide-react';

function DashboardApp() {
  const { user } = useAuth();
  const { success } = useToast();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Data states
  const [topics, setTopics] = useState<Topic[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<ProductivityStats | null>(null);
  const [dueRevisions, setDueRevisions] = useState<EnrichedRevisionItem[]>([]);
  const [overdueRevisions, setOverdueRevisions] = useState<EnrichedRevisionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [reviewModalRevision, setReviewModalRevision] = useState<EnrichedRevisionItem | null>(null);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);

  // Filtering for Tasks tab
  const [taskTypeFilter, setTaskTypeFilter] = useState<'all' | TaskType>('all');
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');

  // Filtering for Topics tab
  const [topicSearchQuery, setTopicSearchQuery] = useState('');
  const [topicSubjectFilter, setTopicSubjectFilter] = useState('all');

  // Subtab for Timer
  const [timerSubtab, setTimerSubtab] = useState<'pomodoro' | 'stopwatch'>('pomodoro');

  // Fetch all user data
  // Fetch all user data (passes client local date so midnight rollover updates right after 00:00)
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const clientToday = format(new Date(), 'yyyy-MM-dd');
      const [topicsRes, tasksRes, revisionsRes, statsRes] = await Promise.all([
        fetch('/api/topics'),
        fetch('/api/tasks'),
        fetch(`/api/revisions?date=${clientToday}`),
        fetch(`/api/analytics?date=${clientToday}`),
      ]);

      if (topicsRes.ok) {
        const d = await topicsRes.json();
        setTopics(d.topics || []);
      }
      if (tasksRes.ok) {
        const d = await tasksRes.json();
        setTasks(d.tasks || []);
      }
      if (revisionsRes.ok) {
        const d = await revisionsRes.json();
        setDueRevisions(d.dueToday || []);
        setOverdueRevisions(d.overdue || []);
      }
      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(d.stats || null);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, user]);

  // Midnight Rollover Listener (Updates Activity Calendar and resets daily score right after 00:00:00)
  useEffect(() => {
    const getMsUntilMidnight = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 2);
      return Math.max(1000, tomorrow.getTime() - now.getTime());
    };

    let timerId: NodeJS.Timeout;
    const scheduleMidnightRefresh = () => {
      const ms = getMsUntilMidnight();
      timerId = setTimeout(() => {
        fetchData();
        scheduleMidnightRefresh();
      }, ms);
    };

    scheduleMidnightRefresh();

    // Also auto-refresh when tab gains focus or device wakes up after 00:00
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };

    window.addEventListener('focus', onVisibilityChange);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearTimeout(timerId);
      window.removeEventListener('focus', onVisibilityChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [fetchData]);

  // Task Handlers
  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    const localNow = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const clientDate = format(new Date(), 'yyyy-MM-dd');
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          completedAt: nextStatus === 'completed' ? localNow : null,
          clientDate,
        }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    const localNow = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const clientDate = format(new Date(), 'yyyy-MM-dd');
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toggleSubtask: true,
          subtaskId,
          completedAt: localNow,
          clientDate,
        }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error toggling subtask:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        success('Task Deleted', 'The task has been removed.');
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('Are you sure you want to delete this topic and its revision schedules?')) return;
    try {
      const res = await fetch(`/api/topics/${topicId}`, { method: 'DELETE' });
      if (res.ok) {
        success('Topic Deleted', 'Topic and its 6 revision intervals removed.');
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting topic:', err);
    }
  };

  // Open Review from topic card
  const handleOpenReviewFromStep = (topic: Topic, stepItem: RevisionScheduleItem) => {
    const enriched: EnrichedRevisionItem = {
      ...stepItem,
      topicTitle: topic.title,
      subject: topic.subject,
      tags: topic.tags,
      topicContent: topic.content,
      difficulty: topic.difficulty,
      computedStatus: 'due',
    };
    setReviewModalRevision(enriched);
  };

  // Filtered Tasks
  const filteredTasks = tasks.filter((t) => {
    if (taskTypeFilter !== 'all' && t.type !== taskTypeFilter) return false;
    if (taskStatusFilter !== 'all' && t.status !== taskStatusFilter) return false;
    if (taskSearchQuery.trim()) {
      const q = taskSearchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  // Filtered Topics
  const allSubjects = Array.from(new Set(topics.map((t) => t.subject)));
  const filteredTopics = topics.filter((t) => {
    if (topicSubjectFilter !== 'all' && t.subject !== topicSubjectFilter) return false;
    if (topicSearchQuery.trim()) {
      const q = topicSearchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchNotes = t.content.toLowerCase().includes(q);
      const matchTags = t.tags.some((tag) => tag.toLowerCase().includes(q));
      if (!matchTitle && !matchNotes && !matchTags) return false;
    }
    return true;
  });

  const dueCount = dueRevisions.length + overdueRevisions.length;
  const pendingTasksCount = tasks.filter((t) => t.status !== 'completed').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        onOpenAuth={() => setAuthModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenWhatsApp={() => setWhatsappModalOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          dueRevisionsCount={dueCount}
          pendingTasksCount={pendingTasksCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-y-auto">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              {/* Welcome Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-md mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Spaced Repetition & Daily Productivity Hub</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Hello, {user?.name || 'Scholar'} 👋
                  </h1>
                  <p className="text-indigo-200 text-xs sm:text-sm mt-1 max-w-xl">
                    You have <strong className="text-white">{dueCount} topics</strong> due for spaced repetition today and <strong className="text-white">{pendingTasksCount} active tasks</strong>.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 relative z-10 shrink-0">
                  <button
                    onClick={() => setWhatsappModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 transition-all transform active:scale-95 border border-emerald-400/30"
                    title="Send or schedule 5:00 PM Daily WhatsApp Report"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                    </svg>
                    <span>WhatsApp (5 PM)</span>
                  </button>
                  <button
                    onClick={() => setTopicModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-900 font-bold text-xs shadow-md hover:bg-indigo-50 transition-all transform active:scale-95"
                  >
                    <Plus className="w-4 h-4" /> Save Topic
                  </button>
                  <button
                    onClick={() => setTaskModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold text-xs border border-white/20 transition-all transform active:scale-95"
                  >
                    <CheckSquare className="w-4 h-4" /> Add Task
                  </button>
                </div>
              </div>

              {/* Productivity Overview Gauge */}
              <ProductivityCard stats={stats} loading={loading} />

              {/* Due Revisions & Daily Tasks Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DueRevisionsWidget
                  dueRevisions={dueRevisions}
                  overdueRevisions={overdueRevisions}
                  onOpenReview={(rev) => setReviewModalRevision(rev)}
                  onRefresh={fetchData}
                  onViewAllRevisions={() => setActiveTab('revisions')}
                />

                <DailyTasksWidget
                  tasks={tasks}
                  onToggleTask={handleToggleTask}
                  onViewAllTasks={() => setActiveTab('tasks')}
                  onAddTask={() => setTaskModalOpen(true)}
                />
              </div>

              {/* 7-Day Performance Charts & Subject Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <PerformanceCharts stats={stats} />
                </div>
                <div>
                  <SubjectBreakdownCard stats={stats} />
                </div>
              </div>

              {/* LeetCode Dark Daily Activity Heatmap */}
              <LeetCodeActivityCalendar
                activityHeatmap={stats?.activityHeatmap}
                totalActiveDays={stats?.totalActiveDays}
                maxStreak={stats?.maxStreak}
              />
            </div>
          )}

          {/* TAB 2: SMART REVISIONS */}
          {activeTab === 'revisions' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Repeat className="w-5 h-5" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                      Smart Revision System
                    </h1>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Automated Day 1, 3, 7, 15, 30, and 60 spaced repetition intervals for 90%+ long-term retention
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setActiveTab('guide')}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-indigo-500" />
                    <span>How it Works</span>
                  </button>

                  <button
                    onClick={() => setTopicModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/25 transition-all transform active:scale-95"
                  >
                    <Plus className="w-4 h-4" /> Save Topic & Auto-Schedule
                  </button>
                </div>
              </div>

              {/* Action Banner for Due Revisions if any */}
              {dueCount > 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-indigo-500/10 border border-rose-300 dark:border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold text-xs">
                      {dueCount}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {dueCount} Topic{dueCount > 1 ? 's' : ''} Ready for Spaced Recall Review Today
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Reviewing today ensures your memory curve does not decay.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const first = dueRevisions[0] || overdueRevisions[0];
                      if (first) setReviewModalRevision(first);
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all self-start sm:self-auto"
                  >
                    Start Quick Review Queue
                  </button>
                </div>
              )}

              {/* Search & Subject Filters */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search topics, notes, or tags..."
                    value={topicSearchQuery}
                    onChange={(e) => setTopicSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={topicSubjectFilter}
                    onChange={(e) => setTopicSubjectFilter(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="all">All Subjects ({topics.length})</option>
                    {allSubjects.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Topics List with 6-Interval Timelines */}
              {filteredTopics.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/40">
                  <p className="text-sm text-slate-500 mb-3">No topics match your current filter.</p>
                  <button
                    onClick={() => setTopicModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                  >
                    Save Your First Topic
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTopics.map((topic) => (
                    <TopicCard
                      key={topic.id}
                      topic={topic}
                      onOpenReviewStep={handleOpenReviewFromStep}
                      onDeleteTopic={handleDeleteTopic}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TASK MANAGEMENT */}
          {activeTab === 'tasks' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <CheckSquare className="w-5 h-5" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                      Task Management
                    </h1>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Create and organize daily tasks, weekly goals, and monthly milestones with subtasks
                  </p>
                </div>

                <button
                  onClick={() => setTaskModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/25 transition-all transform active:scale-95 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" /> Create Task
                </button>
              </div>

              {/* Timeframe Tabs: All, Daily, Weekly, Monthly */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80">
                  {(['all', 'daily', 'weekly', 'monthly'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTaskTypeFilter(t)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                        taskTypeFilter === t
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {t === 'all' ? 'All Tasks' : `${t} Tasks`}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={taskStatusFilter}
                    onChange={(e) => setTaskStatusFilter(e.target.value as any)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Tasks List */}
              {filteredTasks.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/40">
                  <p className="text-sm text-slate-500 mb-3">No tasks found for the current selection.</p>
                  <button
                    onClick={() => setTaskModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                  >
                    Add a New Task
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggleTask={handleToggleTask}
                      onToggleSubtask={handleToggleSubtask}
                      onDeleteTask={handleDeleteTask}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: STOPWATCH & FOCUS TIMER */}
          {activeTab === 'timer' && (
            <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
              <div className="text-center">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  Study Focus & Stopwatch
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Manage deep study sessions with Pomodoro countdowns and precision lap stopwatch
                </p>

                {/* Subtab Switch */}
                <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 mt-4">
                  <button
                    onClick={() => setTimerSubtab('pomodoro')}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                      timerSubtab === 'pomodoro'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Countdown Pomodoro
                  </button>
                  <button
                    onClick={() => setTimerSubtab('stopwatch')}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                      timerSubtab === 'stopwatch'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Precision Stopwatch & Laps
                  </button>
                </div>
              </div>

              {timerSubtab === 'pomodoro' ? (
                <FocusTimerView onSessionSaved={fetchData} />
              ) : (
                <StopwatchView onSessionSaved={fetchData} />
              )}
            </div>
          )}

          {/* TAB 5: STUDY ALARMS */}
          {activeTab === 'alarms' && (
            <div className="max-w-3xl mx-auto animate-fade-in">
              <AlarmManagerView />
            </div>
          )}

          {/* TAB 6: GLOBAL SCHOLARS LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <div className="animate-fade-in">
              <LeaderboardView />
            </div>
          )}

          {/* TAB 7: PERFORMANCE ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="animate-fade-in">
              <AnalyticsView stats={stats} onRefresh={fetchData} />
            </div>
          )}

          {/* TAB 7: SCIENCE & NOTIFICATION GUIDE */}
          {activeTab === 'guide' && (
            <div className="animate-fade-in">
              <SpacedRepetitionGuide />
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dueRevisionsCount={dueCount}
      />

      {/* Modals */}
      <TopicModal
        isOpen={topicModalOpen}
        onClose={() => setTopicModalOpen(false)}
        onTopicCreated={fetchData}
      />

      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onTaskCreated={fetchData}
      />

      <RevisionReviewModal
        revision={reviewModalRevision}
        onClose={() => setReviewModalRevision(null)}
        onCompleted={fetchData}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <WhatsAppModal
        isOpen={whatsappModalOpen}
        onClose={() => setWhatsappModalOpen(false)}
      />
    </div>
  );
}

export default function Home() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AlarmProvider>
          <DashboardApp />
        </AlarmProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
