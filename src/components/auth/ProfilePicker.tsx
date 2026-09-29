'use client';

import * as m from 'motion/react-m';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { qk } from '@/lib/tmdb/query-keys';
import { MAX_PROFILES, type Profile } from '@/lib/data/types';
import { EASES, DUR, SPRING } from '@/lib/tokens';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { toast } from '@/stores/toast';
import { ProfileEditor } from './ProfileEditor';

/**
 * "Who's watching?" (spec 51): avatars float (L3); hover scales + glows while others dim;
 * selecting zooms the avatar toward the camera and fades into home (L1). Manage mode wiggles.
 */
export function ProfilePicker() {
  const { repo, user, selectProfile, profile: current, ready } = useSession();
  const router = useRouter();
  const qc = useQueryClient();
  const { reduced } = useMotionPrefs();
  const [manage, setManage] = useState(false);
  const [editing, setEditing] = useState<Profile | null | 'new'>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const key = [...qk.profiles(user?.id ?? 'guest'), repo.kind];
  const { data: profiles = [], isPending } = useQuery({
    queryKey: key,
    queryFn: () => repo.profiles.list(),
    enabled: ready,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: key });

  const choose = (p: Profile) => {
    if (manage) return setEditing(p);
    setChosen(p.id);
    setTimeout(
      () => {
        selectProfile(p);
        router.push('/');
      },
      reduced ? 150 : 900,
    );
  };

  return (
    <div className="px-gutter relative flex min-h-svh flex-col items-center justify-center overflow-hidden py-20">
      <m.div
        animate={chosen ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: DUR.slow, delay: 0.3 }}
        className="flex flex-col items-center"
      >
        <h1 className="font-display text-h1 mb-12 text-center">
          {manage ? 'Manage profiles' : 'Who’s watching?'}
        </h1>
      </m.div>
      <ul className="flex flex-wrap justify-center gap-8 md:gap-12">
        {isPending &&
          Array.from({ length: 2 }, (_, i) => (
            <li key={i} className="skeleton size-32 rounded-[22%] md:size-40" />
          ))}
        {profiles.map((p, i) => {
          const isChosen = chosen === p.id;
          const dim = (hovered && hovered !== p.id) || (chosen && !isChosen);
          return (
            <m.li
              key={p.id}
              className="flex flex-col items-center gap-4"
              style={
                reduced || manage
                  ? undefined
                  : { animation: `float-y ${5 + (i % 3)}s ease-in-out ${i * 0.4}s infinite` }
              }
              animate={
                isChosen && !reduced
                  ? { scale: 4, opacity: 0, z: 400 }
                  : { scale: 1, opacity: dim ? 0.4 : 1 }
              }
              transition={
                isChosen
                  ? { duration: DUR.cinematic, ease: EASES.projector }
                  : { duration: DUR.base }
              }
            >
              <button
                type="button"
                onClick={() => choose(p)}
                onPointerEnter={() => setHovered(p.id)}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setHovered(p.id)}
                onBlur={() => setHovered(null)}
                aria-label={
                  manage ? `Edit ${p.name}` : `Watch as ${p.name}${p.is_kids ? ' (kids)' : ''}`
                }
                aria-current={current?.id === p.id || undefined}
                data-cursor="link"
                className={cn(
                  'group/avatar duration-base ease-reel relative rounded-[22%] transition-[scale,box-shadow] hover:scale-110 focus-visible:scale-110',
                  manage && 'animate-[wiggle_0.3s_ease-in-out_infinite]',
                )}
                style={{ animationDelay: manage ? `${i * 0.05}s` : undefined }}
              >
                <span
                  aria-hidden="true"
                  className="bg-violet duration-base absolute -inset-3 -z-10 rounded-[26%] opacity-0 blur-2xl transition-opacity group-hover/avatar:opacity-50 group-focus-visible/avatar:opacity-50"
                />
                <Avatar
                  avatar={p.avatar}
                  name={p.name}
                  size={128}
                  blink
                  decorative
                  className="md:size-40"
                />
                {manage && (
                  <m.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={SPRING}
                    className="bg-void/60 absolute inset-0 grid place-items-center rounded-[22%]"
                  >
                    <Pencil className="size-8" aria-hidden="true" />
                  </m.span>
                )}
              </button>
              <span
                className={cn(
                  'text-body duration-base transition-[font-weight,color]',
                  hovered === p.id ? 'text-reel font-extrabold' : 'text-dim font-medium',
                )}
              >
                {p.name}
                {p.is_kids && (
                  <span className="rounded-pill bg-amber text-void ml-2 px-2 py-0.5 text-[0.7rem] font-bold">
                    Kids
                  </span>
                )}
              </span>
            </m.li>
          );
        })}
        {!isPending && profiles.length < MAX_PROFILES && !chosen && (
          <li className="flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={() => setEditing('new')}
              aria-label="Add a profile"
              className="border-line text-dim duration-base hover:border-violet hover:text-reel grid size-32 place-items-center rounded-[22%] border-2 border-dashed transition-colors md:size-40"
            >
              <Plus
                className="duration-base ease-snap size-10 transition-transform group-hover:rotate-90"
                aria-hidden="true"
              />
            </button>
            <span className="text-dim">Add profile</span>
          </li>
        )}
      </ul>
      {!chosen && profiles.length > 0 && (
        <div className="mt-14 flex gap-3">
          <Button variant="secondary" onClick={() => setManage((m) => !m)} magnetic={false}>
            {manage ? 'Done' : 'Manage profiles'}
          </Button>
          {!manage && (
            <Button
              variant="ghost"
              onClick={() => {
                selectProfile(null);
                router.push('/');
              }}
            >
              Continue as guest
            </Button>
          )}
        </div>
      )}
      <ProfileEditor
        open={editing !== null}
        profile={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
        onSave={async (input) => {
          if (editing === 'new' || editing === null) {
            await repo.profiles.create(input);
            toast.success(`Profile “${input.name}” added`);
          } else {
            const updated = await repo.profiles.update(editing.id, input);
            if (current?.id === updated.id) selectProfile(updated);
          }
          await refresh();
        }}
        onDelete={
          editing && editing !== 'new'
            ? async () => {
                await repo.profiles.remove(editing.id);
                if (current?.id === editing.id) selectProfile(null);
                await refresh();
              }
            : undefined
        }
      />
    </div>
  );
}
