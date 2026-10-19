import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import {
  getUserTasks,
  getUserTopics,
  getUserSessions,
  getUserAlarms,
  readDatabase,
  writeDatabase,
  findUserById,
  findUserByEmail,
} from '@/lib/db';
import { Task, Topic, StudySession, StudyAlarm } from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({
      error: 'Unauthorized',
      isSupabaseConfigured,
    }, { status: 401 });
  }

  const user = findUserById(session.userId) || (session.email ? findUserByEmail(session.email) : undefined);
  const tasks = getUserTasks(session.userId, session.email);
  const topics = getUserTopics(session.userId, session.email);
  const sessions = getUserSessions(session.userId, session.email);
  const alarms = getUserAlarms(session.userId, session.email);

  return NextResponse.json({
    user,
    tasks,
    topics,
    sessions,
    alarms,
    isSupabaseConfigured,
    syncedAt: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const cleanEmail = session.email ? session.email.toLowerCase() : '';

    // If client requested export
    if (body.action === 'export') {
      const user = findUserById(session.userId) || (session.email ? findUserByEmail(session.email) : undefined);
      const tasks = getUserTasks(session.userId, session.email);
      const topics = getUserTopics(session.userId, session.email);
      const sessions = getUserSessions(session.userId, session.email);
      const alarms = getUserAlarms(session.userId, session.email);

      return NextResponse.json({
        data: {
          user,
          tasks,
          topics,
          sessions,
          alarms,
          exportedAt: new Date().toISOString(),
          version: '1.0.0',
        },
      });
    }

    // Otherwise, payload is import or sync/restore
    const payload = body.data || body;
    const tasks: Task[] = Array.isArray(payload.tasks) ? payload.tasks : [];
    const topics: Topic[] = Array.isArray(payload.topics) ? payload.topics : [];
    const sessions: StudySession[] = Array.isArray(payload.sessions) ? payload.sessions : [];
    const alarms: StudyAlarm[] = Array.isArray(payload.alarms) ? payload.alarms : [];

    const db = readDatabase();
    let restoredTasks = 0;
    let restoredTopics = 0;
    let restoredSessions = 0;
    let restoredAlarms = 0;

    // Merge Tasks
    for (const t of tasks) {
      if (!t || !t.id || !t.title) continue;
      const existingIdx = db.tasks.findIndex((item) => item.id === t.id);
      const normalizedTask: Task = {
        ...t,
        userId: session.userId,
        userEmail: cleanEmail || t.userEmail,
      };

      if (existingIdx === -1) {
        db.tasks.push(normalizedTask);
        restoredTasks++;
      } else {
        db.tasks[existingIdx] = { ...db.tasks[existingIdx], ...normalizedTask };
      }
    }

    // Merge Topics
    for (const top of topics) {
      if (!top || !top.id || !top.title) continue;
      const existingIdx = db.topics.findIndex((item) => item.id === top.id);
      const normalizedTopic: Topic = {
        ...top,
        userId: session.userId,
        userEmail: cleanEmail || top.userEmail,
      };

      if (existingIdx === -1) {
        db.topics.push(normalizedTopic);
        restoredTopics++;
      } else {
        db.topics[existingIdx] = { ...db.topics[existingIdx], ...normalizedTopic };
      }
    }

    // Merge Sessions
    for (const s of sessions) {
      if (!s || !s.id) continue;
      const existingIdx = db.sessions.findIndex((item) => item.id === s.id);
      const normalizedSession: StudySession = {
        ...s,
        userId: session.userId,
        userEmail: cleanEmail || s.userEmail,
      };

      if (existingIdx === -1) {
        db.sessions.push(normalizedSession);
        restoredSessions++;
      }
    }

    // Merge Alarms
    for (const a of alarms) {
      if (!a || !a.id) continue;
      const existingIdx = db.alarms.findIndex((item) => item.id === a.id);
      const normalizedAlarm: StudyAlarm = {
        ...a,
        userId: session.userId,
        userEmail: cleanEmail || a.userEmail,
      };

      if (existingIdx === -1) {
        db.alarms.push(normalizedAlarm);
        restoredAlarms++;
      }
    }

    writeDatabase(db);

    return NextResponse.json({
      success: true,
      message: 'Cloud data synchronized and restored successfully',
      restored: {
        tasks: restoredTasks,
        topics: restoredTopics,
        sessions: restoredSessions,
        alarms: restoredAlarms,
      },
      currentTotals: {
        tasks: db.tasks.filter((t) => t.userId === session.userId || (cleanEmail && t.userEmail === cleanEmail)).length,
        topics: db.topics.filter((t) => t.userId === session.userId || (cleanEmail && t.userEmail === cleanEmail)).length,
      },
    });
  } catch (err) {
    console.error('Error during data sync:', err);
    return NextResponse.json({ error: 'Internal server error during sync' }, { status: 500 });
  }
}
