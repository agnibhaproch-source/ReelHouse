'use client';

import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SkipForward, Volume2, VolumeX, X, RotateCw } from 'lucide-react';
import { useTrailerStore } from '@/stores/trailer';
import { useMovieDetail } from '@/hooks/useMovieDetail';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useLenis } from '@/hooks/useLenis';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { useRecordHistory } from '@/hooks/useHistory';
import { EASES, DUR } from '@/lib/tokens';
import { cn } from '@/lib/utils';
import { pickVideos, youtubeThumb } from '@/lib/tmdb/videos';
import { tmdbImage } from '@/lib/tmdb/images';
import { loadYouTube, YT_HOST, type YTPlayer } from '@/lib/youtube';
import { startProjector, stopProjector } from '@/lib/sound';
import { setNowPlaying } from '@/lib/tab-title';
import type { Video } from '@/lib/tmdb/types';
import { Button } from '@/components/ui/Button';
import { FilmReelSpinner } from '@/components/ui/FilmReelSpinner';
import { WatchlistButton } from './WatchlistButton';

/**
 * Cinematic trailer player (spec 54): dim + letterbox bars, frame grows from the clicked button,
 * YouTube (privacy-enhanced) via the IFrame API loaded on open, custom controls outside the
 * iframe, ambient tinted backdrop, video list with crossfade, Esc/close reverses and releases.
 */
export function TrailerPlayer() {
  const { movie, videos: given, origin, color, close } = useTrailerStore();
  const open = Boolean(movie);
  const { data: detail, isPending } = useMovieDetail(
    open && !given ? (movie?.movie_id ?? null) : null,
  );
  const videos: Video[] = given ?? pickVideos(detail?.videos.results);
  const [current, setCurrent] = useState(0);
  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const { stop, start } = useLenis();
  const { reduced } = useMotionPrefs();
  const record = useRecordHistory();
  const recordRef = useRef(record.mutate);
  useFocusTrap(panel, open, close);

  useEffect(() => {
    recordRef.current = record.mutate;
  });

  // Reset per open.
  const [openedFor, setOpenedFor] = useState<number | null>(null);
  if (open && movie && openedFor !== movie.movie_id) {
    setOpenedFor(movie.movie_id);
    setCurrent(0);
    setReady(false);
  }
  if (!open && openedFor !== null) setOpenedFor(null);

  useEffect(() => {
    if (!open) return;
    stop();
    void startProjector();
    const t = setTimeout(stopProjector, 1800);
    return () => {
      clearTimeout(t);
      stopProjector();
      start();
    };
  }, [open, stop, start]);

  const video = videos[current];

  // Create / swap the YouTube player; release it on close.
  useEffect(() => {
    const hostEl = host.current;
    if (!open || !video || !hostEl || !movie) return;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    const el = document.createElement('div');
    hostEl.replaceChildren(el);
    void loadYouTube()
      .then((YT) => {
        if (cancelled) return;
        player.current = new YT.Player(el, {
          host: YT_HOST,
          videoId: video.key,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            cc_load_policy: 0,
            iv_load_policy: 3,
            origin: window.location.origin,
          },
          events: {
            onReady: (e) => {
              setReady(true);
              if (muted) e.target.mute();
              e.target.playVideo();
            },
            onStateChange: (e) => {
              if (e.data === 1) {
                setNowPlaying(movie.title);
                timer ??= setInterval(() => {
                  const p = player.current;
                  if (!p) return;
                  const d = p.getDuration();
                  if (d > 0)
                    recordRef.current({
                      movie,
                      kind: 'trailer',
                      progress: Math.min(1, p.getCurrentTime() / d),
                    });
                }, 5000);
              } else if (e.data === 0) {
                recordRef.current({ movie, kind: 'trailer', progress: 1 });
                setNowPlaying(null);
              } else if (e.data === 2) setNowPlaying(null);
            },
          },
        });
      })
      .catch(() => setReady(true));
    recordRef.current({ movie, kind: 'trailer', progress: 0.02 });
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      try {
        player.current?.stopVideo();
        player.current?.destroy();
      } catch {
        /* iframe already gone */
      }
      player.current = null;
      setNowPlaying(null);
      hostEl.replaceChildren();
    };
    // `muted` is applied on ready; changing it must not recreate the player.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, video?.key, movie]);

  const toggleMute = useCallback(() => {
    const p = player.current;
    if (!p) return;
    if (p.isMuted()) p.unMute();
    else p.mute();
    setMuted(!muted);
  }, [muted]);

  const next = () => {
    if (videos.length < 2) return;
    setReady(false);
    setCurrent((c) => (c + 1) % videos.length);
  };

  if (typeof document === 'undefined') return null;

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const w = Math.min(vw * 0.9, 1280, (vh * 0.72 * 16) / 9);
  const from = origin
    ? {
        x: origin.left + origin.width / 2 - vw / 2,
        y: origin.top + origin.height / 2 - vh / 2,
        scaleX: origin.width / w,
        scaleY: origin.height / ((w * 9) / 16),
        opacity: 0.4,
      }
    : { scale: 0.9, opacity: 0 };
  const backdrop = tmdbImage(movie?.backdrop_path ?? detail?.backdrop_path, 'w780');

  return createPortal(
    <AnimatePresence>
      {open && movie && (
        <div className="fixed inset-0 z-(--z-modal)" data-lenis-prevent>
          <m.div
            className="bg-ink/90 absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DUR.base }}
            onClick={close}
            aria-hidden="true"
          />
          {/* Ambient light */}
          {backdrop && (
            <m.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.55 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DUR.slow }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- decorative, heavily blurred */}
              <img src={backdrop} alt="" className="size-full scale-125 object-cover blur-[80px]" />
              <div
                className="absolute inset-0 mix-blend-color"
                style={{ background: color ?? 'var(--marquee-violet)' }}
              />
            </m.div>
          )}
          {/* Letterbox */}
          <m.div
            aria-hidden="true"
            className="bg-ink absolute inset-x-0 top-0 h-[7vh]"
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: DUR.slow, ease: EASES.projector }}
          />
          <m.div
            aria-hidden="true"
            className="bg-ink absolute inset-x-0 bottom-0 h-[7vh]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: DUR.slow, ease: EASES.projector }}
          />

          <div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={`Trailer: ${movie.title}`}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-y-auto px-4 py-[9vh]"
          >
            <m.div
              className="rounded-modal bg-ink relative w-full overflow-hidden shadow-[0_40px_120px_rgb(0_0_0/0.8)] max-md:rounded-none"
              style={{ maxWidth: w, aspectRatio: '16 / 9' }}
              initial={reduced ? { opacity: 0 } : from}
              animate={{ x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, opacity: 1 }}
              exit={
                reduced
                  ? { opacity: 0 }
                  : { ...from, opacity: 0, transition: { duration: DUR.base, ease: EASES.shutter } }
              }
              transition={{ duration: DUR.slow, ease: EASES.projector, delay: reduced ? 0 : 0.15 }}
            >
              {video ? (
                <>
                  <div
                    ref={host}
                    data-cursor="hidden"
                    className={cn(
                      'duration-slow absolute inset-0 transition-opacity [&_iframe]:size-full',
                      ready ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {!ready && (
                    <div className="text-dim absolute inset-0 grid place-items-center">
                      <FilmReelSpinner className="size-10" label="Loading trailer" />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-dim absolute inset-0 grid place-items-center text-center">
                  {isPending && !given ? (
                    <FilmReelSpinner className="size-10" label="Loading trailer" />
                  ) : (
                    <p className="font-display text-h3 text-reel">No trailer available</p>
                  )}
                </div>
              )}
            </m.div>

            <m.div
              className="flex w-full flex-wrap items-center gap-2"
              style={{ maxWidth: w }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.5, duration: DUR.base }}
            >
              <div className="mr-auto min-w-0">
                <p className="font-display text-h3 truncate">{movie.title}</p>
                {video && <p className="text-small text-dim truncate">{video.name}</p>}
              </div>
              <WatchlistButton movie={movie} size="sm" />
              {videos.length > 1 && (
                <Button
                  variant="icon"
                  size="sm"
                  label="Next trailer"
                  icon={<SkipForward />}
                  iconAnim="nudge-right"
                  onClick={next}
                />
              )}
              <Button
                variant="icon"
                size="sm"
                label={muted ? 'Unmute' : 'Mute'}
                icon={muted ? <VolumeX /> : <Volume2 />}
                onClick={toggleMute}
                disabled={!ready || !video}
              />
              <Button
                variant="icon"
                size="sm"
                label="Close trailer"
                icon={<X />}
                iconAnim="spin"
                onClick={close}
                data-autofocus
              />
            </m.div>

            <p className="text-small text-dim flex items-center gap-2 md:hidden portrait:flex landscape:hidden">
              <RotateCw className="size-4" aria-hidden="true" /> Rotate your phone for a bigger
              picture.
            </p>

            {videos.length > 1 && (
              <m.ul
                className="no-scrollbar flex w-full gap-3 overflow-x-auto pb-2"
                style={{ maxWidth: w }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {videos.slice(0, 10).map((v, i) => (
                  <li key={v.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setReady(false);
                        setCurrent(i);
                      }}
                      aria-current={i === current}
                      aria-label={`Play ${v.name}`}
                      data-cursor="play"
                      data-cursor-label="Play"
                      className={cn(
                        'group rounded-poster duration-fast relative block w-44 overflow-hidden border-2 transition-colors',
                        i === current ? 'border-violet' : 'border-transparent',
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnail */}
                      <img
                        src={youtubeThumb(v.key)}
                        alt=""
                        loading="lazy"
                        className="duration-slow ease-reel aspect-video w-full object-cover transition-transform group-hover:scale-110"
                      />
                      <span className="from-ink absolute inset-x-0 bottom-0 truncate bg-gradient-to-t to-transparent px-2 pt-4 pb-1 text-left text-[0.7rem]">
                        {v.name}
                      </span>
                    </button>
                  </li>
                ))}
              </m.ul>
            )}
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
