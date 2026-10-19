import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { findUserById, updateUser, getUserTopics, getUserTasks, getUserSessions } from '@/lib/db';
import { generateDailyWhatsAppReport, sendAutomatedWhatsApp } from '@/lib/whatsapp';

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = findUserById(session.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const topics = getUserTopics(user.id);
    const tasks = getUserTasks(user.id);
    const sessions = getUserSessions(user.id);

    const reportData = generateDailyWhatsAppReport(user, topics, tasks, sessions);

    return NextResponse.json({
      settings: {
        whatsappNumber: user.whatsappNumber || '',
        whatsappTime: user.whatsappTime || '17:00',
        whatsappEnabled: Boolean(user.whatsappEnabled),
      },
      report: reportData.text,
      whatsappUrl: reportData.whatsappUrl,
      stats: reportData.stats,
    });
  } catch (err) {
    console.error('WhatsApp GET error:', err);
    return NextResponse.json({ error: 'Failed to generate WhatsApp report' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { whatsappNumber, whatsappTime, whatsappEnabled } = body;

    const updated = updateUser(session.userId, {
      whatsappNumber: typeof whatsappNumber === 'string' ? whatsappNumber.trim() : undefined,
      whatsappTime: typeof whatsappTime === 'string' ? whatsappTime.trim() : '17:00',
      whatsappEnabled: Boolean(whatsappEnabled),
    });

    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'WhatsApp settings saved successfully',
      settings: {
        whatsappNumber: updated.whatsappNumber || '',
        whatsappTime: updated.whatsappTime || '17:00',
        whatsappEnabled: Boolean(updated.whatsappEnabled),
      },
    });
  } catch (err) {
    console.error('WhatsApp PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update WhatsApp settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = findUserById(session.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const targetPhone = body.phone || user.whatsappNumber;

    if (!targetPhone) {
      return NextResponse.json({ error: 'Please enter a valid WhatsApp phone number' }, { status: 400 });
    }

    const topics = getUserTopics(user.id);
    const tasks = getUserTasks(user.id);
    const sessions = getUserSessions(user.id);

    const reportData = generateDailyWhatsAppReport(
      { ...user, whatsappNumber: targetPhone },
      topics,
      tasks,
      sessions
    );

    const delivery = await sendAutomatedWhatsApp(targetPhone, reportData.text);

    return NextResponse.json({
      success: true,
      deliveryMethod: delivery.method,
      whatsappUrl: reportData.whatsappUrl,
      message: delivery.method === 'twilio' || delivery.method === 'meta'
        ? 'Report delivered directly to WhatsApp!'
        : 'Report link generated. Click to send directly on WhatsApp.',
    });
  } catch (err) {
    console.error('WhatsApp POST error:', err);
    return NextResponse.json({ error: 'Failed to send WhatsApp report' }, { status: 500 });
  }
}
