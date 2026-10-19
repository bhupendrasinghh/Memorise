import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getUserTopics } from '@/lib/db';
import { getCalculatedRevisionStatus } from '@/lib/spaced-repetition';
import { RevisionScheduleItem, Topic } from '@/lib/types';
import { parseISO, startOfDay, isToday, isBefore } from 'date-fns';

export interface EnrichedRevisionItem extends RevisionScheduleItem {
  topicTitle: string;
  subject: string;
  tags: string[];
  topicContent: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  computedStatus: 'due' | 'overdue' | 'upcoming' | 'completed' | 'skipped';
}

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const topics = getUserTopics(session.userId, session.email);
  const clientDate = req.nextUrl.searchParams.get('date');
  let now = new Date();
  if (clientDate && /^\d{4}-\d{2}-\d{2}$/.test(clientDate)) {
    now = parseISO(clientDate);
  }
  const today = startOfDay(now);

  const allRevisions: EnrichedRevisionItem[] = [];

  for (const topic of topics) {
    for (const rev of topic.revisions) {
      const computedStatus = getCalculatedRevisionStatus(rev, now);
      allRevisions.push({
        ...rev,
        topicTitle: topic.title,
        subject: topic.subject,
        tags: topic.tags,
        topicContent: topic.content,
        difficulty: topic.difficulty,
        computedStatus,
      });
    }
  }

  // Filter into categories
  const dueToday = allRevisions.filter((r) => r.computedStatus === 'due');
  const overdue = allRevisions.filter((r) => r.computedStatus === 'overdue');
  const upcoming = allRevisions.filter((r) => r.computedStatus === 'upcoming');
  const completed = allRevisions.filter((r) => r.status === 'completed');

  return NextResponse.json({
    dueToday,
    overdue,
    upcoming: upcoming.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)),
    completed: completed.sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || '')),
    summary: {
      dueCount: dueToday.length,
      overdueCount: overdue.length,
      upcomingCount: upcoming.length,
      completedCount: completed.length,
      totalCount: allRevisions.length,
    },
  });
}
