import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { updateTopic, deleteTopic, getUserTopics } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const topics = getUserTopics(session.userId);
  const topic = topics.find((t) => t.id === id);

  if (!topic) {
    return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
  }

  return NextResponse.json({ topic });
}

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
    const updated = updateTopic(id, session.userId, body);

    if (!updated) {
      return NextResponse.json({ error: 'Topic not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ topic: updated });
  } catch (err) {
    console.error('Error updating topic:', err);
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
  const deleted = deleteTopic(id, session.userId);

  if (!deleted) {
    return NextResponse.json({ error: 'Topic not found or unauthorized' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Topic deleted successfully' });
}
