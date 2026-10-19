import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, writeDatabase, DatabaseSchema } from '@/lib/db';
import { isSupabaseConfigured, fetchRemoteState, persistRemoteState } from '@/lib/supabase';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    const db = readDatabase();

    return NextResponse.json({
      status: 'ok',
      isSupabaseConfigured,
      syncEngine: isSupabaseConfigured ? 'supabase_cloud' : 'local_json_ephemeral',
      counts: {
        users: db.users.length,
        topics: session ? db.topics.filter((t) => t.userId === session.userId).length : db.topics.length,
        tasks: session ? db.tasks.filter((t) => t.userId === session.userId).length : db.tasks.length,
        alarms: session ? db.alarms.filter((a) => a.userId === session.userId).length : db.alarms.length,
      },
      user: session ? { id: session.userId, email: session.email, name: session.name } : null,
      serverTime: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Sync GET error:', err);
    return NextResponse.json({ error: 'Failed to inspect sync status' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    const body = await req.json();
    const action = body.action || 'sync';

    // 1. Export Data Backup
    if (action === 'export') {
      const db = readDatabase();
      return NextResponse.json({
        exportDate: new Date().toISOString(),
        version: '1.0',
        data: db,
      });
    }

    // 2. Import / Restore Data from Backup
    if (action === 'import') {
      const incomingData = body.data as DatabaseSchema;
      if (!incomingData || !Array.isArray(incomingData.users)) {
        return NextResponse.json({ error: 'Invalid backup format' }, { status: 400 });
      }

      writeDatabase(incomingData);
      if (isSupabaseConfigured) {
        await persistRemoteState(incomingData);
      }

      return NextResponse.json({
        message: 'Database restored successfully',
        counts: {
          users: incomingData.users.length,
          topics: incomingData.topics?.length || 0,
          tasks: incomingData.tasks?.length || 0,
        },
      });
    }

    // 3. Force Cloud Pull
    if (action === 'pull' && isSupabaseConfigured) {
      const remote = await fetchRemoteState();
      if (remote) {
        writeDatabase(remote);
        return NextResponse.json({ message: 'Synchronized from Supabase Cloud', data: remote });
      }
      return NextResponse.json({ message: 'No remote state found in Supabase yet' }, { status: 404 });
    }

    // 4. Force Cloud Push
    if (action === 'push' && isSupabaseConfigured) {
      const local = readDatabase();
      const success = await persistRemoteState(local);
      return NextResponse.json({
        message: success ? 'Pushed to Supabase Cloud' : 'Failed to push to Supabase Cloud',
        success,
      });
    }

    return NextResponse.json({ error: 'Unknown sync action' }, { status: 400 });
  } catch (err) {
    console.error('Sync POST error:', err);
    return NextResponse.json({ error: 'Sync operation failed' }, { status: 500 });
  }
}
