import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { readDatabase } from '@/lib/db';
import { LeaderboardUser } from '@/lib/types';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  const currentUserId = session?.userId || '';

  const db = readDatabase();
  const dbUsers = db.users || [];
  const dbTopics = db.topics || [];
  const dbTasks = db.tasks || [];
  const dbSessions = db.sessions || [];

  // Map ONLY real registered users from the database — NO fake/dummy profiles!
  const realUsers: LeaderboardUser[] = dbUsers.map((u) => {
    const userTopics = dbTopics.filter((t) => t.userId === u.id);
    let revDone = 0;
    userTopics.forEach((t) => {
      t.revisions.forEach((r) => {
        if (r.status === 'completed') revDone++;
      });
    });

    const userTasks = dbTasks.filter((t) => t.userId === u.id);
    const tasksDone = userTasks.filter((t) => t.status === 'completed').length;

    const userSessions = dbSessions.filter((s) => s.userId === u.id);
    const focusSecs = userSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    const focusMins = Math.round(focusSecs / 60);

    // Productivity score based on real user actions only
    const score = Math.min(
      100,
      Math.max(
        0,
        Math.round(((u.streakDays || 0) * 2) + (revDone * 5) + (tasksDone * 4) + Math.min(30, Math.round(focusMins / 10)))
      )
    );

    let badge = 'Scholar';
    if ((u.streakDays || 0) >= 20 || score >= 90) badge = 'Grandmaster';
    else if ((u.streakDays || 0) >= 10 || score >= 75) badge = 'Master Learner';
    else if ((u.streakDays || 0) >= 3 || score >= 40) badge = 'Dedicated Student';

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      streakDays: u.streakDays || 0,
      productivityScore: score,
      completedRevisions: revDone,
      completedTasks: tasksDone,
      focusMinutes: focusMins,
      badge,
      rank: 0,
      isCurrentUser: u.id === currentUserId,
    };
  });

  // Sort real users by productivity score, then streak, then revisions completed
  const sorted = [...realUsers].sort((a, b) => {
    if (b.productivityScore !== a.productivityScore) {
      return b.productivityScore - a.productivityScore;
    }
    if (b.streakDays !== a.streakDays) {
      return b.streakDays - a.streakDays;
    }
    return b.completedRevisions - a.completedRevisions;
  });

  // Assign ranks 1, 2, 3...
  const rankedUsers = sorted.map((u, idx) => ({
    ...u,
    rank: idx + 1,
  }));

  const currentUserRank = rankedUsers.find((u) => u.isCurrentUser || u.id === currentUserId);

  return NextResponse.json({
    leaderboard: rankedUsers,
    currentUser: currentUserRank || null,
    totalScholars: rankedUsers.length,
  });
}
