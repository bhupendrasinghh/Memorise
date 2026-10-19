import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getUserSessions, createSession } from '@/lib/db';
import { StudySession } from '@/lib/types';
import { format } from 'date-fns';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessions = getUserSessions(session.userId, session.email);
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
    const { subject, topicTitle, durationSeconds, type = 'pomodoro', notes = '', completedAt: clientCompletedAt, clientDate } = body;

    if (!durationSeconds || durationSeconds <= 0) {
      return NextResponse.json({ error: 'Valid duration is required' }, { status: 400 });
    }

    const completedAtStr = clientCompletedAt || (clientDate ? `${clientDate} ${format(new Date(), 'HH:mm:ss')}` : format(new Date(), 'yyyy-MM-dd HH:mm:ss'));
    const sessionId = `ses-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newSession: StudySession = {
      id: sessionId,
      userId: session.userId,
      userEmail: session.email ? session.email.toLowerCase() : undefined,
      subject: subject || 'General Study',
      topicTitle: topicTitle || '',
      durationSeconds: Math.round(durationSeconds),
      type: (['pomodoro', 'stopwatch', 'countdown'].includes(type) ? type : 'pomodoro') as 'pomodoro' | 'stopwatch' | 'countdown',
      completedAt: completedAtStr,
      notes,
    };

    createSession(newSession);
    return NextResponse.json({ session: newSession }, { status: 201 });
  } catch (err) {
    console.error('Error recording study session:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
