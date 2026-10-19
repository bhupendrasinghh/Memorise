import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { updateTask, deleteTask, getUserTasks } from '@/lib/db';
import { format } from 'date-fns';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const tasks = getUserTasks(session.userId);
  const existing = tasks.find((t) => t.id === id);

  if (!existing) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { status, subtaskId, toggleSubtask, completedAt: clientCompletedAt, clientDate } = body;

    const defaultCompletedAt = clientCompletedAt || (clientDate ? `${clientDate} ${format(new Date(), 'HH:mm:ss')}` : format(new Date(), 'yyyy-MM-dd HH:mm:ss'));

    let updates: Record<string, unknown> = {};

    if (toggleSubtask && subtaskId) {
      const updatedSubtasks = existing.subtasks.map((st) =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      );
      // If all subtasks completed, auto mark task in_progress or completed
      const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every((s) => s.completed);
      updates = {
        subtasks: updatedSubtasks,
        status: allDone ? 'completed' : existing.status === 'completed' ? 'in_progress' : existing.status,
        completedAt: allDone ? defaultCompletedAt : null,
      };
    } else if (status) {
      updates = {
        status,
        completedAt: status === 'completed' ? (clientCompletedAt || defaultCompletedAt) : null,
      };
    } else {
      updates = body;
    }

    const updated = updateTask(id, session.userId, updates);
    return NextResponse.json({ task: updated });
  } catch (err) {
    console.error('Error patching task:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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
    const updated = updateTask(id, session.userId, body);

    if (!updated) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ task: updated });
  } catch (err) {
    console.error('Error updating task:', err);
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
  const deleted = deleteTask(id, session.userId);

  if (!deleted) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Task deleted successfully' });
}
