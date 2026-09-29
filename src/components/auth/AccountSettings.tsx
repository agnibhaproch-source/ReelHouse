'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useUiStore } from '@/stores/ui';
import { useSession } from '@/hooks/useSession';
import { useMediaQuery, QUERIES } from '@/hooks/useMediaQuery';
import { useClearHistory, useHistory } from '@/hooks/useHistory';
import { CONTENT_LANGUAGES, REGIONS } from '@/lib/tmdb/languages';
import { PasswordSchema, authErrorMessage } from '@/lib/auth-schemas';
import { track } from '@/lib/analytics';
import { toast } from '@/stores/toast';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { Switch } from '@/components/ui/Switch';
import { RangeSlider } from '@/components/ui/RangeSlider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { SplitHeading } from '@/components/motion/SplitHeading';
import { PasswordField } from './PasswordField';
import { ProfileEditor } from './ProfileEditor';

type Section = 'profile' | 'experience' | 'region' | 'account';
const SECTIONS: { id: Section; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'experience', label: 'Experience' },
  { id: 'region', label: 'Region' },
  { id: 'account', label: 'Account' },
];

function Select({
  label,
  value,
  onChange,
  options,
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly { value: string; label: string }[];
  id: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-semibold">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        className="border-line bg-seat min-h-11 w-full max-w-sm rounded-[10px] border px-3"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** /account (spec 57): tabs with sliding indicator; every toggle previews its effect live. */
export function AccountSettings() {
  const sp = useSearchParams();
  const router = useRouter();
  const initial = (SECTIONS.find((s) => s.id === sp.get('section'))?.id ?? 'profile') as Section;
  const [tab, setTab] = useState<Section>(initial);
  const ui = useUiStore();
  const osReduced = useMediaQuery(QUERIES.reducedMotion);
  const { profile, repo, user, sb, accountsEnabled, selectProfile, signOut } = useSession();
  const { data: history = [] } = useHistory();
  const clearHistory = useClearHistory();
  const [confirmClear, setConfirmClear] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [pw, setPw] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const google = user?.identities?.some((i) => i.provider === 'google');

  const changePassword = async () => {
    const ok = PasswordSchema.safeParse(pw);
    if (!ok.success)
      return setPwError(ok.error.issues[0]?.message ?? 'Choose a stronger password.');
    const { error } = (await sb?.auth.updateUser({ password: pw })) ?? { error: null };
    if (error) return setPwError(authErrorMessage(error));
    setPw('');
    setPwError(null);
    toast.success('Password updated');
  };

  const deleteAccount = async () => {
    if (!sb) return;
    const { error } = await sb.rpc('delete_my_account');
    if (error) return toast.error(authErrorMessage(error));
    setDeleteOpen(false);
    toast.info('Your account and all its data were deleted.');
    await signOut();
  };

  return (
    <div className="px-gutter mx-auto max-w-3xl pt-32 pb-16">
      <SplitHeading as="h1" by="chars" trigger="mount" className="font-display text-h1 mb-8">
        Settings
      </SplitHeading>
      <Tabs
        label="Settings sections"
        idPrefix="settings"
        items={SECTIONS}
        value={tab}
        onChange={(id) => {
          setTab(id as Section);
          window.history.replaceState(null, '', `/account?section=${id}`);
        }}
      />

      <TabPanel id="profile" value={tab} prefix="settings" className="flex flex-col gap-8 pt-8">
        {profile ? (
          <div className="rounded-modal border-line bg-seat flex items-center gap-5 border p-5">
            <Avatar avatar={profile.avatar} name={profile.name} size={64} decorative />
            <div className="min-w-0 flex-1">
              <p className="font-display text-h3">{profile.name}</p>
              <p className="text-small text-dim">
                {profile.is_kids ? 'Kids profile · ' : ''}
                {CONTENT_LANGUAGES.find((l) => l.value === profile.language)?.label ??
                  profile.language}
              </p>
            </div>
            <Button variant="secondary" onClick={() => setEditProfile(true)} magnetic={false}>
              Edit profile
            </Button>
          </div>
        ) : (
          <div className="rounded-modal border-line bg-seat border p-5">
            <p className="text-dim mb-4">
              You’re browsing as a guest. Create a profile to keep separate lists, ratings and
              settings.
            </p>
            <Button href="/profiles">Choose a profile</Button>
          </div>
        )}
        <div className="border-line flex flex-wrap items-center justify-between gap-4 border-t pt-6">
          <div>
            <p className="font-semibold">Viewing history</p>
            <p className="text-small text-dim">
              {history.length} title{history.length === 1 ? '' : 's'} in “Continue exploring”.
            </p>
          </div>
          <Button variant="ghost" onClick={() => setConfirmClear(true)} disabled={!history.length}>
            Clear history
          </Button>
        </div>
      </TabPanel>

      <TabPanel id="experience" value={tab} prefix="settings" className="flex flex-col gap-8 pt-8">
        <Switch
          label="Reduced motion"
          description={
            osReduced
              ? 'Your system already asks for reduced motion.'
              : 'Crossfades only — no parallax, smooth scroll, tilt or WebGL motion.'
          }
          checked={ui.reducedMotion || osReduced}
          disabled={osReduced}
          onChange={(v) => {
            ui.setSettings({ reducedMotion: v });
            track('motion_toggle', { reduced: v });
          }}
        />
        <Switch
          label="Classic cursor"
          description="Use your system cursor instead of the film reel."
          checked={ui.classicCursor}
          onChange={(v) => ui.setSettings({ classicCursor: v })}
        />
        <Switch
          label="WebGL effects"
          description="Shader transitions, film grain, dust in the projector light."
          checked={ui.webgl}
          onChange={(v) => ui.setSettings({ webgl: v })}
        />
        <Switch
          label="Sound"
          description="Soft UI sounds — off by default."
          checked={ui.soundOn}
          onChange={(v) => {
            ui.setSettings({ soundOn: v });
            track('sound_toggle', { on: v });
          }}
        />
        <RangeSlider
          label="Film grain"
          min={0}
          max={100}
          step={5}
          value={ui.grain}
          onChange={(v) => typeof v === 'number' && ui.setSettings({ grain: v })}
          format={(v) => `${v}%`}
        />
      </TabPanel>

      <TabPanel id="region" value={tab} prefix="settings" className="flex flex-col gap-8 pt-8">
        <Select
          id="region"
          label="Watch-provider region"
          value={ui.region}
          onChange={(v) => ui.setSettings({ region: v })}
          options={REGIONS}
        />
        <Select
          id="content-lang"
          label="Content language"
          value={profile?.language ?? ui.contentLanguage}
          onChange={(v) => {
            ui.setSettings({ contentLanguage: v });
            if (profile) void repo.profiles.update(profile.id, { language: v }).then(selectProfile);
            router.refresh();
          }}
          options={CONTENT_LANGUAGES}
        />
      </TabPanel>

      <TabPanel id="account" value={tab} prefix="settings" className="flex flex-col gap-8 pt-8">
        {!accountsEnabled ? (
          <p className="text-dim">
            Accounts aren’t configured on this deployment. Everything is saved in this browser.
          </p>
        ) : !user ? (
          <div className="flex flex-col items-start gap-4">
            <p className="text-dim">
              Sign in to sync your profiles, list and ratings across devices.
            </p>
            <Button href="/login?next=/account">Log in</Button>
          </div>
        ) : (
          <>
            <div>
              <p className="text-small text-dim">Email</p>
              <p className="font-semibold">{user.email}</p>
            </div>
            <div>
              <p className="text-small text-dim">Connected accounts</p>
              <p className="font-semibold">
                {google ? 'Google — connected' : 'Google — not connected'}
              </p>
            </div>
            <form
              className="flex max-w-md flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                void changePassword();
              }}
            >
              <PasswordField
                label="New password"
                autoComplete="new-password"
                value={pw}
                onChange={(e) => setPw(e.currentTarget.value)}
                error={pwError ?? undefined}
                meter
              />
              <Button type="submit" variant="secondary" className="self-start" magnetic={false}>
                Update password
              </Button>
            </form>
            <div className="border-line flex flex-wrap gap-3 border-t pt-6">
              <Button variant="ghost" onClick={() => void signOut()}>
                Sign out
              </Button>
              <Button
                variant="ghost"
                className="text-danger hover:bg-danger/10"
                onClick={() => setDeleteOpen(true)}
              >
                Delete account
              </Button>
            </div>
          </>
        )}
      </TabPanel>

      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear viewing history?"
        description="This removes every title from “Continue exploring” for this profile."
      >
        <div className="mt-6 flex gap-3">
          <Button
            onClick={() =>
              clearHistory.mutate(undefined, {
                onSuccess: () => {
                  setConfirmClear(false);
                  toast.success('History cleared');
                },
              })
            }
            loading={clearHistory.isPending}
            data-autofocus
          >
            Clear history
          </Button>
          <Button variant="ghost" onClick={() => setConfirmClear(false)}>
            Keep it
          </Button>
        </div>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete your account?"
        description="This permanently deletes your profiles, list, ratings, reviews and history. It can’t be undone."
      >
        <div className="mt-6 flex flex-col gap-4">
          <Input
            label="Type DELETE to confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.currentTarget.value)}
            autoComplete="off"
            data-autofocus
          />
          <div className="flex gap-3">
            <Button
              className="bg-danger"
              disabled={confirmText !== 'DELETE'}
              onClick={() => void deleteAccount()}
            >
              Delete everything
            </Button>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {profile && (
        <ProfileEditor
          open={editProfile}
          profile={profile}
          onClose={() => setEditProfile(false)}
          onSave={async (input) => {
            selectProfile(await repo.profiles.update(profile.id, input));
          }}
        />
      )}
    </div>
  );
}
