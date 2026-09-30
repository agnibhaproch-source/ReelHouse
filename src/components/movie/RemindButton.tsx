'use client';

import { Bell, BellRing, CalendarPlus } from 'lucide-react';
import type { Movie } from '@/lib/tmdb/types';
import { downloadIcs, releaseIcs } from '@/lib/ics';
import { slugify } from '@/lib/utils';
import { useReminders } from '@/stores/reminders';
import { toast } from '@/stores/toast';
import { Button } from '@/components/ui/Button';

/**
 * "Remind me" for an unreleased film: stored on this device; the first reminder asks for
 * notification permission (a user gesture). Also offers an .ics for any calendar app.
 */
export function RemindButton({
  movie,
  withCalendar = true,
}: {
  movie: Pick<Movie, 'id' | 'title' | 'release_date' | 'poster_path'>;
  withCalendar?: boolean;
}) {
  const on = useReminders((s) => s.items.some((r) => r.id === movie.id));
  const toggle = useReminders((s) => s.toggle);
  const date = movie.release_date;
  if (!date) return null;

  const remind = async () => {
    const added = toggle({
      id: movie.id,
      title: movie.title,
      date,
      poster_path: movie.poster_path,
    });
    if (!added) return toast.info(`Reminder for ${movie.title} removed.`);
    let how = 'We’ll remind you here when it’s out.';
    if ('Notification' in window && Notification.permission === 'default') {
      const p = await Notification.requestPermission().catch(() => 'denied' as const);
      if (p === 'granted') how = 'We’ll send a notification on release day.';
    } else if ('Notification' in window && Notification.permission === 'granted') {
      how = 'We’ll send a notification on release day.';
    }
    toast.success(`Reminder set for ${movie.title}. ${how}`);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="secondary"
        size="sm"
        icon={on ? <BellRing /> : <Bell />}
        magnetic={false}
        aria-pressed={on}
        onClick={() => void remind()}
        className={on ? 'text-amber' : undefined}
      >
        {on ? 'Reminder on' : 'Remind me'}
      </Button>
      {withCalendar && (
        <Button
          variant="ghost"
          size="sm"
          icon={<CalendarPlus />}
          magnetic={false}
          label={`Add ${movie.title} to your calendar`}
          aria-label={`Add ${movie.title} to your calendar (.ics)`}
          onClick={() =>
            downloadIcs(
              `${slugify(movie.title)}-release.ics`,
              releaseIcs({
                id: movie.id,
                title: movie.title,
                date,
                url: `${window.location.origin}/movie/${movie.id}`,
              }),
            )
          }
        >
          Calendar
        </Button>
      )}
    </div>
  );
}
