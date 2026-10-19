import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getUserTopics, updateTopic } from '@/lib/db';
import { processRevisionCompletion } from '@/lib/spaced-repetition';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: revisionId } = await params;
  const body = await req.json();
  const { rating = 'good', notes = '', status = 'completed', newScheduledDate } = body;

  const topics = getUserTopics(session.userId);
  const targetTopic = topics.find((t) => t.revisions.some((r) => r.id === revisionId));

  if (!targetTopic) {
    return NextResponse.json({ error: 'Revision not found' }, { status: 404 });
  }

  const targetRevision = targetTopic.revisions.find((r) => r.id === revisionId);
  if (!targetRevision) {
    return NextResponse.json({ error: 'Revision step not found' }, { status: 404 });
  }

  let updatedRevisions = [...targetTopic.revisions];

  if (status === 'completed') {
    updatedRevisions = processRevisionCompletion(
      updatedRevisions,
      targetRevision.step,
      rating,
      notes
    );
  } else if (newScheduledDate) {
    // Reschedule
    updatedRevisions = updatedRevisions.map((r) =>
      r.id === revisionId ? { ...r, scheduledDate: newScheduledDate, notes: notes || r.notes } : r
    );
  } else if (status === 'skipped') {
    updatedRevisions = updatedRevisions.map((r) =>
      r.id === revisionId ? { ...r, status: 'skipped' as const } : r
    );
  }

  const updatedTopic = updateTopic(targetTopic.id, session.userId, {
    revisions: updatedRevisions,
  });

  return NextResponse.json({
    message: 'Revision updated successfully',
    topic: updatedTopic,
    revision: updatedRevisions.find((r) => r.id === revisionId),
  });
}
