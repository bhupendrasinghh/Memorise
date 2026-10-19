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

  // Fellow community scholars to make the global leaderboard rich and engaging
  const communityPeers: LeaderboardUser[] = [
    {
      id: 'usr-peer-001',
      name: 'Maya Chen',
      email: 'maya.chen@stanford.edu',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      streakDays: 28,
      productivityScore: 96,
      completedRevisions: 42,
      completedTasks: 38,
      focusMinutes: 1850,
      badge: 'Spaced Scholar',
      rank: 0,
      isCurrentUser: false,
    },
    {
      id: 'usr-peer-002',
      name: 'Liam Patel',
      email: 'liam.p@mit.edu',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      streakDays: 21,
      productivityScore: 91,
      completedRevisions: 35,
      completedTasks: 29,
      focusMinutes: 1420,
      badge: 'Consistency Beast',
      rank: 0,
      isCurrentUser: false,
    },
    {
      id: 'usr-peer-003',
      name: 'Sophia Rossi',
      email: 'sophia.r@oxford.ac.uk',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      streakDays: 18,
      productivityScore: 88,
      completedRevisions: 27,
      completedTasks: 31,
      focusMinutes: 1200,
      badge: 'Deep Worker',
      rank: 0,
      isCurrentUser: false,
    },
    {
      id: 'usr-peer-004',
      name: 'Lucas Becker',
      email: 'lucas.b@cam.ac.uk',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      streakDays: 12,
      productivityScore: 82,
      completedRevisions: 20,
      completedTasks: 24,
      focusMinutes: 980,
      badge: 'Rising Scholar',
      rank: 0,
      isCurrentUser: false,
    },
    {
      id: 'usr-peer-005',
      name: 'Aisha Al-Mansoor',
      email: 'aisha.m@nus.edu.sg',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      streakDays: 9,
      productivityScore: 78,
      completedRevisions: 16,
      completedTasks: 19,
      focusMinutes: 840,
      badge: 'Topic Pioneer',
      rank: 0,
      isCurrentUser: false,
    },
  ];

  // Map real database users
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

    // Productivity score estimation
    const score = Math.min(
      100,
      Math.max(
        40,
        Math.round((u.streakDays * 3) + (revDone * 4) + (tasksDone * 3) + Math.min(25, focusMins / 30))
      )
    );

    let badge = 'Active Scholar';
    if (u.streakDays >= 20 || score >= 90) badge = 'Grandmaster';
    else if (u.streakDays >= 10 || score >= 75) badge = 'Master Learner';
    else if (u.streakDays >= 5) badge = 'Dedicated Student';

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      streakDays: u.streakDays || 1,
      productivityScore: score,
      completedRevisions: revDone,
      completedTasks: tasksDone,
      focusMinutes: focusMins,
      badge,
      rank: 0,
      isCurrentUser: u.id === currentUserId,
    };
  });

  // Combine and sort by score & streak
  const combined = [...realUsers, ...communityPeers];
  // Deduplicate in case demo user shares an id
  const uniqueMap = new Map<string, LeaderboardUser>();
  combined.forEach((u) => {
    if (!uniqueMap.has(u.id)) {
      uniqueMap.set(u.id, u);
    }
  });

  const sorted = Array.from(uniqueMap.values()).sort((a, b) => {
    if (b.productivityScore !== a.productivityScore) {
      return b.productivityScore - a.productivityScore;
    }
    return b.streakDays - a.streakDays;
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
