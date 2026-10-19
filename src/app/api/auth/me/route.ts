import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { findUserById, findUserByEmail, createUser, getDeterministicUserId } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let user = findUserById(session.userId);
  if (!user && session.email) {
    user = findUserByEmail(session.email);
  }

  if (!user && session.email) {
    const todayStr = new Date().toISOString().slice(0, 10);
    user = createUser({
      id: session.userId || getDeterministicUserId(session.email),
      name: session.name || 'Learner',
      email: session.email.toLowerCase(),
      passwordHash: '',
      dailyStudyTargetMinutes: 120,
      streakDays: 1,
      lastActiveDate: todayStr,
      createdAt: todayStr,
    });
  }

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      streakDays: user.streakDays,
      dailyStudyTargetMinutes: user.dailyStudyTargetMinutes,
      lastActiveDate: user.lastActiveDate,
      createdAt: user.createdAt,
      whatsappNumber: user.whatsappNumber,
      whatsappTime: user.whatsappTime,
      whatsappEnabled: user.whatsappEnabled,
    },
  });
}
