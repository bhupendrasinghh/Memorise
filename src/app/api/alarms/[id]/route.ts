import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { updateAlarm, deleteAlarm } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const updated = updateAlarm(id, session.userId, body, session.email);

    if (!updated) {
      return NextResponse.json({ error: 'Alarm not found' }, { status: 404 });
    }

    return NextResponse.json({ alarm: updated });
  } catch (err) {
    console.error('Error updating alarm:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const deleted = deleteAlarm(id, session.userId, session.email);

  if (!deleted) {
    return NextResponse.json({ error: 'Alarm not found' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Alarm deleted successfully' });
}
