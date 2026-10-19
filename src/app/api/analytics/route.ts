import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getUserTasks, getUserTopics, getUserSessions, findUserById } from '@/lib/db';
import { getCalculatedRevisionStatus } from '@/lib/spaced-repetition';
import { ProductivityStats, ActivityHeatmapDay } from '@/lib/types';
import { format, subDays, parseISO, isSameDay } from 'date-fns';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = findUserById(session.userId);
  const tasks = getUserTasks(session.userId);
  const topics = getUserTopics(session.userId);
  const sessions = getUserSessions(session.userId);

  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');
  const targetFocusMinutes = user?.dailyStudyTargetMinutes || 120;

  // =========================================================================
  // 1. TODAY'S SPECIFIC METRICS (Starts strictly at 0% every day!)
  // =========================================================================

  // Today's completed tasks
  const todayCompletedTasks = tasks.filter((t) => {
    return t.status === 'completed' && t.completedAt && t.completedAt.startsWith(todayStr);
  }).length;

  const todayDailyTasks = tasks.filter((t) => t.type === 'daily');
  const totalDailyTasksCount = todayDailyTasks.length;
  const todayDailyTaskRate =
    totalDailyTasksCount > 0 ? (todayCompletedTasks / totalDailyTasksCount) * 100 : 0;

  // Today's revisions
  let dueRevisionsCount = 0;
  let overdueRevisionsCount = 0;
  let todayCompletedRevisions = 0;
  let allTimeCompletedRevisions = 0;
  let totalRevisionsCount = 0;
  let masteredTopicsCount = 0;

  const subjectMap = new Map<string, { topicCount: number; revisionCount: number }>();

  topics.forEach((topic) => {
    const existingSub = subjectMap.get(topic.subject) || { topicCount: 0, revisionCount: 0 };
    existingSub.topicCount += 1;

    let hasCompletedDay60 = false;

    topic.revisions.forEach((rev) => {
      totalRevisionsCount += 1;
      const status = getCalculatedRevisionStatus(rev, now);

      if (status === 'due') dueRevisionsCount += 1;
      else if (status === 'overdue') overdueRevisionsCount += 1;

      if (rev.status === 'completed') {
        allTimeCompletedRevisions += 1;
        existingSub.revisionCount += 1;
        if (rev.step === 6) hasCompletedDay60 = true;

        if (rev.completedAt && rev.completedAt.startsWith(todayStr)) {
          todayCompletedRevisions += 1;
        }
      }
    });

    if (hasCompletedDay60) {
      masteredTopicsCount += 1;
    }

    subjectMap.set(topic.subject, existingSub);
  });

  const totalActionableTodayRevisions = dueRevisionsCount + todayCompletedRevisions;
  const todayRevisionRate =
    totalActionableTodayRevisions > 0
      ? (todayCompletedRevisions / totalActionableTodayRevisions) * 100
      : 0;

  // Today's study focus sessions
  const todaySessions = sessions.filter((s) => {
    try {
      return isSameDay(parseISO(s.completedAt), now);
    } catch {
      return false;
    }
  });

  const todayFocusSeconds = todaySessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const todayFocusMinutes = Math.round(todayFocusSeconds / 60);
  const focusGoalRate = Math.min(100, Math.round((todayFocusMinutes / targetFocusMinutes) * 100));

  // =========================================================================
  // OVERALL TODAY PRODUCTIVITY SCORE:
  // Starts at 0% from the start of the day!
  // Increases as revisions, tasks, and focus minutes are completed today.
  // =========================================================================
  let productivityScore = 0;
  if (todayCompletedRevisions === 0 && todayCompletedTasks === 0 && todayFocusMinutes === 0) {
    productivityScore = 0;
  } else {
    const weighted =
      todayRevisionRate * 0.4 +
      todayDailyTaskRate * 0.4 +
      focusGoalRate * 0.2;
    productivityScore = Math.max(0, Math.min(100, Math.round(weighted)));
  }

  // Task completion rates for general dashboard display
  const allCompletedTasks = tasks.filter((t) => t.status === 'completed').length;
  const taskCompletionRate = tasks.length > 0 ? Math.round((allCompletedTasks / tasks.length) * 100) : 0;
  const revisionCompletionRate =
    totalRevisionsCount > 0 ? Math.round((allTimeCompletedRevisions / totalRevisionsCount) * 100) : 0;

  // =========================================================================
  // 2. 7-DAY PRODUCTIVITY TREND
  // =========================================================================
  const weeklyData = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const targetDate = subDays(now, i);
    const dateStr = format(targetDate, 'yyyy-MM-dd');
    const dayName = dayNames[targetDate.getDay()];

    const dayTasks = tasks.filter((t) => t.completedAt && t.completedAt.startsWith(dateStr)).length;

    let dayRevisions = 0;
    topics.forEach((t) => {
      t.revisions.forEach((r) => {
        if (r.completedAt && r.completedAt.startsWith(dateStr)) {
          dayRevisions += 1;
        }
      });
    });

    const dayFocusSeconds = sessions
      .filter((s) => s.completedAt.startsWith(dateStr))
      .reduce((acc, s) => acc + s.durationSeconds, 0);
    const dayFocusMins = Math.round(dayFocusSeconds / 60);

    const dayScore =
      i === 0
        ? productivityScore // Today is strictly productivityScore (starts at 0%)
        : Math.min(100, Math.round(dayTasks * 25 + dayRevisions * 25 + Math.min(50, dayFocusMins)));

    weeklyData.push({
      day: dayName,
      date: dateStr,
      tasksCompleted: dayTasks,
      revisionsCompleted: dayRevisions,
      focusMinutes: dayFocusMins,
      score: dayScore,
    });
  }

  // =========================================================================
  // 3. LEETCODE DARK DAILY ACTIVE HEATMAP CALENDAR (Past 365 Days)
  // Only active days are highlighted; inactive/other days are dark blank squares!
  // =========================================================================
  const activityHeatmap: ActivityHeatmapDay[] = [];
  const daysToTrack = 364; // 52 weeks * 7 days
  let totalActiveDays = 0;
  let maxStreak = 0;
  let currentStreakCounter = 0;

  for (let i = daysToTrack - 1; i >= 0; i--) {
    const dayDate = subDays(now, i);
    const dateStr = format(dayDate, 'yyyy-MM-dd');

    // Count tasks on this day
    const dayTasks = tasks.filter((t) => t.completedAt && t.completedAt.startsWith(dateStr)).length;

    // Count revisions on this day
    let dayRevisions = 0;
    topics.forEach((t) => {
      t.revisions.forEach((r) => {
        if (r.completedAt && r.completedAt.startsWith(dateStr)) {
          dayRevisions += 1;
        }
      });
    });

    // Count focus minutes on this day
    const dayFocusSeconds = sessions
      .filter((s) => s.completedAt.startsWith(dateStr))
      .reduce((acc, s) => acc + s.durationSeconds, 0);
    const dayFocusMinutes = Math.round(dayFocusSeconds / 60);

    // Activity sum
    const totalActivity = dayTasks + dayRevisions + (dayFocusMinutes > 0 ? 1 : 0);

    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (totalActivity === 0) {
      level = 0; // Blank dark square
      currentStreakCounter = 0;
    } else {
      totalActiveDays += 1;
      currentStreakCounter += 1;
      if (currentStreakCounter > maxStreak) {
        maxStreak = currentStreakCounter;
      }

      if (totalActivity === 1) level = 1;
      else if (totalActivity === 2) level = 2;
      else if (totalActivity === 3 || totalActivity === 4) level = 3;
      else level = 4;
    }

    activityHeatmap.push({
      date: dateStr,
      count: totalActivity,
      level,
      details: {
        tasks: dayTasks,
        revisions: dayRevisions,
        focusMinutes: dayFocusMinutes,
      },
    });
  }

  // Subject breakdown formatting
  const subjectColors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
  let colorIdx = 0;
  const subjectBreakdown = Array.from(subjectMap.entries()).map(([subject, data]) => {
    const color = subjectColors[colorIdx % subjectColors.length];
    colorIdx++;
    return {
      subject,
      topicCount: data.topicCount,
      revisionCount: data.revisionCount,
      color,
    };
  });

  const responseStats: ProductivityStats = {
    productivityScore,
    completedTasksCount: allCompletedTasks,
    totalTasksCount: tasks.length,
    taskCompletionRate,
    completedRevisionsCount: allTimeCompletedRevisions,
    dueRevisionsCount,
    overdueRevisionsCount,
    revisionCompletionRate,
    todayFocusMinutes,
    targetFocusMinutes,
    focusGoalRate,
    streakDays: user?.streakDays || 0,
    totalTopicsCount: topics.length,
    masteredTopicsCount,
    weeklyData,
    subjectBreakdown,
    activityHeatmap,
    totalActiveDays,
    maxStreak,
  };

  return NextResponse.json({ stats: responseStats });
}
