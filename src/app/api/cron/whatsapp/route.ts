import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, getUserTopics, getUserTasks, getUserSessions } from '@/lib/db';
import { generateDailyWhatsAppReport, sendAutomatedWhatsApp } from '@/lib/whatsapp';

export async function GET(req: NextRequest) {
  try {
    const db = readDatabase();
    const users = db.users || [];

    const activeUsers = users.filter((u) => u.whatsappEnabled && u.whatsappNumber);
    const results = [];

    for (const user of activeUsers) {
      const topics = getUserTopics(user.id);
      const tasks = getUserTasks(user.id);
      const sessions = getUserSessions(user.id);

      const reportData = generateDailyWhatsAppReport(user, topics, tasks, sessions);
      const delivery = await sendAutomatedWhatsApp(user.whatsappNumber!, reportData.text);

      results.push({
        userId: user.id,
        email: user.email,
        phone: user.whatsappNumber,
        delivery,
      });
    }

    return NextResponse.json({
      status: 'ok',
      totalActiveReminders: activeUsers.length,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (err) {
    console.error('WhatsApp cron error:', err);
    return NextResponse.json({ error: 'Failed to process WhatsApp cron' }, { status: 500 });
  }
}
