'use client';

import { useEffect, useId, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { MAX_REVIEW_LENGTH, type SiteReview } from '@/lib/data/types';
import { containsProfanity } from '@/lib/profanity';
import { useReviewMutations } from '@/hooks/useReviews';
import { play } from '@/lib/sound';
import { cn } from '@/lib/utils';

export const ReviewSchema = z.object({
  body: z
    .string()
    .trim()
    .min(10, 'Write at least 10 characters.')
    .max(MAX_REVIEW_LENGTH, `Keep it under ${MAX_REVIEW_LENGTH} characters.`),
  spoiler: z.boolean(),
});
type ReviewForm = z.infer<typeof ReviewSchema>;

/** Review sheet (spec 55): plain text ≤ 2000, spoiler toggle, profanity masked, submit morph (spec 34). */
export function ReviewSheet({ movieId, title, open, editing, onClose }: { movieId: number; title: string; open: boolean; editing?: SiteReview; onClose: () => void }) {
  const { save } = useReviewMutations(movieId);
  const id = useId();
  const [shake, setShake] = useState(false);
  const { register, handleSubmit, reset, control, setValue, formState } = useForm<ReviewForm>({
    resolver: zodResolver(ReviewSchema),
    defaultValues: { body: editing?.body ?? '', spoiler: editing?.spoiler ?? false },
  });

  useEffect(() => {
    if (open) reset({ body: editing?.body ?? '', spoiler: editing?.spoiler ?? false });
  }, [open, editing, reset]);

  const body = useWatch({ control, name: 'body' }) ?? '';
  const spoiler = useWatch({ control, name: 'spoiler' }) ?? false;
  const onError = () => {
    void play('error');
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? `Edit your review of ${title}` : `Review ${title}`} variant="sheet" className="md:inset-x-auto md:left-1/2 md:w-[640px] md:-translate-x-1/2">
      <form
        noValidate
        onSubmit={handleSubmit(
          (v) =>
            save.mutate(
              { id: editing?.id, movie_id: movieId, body: v.body, spoiler: v.spoiler },
              { onSuccess: onClose, onError },
            ),
          onError,
        )}
        className="mt-4 flex flex-col gap-4"
      >
        <label htmlFor={`${id}-body`} className="sr-only">
          Your review
        </label>
        <textarea
          id={`${id}-body`}
          {...register('body')}
          rows={7}
          maxLength={MAX_REVIEW_LENGTH}
          aria-invalid={formState.errors.body ? true : undefined}
          aria-describedby={`${id}-count ${formState.errors.body ? `${id}-err` : ''}`}
          placeholder="What stayed with you after the lights came up?"
          data-autofocus
          className={cn('w-full resize-y rounded-[10px] border border-line bg-seat p-4 text-reel outline-none placeholder:text-dim focus-visible:border-violet', shake && 'shake', spoiler && 'blur-[1px]')}
        />
        <div className="flex items-center justify-between text-small">
          {formState.errors.body ? (
            <p id={`${id}-err`} role="alert" className="text-danger">
              {formState.errors.body.message}
            </p>
          ) : containsProfanity(body) ? (
            <p className="text-amber">Strong language will be masked.</p>
          ) : (
            <span />
          )}
          <span id={`${id}-count`} className="text-dim tabular-nums">
            {body.length}/{MAX_REVIEW_LENGTH}
          </span>
        </div>
        <Switch label="Contains spoilers" description="Readers will see a blurred review until they choose to reveal it." checked={spoiler} onChange={(v) => setValue('spoiler', v)} />
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending} disabled={save.isPending}>
            {editing ? 'Save review' : 'Post review'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
