'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { localToday, useReminders } from '@/stores/reminders';
import { toast } from '@/stores/toast';

/** On load and whenever the tab returns: announce reminded films that are out today (or since). */
export function ReminderWatcher() {
  const router = useRouter();
  useEffect(() => {
    const check = () => {
      const { items, markNotified } = useReminders.getState();
      const due = items.filter((r) => !r.notified && r.date <= localToday());
      if (!due.length) return;
      markNotified(due.map((r) => r.id));
      for (const r of due.slice(0, 3)) {
        toast.info(`${r.title} is out now.`, {
          duration: 8000,
          icon: 'reel',
          action: { label: 'Open', onAction: () => router.push(`/movie/${r.id}`) },
        });
        if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
          new Notification(`${r.title} is out now`, {
            body: 'Tap to see where to watch.',
            tag: `release-${r.id}`,
          });
        }
      }
    };
    check();
    const onVis = () => document.visibilityState === 'visible' && check();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [router]);
  return null;
}
