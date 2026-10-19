import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getUserTasks, createTask } from '@/lib/db';
import { Task, TaskType, Priority, TaskCategory } from '@/lib/types';
import { format } from 'date-fns';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const typeFilter = searchParams.get('type') as TaskType | null;
  const statusFilter = searchParams.get('status');
  const categoryFilter = searchParams.get('category');
  const priorityFilter = searchParams.get('priority');

  let tasks = getUserTasks(session.userId, session.email);

  if (typeFilter) {
    tasks = tasks.filter((t) => t.type === typeFilter);
  }
  if (statusFilter) {
    tasks = tasks.filter((t) => t.status === statusFilter);
  }
  if (categoryFilter && categoryFilter !== 'all') {
    tasks = tasks.filter((t) => t.category.toLowerCase() === categoryFilter.toLowerCase());
  }
  if (priorityFilter && priorityFilter !== 'all') {
    tasks = tasks.filter((t) => t.priority.toLowerCase() === priorityFilter.toLowerCase());
  }

  // Sort: pending first, urgent first, then deadline
  const priorityOrder: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
  tasks.sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    const prioDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    if (prioDiff !== 0) return prioDiff;
    return a.deadline.localeCompare(b.deadline);
  });

  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description = '', type = 'daily', priority = 'medium', category = 'Study', deadline, subtasks = [], clientDate } = body;

    if (!title) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
    }

    const todayStr = clientDate && /^\d{4}-\d{2}-\d{2}$/.test(clientDate) ? clientDate : format(new Date(), 'yyyy-MM-dd');
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newTask: Task = {
      id: taskId,
      userId: session.userId,
      userEmail: session.email ? session.email.toLowerCase() : undefined,
      title: title.trim(),
      description: description.trim(),
      type: (['daily', 'weekly', 'monthly'].includes(type) ? type : 'daily') as TaskType,
      priority: (['low', 'medium', 'high', 'urgent'].includes(priority) ? priority : 'medium') as Priority,
      category: (['Study', 'Revision', 'Project', 'Personal', 'Work'].includes(category) ? category : 'Study') as TaskCategory,
      deadline: deadline || todayStr,
      status: 'pending',
      subtasks: Array.isArray(subtasks)
        ? subtasks.map((s, idx) => ({
            id: s.id || `sub-${Date.now()}-${idx}`,
            title: typeof s === 'string' ? s : s.title,
            completed: !!s.completed,
          }))
        : [],
      createdAt: todayStr,
      completedAt: null,
    };

    createTask(newTask);

    return NextResponse.json({ task: newTask }, { status: 201 });
  } catch (err) {
    console.error('Error creating task:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
