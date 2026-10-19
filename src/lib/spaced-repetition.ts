import { RevisionIntervalDays, RevisionScheduleItem, RevisionRating } from './types';
import { addDays, format, isBefore, isToday, parseISO, startOfDay } from 'date-fns';

export const STANDARD_INTERVALS: RevisionIntervalDays[] = [1, 3, 7, 15, 30, 60];

/**
 * Generates the standard 6 spaced repetition schedule steps (Day 1, 3, 7, 15, 30, 60)
 * starting from the initial study date.
 */
export function generateRevisionSchedule(topicId: string, initialDateStr?: string): RevisionScheduleItem[] {
  const baseDate = initialDateStr ? parseISO(initialDateStr) : new Date();

  return STANDARD_INTERVALS.map((days, index) => {
    const scheduledDate = addDays(baseDate, days);
    return {
      id: `${topicId}-rev-${index + 1}`,
      topicId,
      step: index + 1,
      intervalDays: days,
      scheduledDate: format(scheduledDate, 'yyyy-MM-dd'),
      status: 'pending' as const,
      completedAt: null,
      rating: null,
      notes: '',
    };
  });
}

/**
 * Determine dynamic revision status taking current time into account
 */
export function getCalculatedRevisionStatus(
  item: RevisionScheduleItem,
  currentDate?: Date | null
): 'completed' | 'due' | 'overdue' | 'upcoming' | 'skipped' {
  if (item.status === 'completed') return 'completed';
  if (item.status === 'skipped') return 'skipped';
  if (!currentDate) return 'upcoming';

  const scheduled = startOfDay(parseISO(item.scheduledDate));
  const today = startOfDay(currentDate);

  if (isToday(scheduled)) {
    return 'due';
  } else if (isBefore(scheduled, today)) {
    return 'overdue';
  } else {
    return 'upcoming';
  }
}

/**
 * Update revision schedule based on self-evaluation rating (SM-2 Spaced Repetition enhancement)
 */
export function processRevisionCompletion(
  currentSchedule: RevisionScheduleItem[],
  stepToComplete: number,
  rating: RevisionRating = 'good',
  notes?: string,
  completedAt?: string
): RevisionScheduleItem[] {
  const completionDate = completedAt || format(new Date(), 'yyyy-MM-dd HH:mm:ss');

  return currentSchedule.map((item) => {
    if (item.step === stepToComplete) {
      return {
        ...item,
        status: 'completed' as const,
        completedAt: completionDate,
        rating,
        notes: notes || item.notes,
      };
    }

    // If rated 'again', add a quick follow-up revision tomorrow if next step is far away
    if (rating === 'again' && item.step === stepToComplete + 1) {
      const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
      return {
        ...item,
        scheduledDate: tomorrowStr,
      };
    }

    return item;
  });
}
