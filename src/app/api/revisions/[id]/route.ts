import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getUserTopics, updateTopic } from '@/lib/db';
import { processRevisionCompletion } from '@/lib/spaced-repetition';
import { format } from 'date-fns';

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
  const { rating = 'good', notes = '', status = 'completed', newScheduledDate, completedAt: clientCompletedAt, clientDate } = body;

  const topics = getUserTopics(session.userId, session.email);
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
    const completionDate = clientCompletedAt || (clientDate ? `${clientDate} ${format(new Date(), 'HH:mm:ss')}` : format(new Date(), 'yyyy-MM-dd HH:mm:ss'));
    updatedRevisions = processRevisionCompletion(
      updatedRevisions,
      targetRevision.step,
      rating,
      notes,
      completionDate
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
  }, session.email);

  return NextResponse.json({
    message: 'Revision updated successfully',
    topic: updatedTopic,
    revision: updatedRevisions.find((r) => r.id === revisionId),
  });
}
