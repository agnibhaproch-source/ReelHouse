'use client';

import { useEffect, useId, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { AVATARS, type AvatarKey, type Profile, type ProfileInput } from '@/lib/data/types';
import { CONTENT_LANGUAGES } from '@/lib/tmdb/languages';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  profile?: Profile | null;
  onClose: () => void;
  onSave: (input: ProfileInput) => Promise<void>;
  onDelete?: () => Promise<void>;
}

/** Create / edit a profile: name, original-character avatar, language, kids mode. */
export function ProfileEditor({ open, profile, onClose, onSave, onDelete }: Props) {
  const id = useId();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<AvatarKey>('reel');
  const [kids, setKids] = useState(false);
  const [language, setLanguage] = useState('en-US');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect -- reset the form each time it opens */
    setName(profile?.name ?? '');
    setAvatar(profile?.avatar ?? 'reel');
    setKids(profile?.is_kids ?? false);
    setLanguage(profile?.language ?? 'en-US');
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, profile]);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return setError('Give this profile a name.');
    if (trimmed.length > 24) return setError('Keep the name under 24 characters.');
    setBusy(true);
    try {
      await onSave({ name: trimmed, avatar, is_kids: kids, language });
      onClose();
    } catch (e) {
      setError((e as Error).message || 'Couldn’t save the profile. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={profile ? `Edit ${profile.name}` : 'Add a profile'}>
      <form
        className="mt-4 flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <Input label="Name" value={name} onChange={(e) => setName(e.currentTarget.value)} error={error ?? undefined} maxLength={24} data-autofocus />
        <fieldset>
          <legend className="mb-3 text-small font-semibold">Avatar</legend>
          <div role="radiogroup" aria-label="Avatar" className="flex flex-wrap gap-3">
            {AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                role="radio"
                aria-checked={avatar === a}
                aria-label={a}
                onClick={() => setAvatar(a)}
                className={cn('rounded-[22%] p-1 ring-2 transition-[box-shadow,scale] duration-base ease-snap hover:scale-105', avatar === a ? 'ring-violet' : 'ring-transparent')}
              >
                <Avatar avatar={a} name={a} size={56} decorative />
              </button>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor={`${id}-lang`} className="mb-2 block text-small font-semibold">
            Content language
          </label>
          <select id={`${id}-lang`} value={language} onChange={(e) => setLanguage(e.currentTarget.value)} className="min-h-11 w-full rounded-[10px] border border-line bg-seat px-3">
            {CONTENT_LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <Switch label="Kids profile" description="Only family-friendly titles (U/A and below), no horror or thrillers." checked={kids} onChange={setKids} />
        <div className="flex flex-wrap gap-3">
          <Button type="submit" loading={busy} disabled={busy}>
            {profile ? 'Save profile' : 'Add profile'}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          {onDelete && profile && (
            <Button
              variant="ghost"
              className="ml-auto text-danger hover:bg-danger/10"
              onClick={() => {
                setBusy(true);
                void onDelete().then(onClose).finally(() => setBusy(false));
              }}
            >
              Delete profile
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
