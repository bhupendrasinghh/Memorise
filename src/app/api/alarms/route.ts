import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getUserAlarms, createAlarm } from '@/lib/db';
import { StudyAlarm } from '@/lib/types';
import { format } from 'date-fns';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const alarms = getUserAlarms(session.userId, session.email);
  return NextResponse.json({ alarms });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, time, days = [], sound = 'chime', enabled = true } = body;

    if (!title || !time) {
      return NextResponse.json({ error: 'Alarm title and time are required' }, { status: 400 });
    }

    const alarmId = `alm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newAlarm: StudyAlarm = {
      id: alarmId,
      userId: session.userId,
      userEmail: session.email ? session.email.toLowerCase() : undefined,
      title: title.trim(),
      time, // HH:mm
      days: Array.isArray(days) ? days : [],
      enabled: !!enabled,
      sound: (['bell', 'chime', 'digital', 'gong'].includes(sound) ? sound : 'chime') as 'bell' | 'chime' | 'digital' | 'gong',
      createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    };

    createAlarm(newAlarm);
    return NextResponse.json({ alarm: newAlarm }, { status: 201 });
  } catch (err) {
    console.error('Error creating alarm:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
