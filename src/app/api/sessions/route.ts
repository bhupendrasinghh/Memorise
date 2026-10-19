import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getUserSessions, createSession } from '@/lib/db';
import { StudySession } from '@/lib/types';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessions = getUserSessions(session.userId);
  return NextResponse.json({
    sessions: sessions.sort((a, b) => b.completedAt.localeCompare(a.completedAt)),
  });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { subject, topicTitle, durationSeconds, type = 'pomodoro', notes = '' } = body;

    if (!durationSeconds || durationSeconds <= 0) {
      return NextResponse.json({ error: 'Valid duration is required' }, { status: 400 });
    }

    const sessionId = `ses-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newSession: StudySession = {
      id: sessionId,
      userId: session.userId,
      subject: subject || 'General Study',
      topicTitle: topicTitle || '',
      durationSeconds: Math.round(durationSeconds),
      type: (['pomodoro', 'stopwatch', 'countdown'].includes(type) ? type : 'pomodoro') as 'pomodoro' | 'stopwatch' | 'countdown',
      completedAt: new Date().toISOString(),
      notes,
    };

    createSession(newSession);
    return NextResponse.json({ session: newSession }, { status: 201 });
  } catch (err) {
    console.error('Error recording study session:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
