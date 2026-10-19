export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskType = 'daily' | 'weekly' | 'monthly';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export type TaskCategory = 'Study' | 'Revision' | 'Project' | 'Personal' | 'Work';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: TaskType;
  priority: Priority;
  category: TaskCategory;
  deadline: string; // ISO date string (YYYY-MM-DD or full ISO)
  status: TaskStatus;
  subtasks: Subtask[];
  createdAt: string;
  completedAt?: string | null;
}

export type RevisionIntervalDays = 1 | 3 | 7 | 15 | 30 | 60;

export type RevisionStatus = 'pending' | 'completed' | 'overdue' | 'skipped';

export type RevisionRating = 'again' | 'hard' | 'good' | 'easy';

export interface RevisionScheduleItem {
  id: string;
  topicId: string;
  step: number; // 1 to 6
  intervalDays: RevisionIntervalDays;
  scheduledDate: string; // YYYY-MM-DD
  status: RevisionStatus;
  completedAt?: string | null;
  rating?: RevisionRating | null;
  notes?: string;
}

export interface Topic {
  id: string;
  userId: string;
  title: string;
  subject: string;
  content: string; // Detailed notes / summary
  tags: string[];
  initialStudyDate: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
  revisions: RevisionScheduleItem[];
  color?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface StudyAlarm {
  id: string;
  userId: string;
  title: string;
  time: string; // HH:mm format (24-hour)
  days: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday (empty array = once)
  enabled: boolean;
  sound: 'bell' | 'chime' | 'digital' | 'gong';
  createdAt: string;
}

export interface StudySession {
  id: string;
  userId: string;
  subject?: string;
  topicTitle?: string;
  durationSeconds: number;
  type: 'pomodoro' | 'stopwatch' | 'countdown';
  completedAt: string;
  notes?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  avatar?: string;
  dailyStudyTargetMinutes: number;
  streakDays: number;
  lastActiveDate?: string | null; // YYYY-MM-DD
  createdAt: string;
}

export interface UserPublicProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  dailyStudyTargetMinutes: number;
  streakDays: number;
  lastActiveDate?: string | null;
  createdAt: string;
}

export interface ProductivityStats {
  productivityScore: number; // 0 to 100%
  completedTasksCount: number;
  totalTasksCount: number;
  taskCompletionRate: number; // 0 to 100%
  
  completedRevisionsCount: number;
  dueRevisionsCount: number;
  overdueRevisionsCount: number;
  revisionCompletionRate: number; // 0 to 100%
  
  todayFocusMinutes: number;
  targetFocusMinutes: number;
  focusGoalRate: number; // 0 to 100%
  
  streakDays: number;
  totalTopicsCount: number;
  masteredTopicsCount: number; // Day 60 completed
  
  weeklyData: {
    day: string; // Mon, Tue, etc.
    date: string; // YYYY-MM-DD
    tasksCompleted: number;
    revisionsCompleted: number;
    focusMinutes: number;
    score: number;
  }[];

  subjectBreakdown: {
    subject: string;
    topicCount: number;
    revisionCount: number;
    color: string;
  }[];

  activityHeatmap: ActivityHeatmapDay[];
  totalActiveDays: number;
  maxStreak: number;
}

export interface ActivityHeatmapDay {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  details: {
    tasks: number;
    revisions: number;
    focusMinutes: number;
  };
}

export interface LeaderboardUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  streakDays: number;
  productivityScore: number;
  completedRevisions: number;
  completedTasks: number;
  focusMinutes: number;
  badge: string;
  rank: number;
  isCurrentUser?: boolean;
}

