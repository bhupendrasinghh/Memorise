import { User, Topic, Task, StudySession } from './types';
import { format, isToday } from 'date-fns';

export interface WhatsAppReportData {
  text: string;
  whatsappUrl: string;
  stats: {
    remainingTasksCount: number;
    completedTasksCount: number;
    dueRevisionsCount: number;
    focusMinutes: number;
    performancePercent: number;
  };
}

/**
 * Format a comprehensive, clean, and motivating WhatsApp Daily Report
 */
export function generateDailyWhatsAppReport(
  user: User,
  topics: Topic[],
  tasks: Task[],
  sessions: StudySession[]
): WhatsAppReportData {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const formattedDate = format(new Date(), 'EEEE, dd MMM yyyy');
  const reportTime = user.whatsappTime || '17:00';

  // 1. Calculate tasks stats
  const dailyTasks = tasks.filter((t) => t.type === 'daily');
  const pendingTasks = dailyTasks.filter((t) => t.status !== 'completed');
  const completedTasks = dailyTasks.filter((t) => t.status === 'completed');

  // 2. Calculate due revisions for today
  const dueRevisions: { topicTitle: string; intervalDays: number; subject: string }[] = [];
  topics.forEach((t) => {
    t.revisions.forEach((r) => {
      if (r.scheduledDate === todayStr && r.status !== 'completed') {
        dueRevisions.push({
          topicTitle: t.title,
          intervalDays: r.intervalDays,
          subject: t.subject,
        });
      }
    });
  });

  // 3. Focus minutes today
  const todaySessions = sessions.filter((s) => s.completedAt.startsWith(todayStr));
  const focusMinutes = Math.round(
    todaySessions.reduce((acc, s) => acc + s.durationSeconds, 0) / 60
  );

  // 4. Performance %
  const totalItems = dailyTasks.length + dueRevisions.length + (dueRevisions.length === 0 ? 0 : 0);
  let performancePercent = 0;
  if (dailyTasks.length > 0) {
    performancePercent = Math.round((completedTasks.length / dailyTasks.length) * 100);
  } else if (pendingTasks.length === 0 && dueRevisions.length === 0) {
    performancePercent = 100;
  }

  // 5. Build WhatsApp Message Text
  let message = `📚 *MEMORISE — DAILY STUDY & PROGRESS REPORT*\n`;
  message += `📅 *Date*: ${formattedDate} | *Time*: ${reportTime}\n`;
  message += `👤 *Student*: ${user.name}\n`;
  message += `🔥 *Current Streak*: ${user.streakDays || 1} Days Active\n\n`;

  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `⚡ *PERFORMANCE & DAILY METRICS*\n`;
  message += `• Overall Performance: *${performancePercent}%*\n`;
  message += `• Daily Tasks Done: *${completedTasks.length} / ${dailyTasks.length}* (${dailyTasks.length > 0 ? Math.round((completedTasks.length / dailyTasks.length) * 100) : 100}%)\n`;
  message += `• Revisions Due Today: *${dueRevisions.length}*\n`;
  message += `• Deep Focus Time: *${focusMinutes} mins* (Target: ${user.dailyStudyTargetMinutes || 120}m)\n\n`;

  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📋 *REMAINING TASKS FOR TODAY* (${pendingTasks.length}):\n`;
  if (pendingTasks.length === 0) {
    message += `✅ *Awesome! All daily tasks are finished!*\n`;
  } else {
    pendingTasks.forEach((t, i) => {
      const prioEmoji = t.priority === 'urgent' ? '🔴' : t.priority === 'high' ? '🟠' : '🔵';
      message += `${i + 1}. ${prioEmoji} *${t.title}* [${t.category}]\n`;
      if (t.description) {
        message += `   _${t.description}_\n`;
      }
    });
  }
  message += `\n`;

  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🧠 *PENDING SPACED REVISIONS* (${dueRevisions.length}):\n`;
  if (dueRevisions.length === 0) {
    message += `✅ *All caught up! No pending revisions due today.*\n`;
  } else {
    dueRevisions.forEach((r, i) => {
      message += `${i + 1}. 📖 *${r.topicTitle}* (Day ${r.intervalDays} review • ${r.subject})\n`;
    });
  }
  message += `\n`;

  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `💡 _"Success is the sum of small efforts repeated day in and day out."_\n`;
  message += `Keep the momentum going! Finish strong before midnight! 🚀\n`;
  message += `🌐 https://memorise-0t01.onrender.com`;

  const cleanPhone = cleanWhatsAppPhone(user.whatsappNumber || '');
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  return {
    text: message,
    whatsappUrl,
    stats: {
      remainingTasksCount: pendingTasks.length,
      completedTasksCount: completedTasks.length,
      dueRevisionsCount: dueRevisions.length,
      focusMinutes,
      performancePercent,
    },
  };
}

/**
 * Clean and format phone number for WhatsApp wa.me links
 * e.g. "+91 95289 12345" -> "919528912345"
 */
export function cleanWhatsAppPhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '');
}

/**
 * Send automated WhatsApp message via Twilio or Meta Cloud API if configured
 */
export async function sendAutomatedWhatsApp(
  phone: string,
  message: string
): Promise<{ success: boolean; method: string; error?: string }> {
  const cleanPhone = cleanWhatsAppPhone(phone);
  if (!cleanPhone) {
    return { success: false, method: 'none', error: 'Invalid phone number' };
  }

  // 1. Check Twilio WhatsApp Config
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioNumber = process.env.TWILIO_WHATSAPP_NUMBER; // e.g. "+14155238886"

  if (twilioSid && twilioAuth && twilioNumber) {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const fromNumber = twilioNumber.startsWith('whatsapp:') ? twilioNumber : `whatsapp:${twilioNumber}`;
      const toNumber = `whatsapp:+${cleanPhone}`;

      const params = new URLSearchParams();
      params.append('From', fromNumber);
      params.append('To', toNumber);
      params.append('Body', message);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (res.ok) {
        return { success: true, method: 'twilio' };
      } else {
        const errJson = await res.json();
        return { success: false, method: 'twilio', error: errJson.message || 'Twilio delivery failed' };
      }
    } catch (err: any) {
      return { success: false, method: 'twilio', error: err.message };
    }
  }

  // 2. Check Meta WhatsApp Cloud API Config
  const metaToken = process.env.META_WHATSAPP_TOKEN;
  const metaPhoneId = process.env.META_PHONE_NUMBER_ID;

  if (metaToken && metaPhoneId) {
    try {
      const res = await fetch(`https://graph.facebook.com/v19.0/${metaPhoneId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${metaToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'text',
          text: { body: message },
        }),
      });

      if (res.ok) {
        return { success: true, method: 'meta' };
      } else {
        const errJson = await res.json();
        return { success: false, method: 'meta', error: errJson.error?.message || 'Meta API failed' };
      }
    } catch (err: any) {
      return { success: false, method: 'meta', error: err.message };
    }
  }

  // Not configured with third-party keys; client will use 1-click direct link
  return { success: true, method: 'direct_link' };
}
