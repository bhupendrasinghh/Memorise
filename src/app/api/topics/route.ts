import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getUserTopics, createTopic } from '@/lib/db';
import { generateRevisionSchedule } from '@/lib/spaced-repetition';
import { Topic } from '@/lib/types';
import { format } from 'date-fns';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const topics = getUserTopics(session.userId);
  return NextResponse.json({ topics });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, subject, content, tags, initialStudyDate, difficulty } = body;

    if (!title || !subject) {
      return NextResponse.json({ error: 'Title and Subject are required' }, { status: 400 });
    }

    const topicId = `top-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const studyDate = initialStudyDate || format(new Date(), 'yyyy-MM-dd');
    const nowIso = new Date().toISOString();

    // Automatically generate Day 1, 3, 7, 15, 30, 60 revision schedule
    const revisions = generateRevisionSchedule(topicId, studyDate);

    const newTopic: Topic = {
      id: topicId,
      userId: session.userId,
      title: title.trim(),
      subject: subject.trim(),
      content: content ? content.trim() : '',
      tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      initialStudyDate: studyDate,
      createdAt: nowIso,
      updatedAt: nowIso,
      difficulty: difficulty || 'medium',
      revisions,
    };

    createTopic(newTopic);

    return NextResponse.json({ topic: newTopic }, { status: 201 });
  } catch (err) {
    console.error('Error creating topic:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
