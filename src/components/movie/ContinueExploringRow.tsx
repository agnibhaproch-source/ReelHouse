'use client';

import { fromSnapshot } from '@/lib/snapshot';
import { useHistory, useRemoveHistory } from '@/hooks/useHistory';
import { Row } from './Row';

/** "Continue exploring" (spec 56): last 12 viewed, trailer-progress line, removable; hidden when empty. */
export function ContinueExploringRow() {
  const { data } = useHistory();
  const remove = useRemoveHistory();
  const items = (data ?? []).slice(0, 12);
  if (!items.length) return null;
  const progress = Object.fromEntries(items.filter((h) => h.kind === 'trailer').map((h) => [h.movie_id, h.progress]));
  return (
    <Row
      rowKey="continue"
      title="Continue exploring"
      items={items.map(fromSnapshot)}
      progress={progress}
      onRemove={(id) => remove.mutate(id)}
    />
  );
}
