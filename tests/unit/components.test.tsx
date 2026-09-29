import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { StarRating } from '@/components/ui/StarRating';
import { RatingRing } from '@/components/ui/RatingRing';
import { Switch } from '@/components/ui/Switch';
import { Tabs } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { SearchOverlay } from '@/components/layout/SearchOverlay';
import { MovieCard } from '@/components/movie/MovieCard';
import { useUiStore } from '@/stores/ui';
import { usePreviewStore } from '@/stores/preview';
import type { Movie } from '@/lib/tmdb/types';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

function wrap(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('Button', () => {
  it('renders a real <button> with its label and handles clicks', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Play trailer</Button>);
    const btn = screen.getByRole('button', { name: /play trailer/i });
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it('disabled and loading states block interaction', async () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
    rerender(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
  it('icon buttons require and expose an accessible label; links render as <a>', () => {
    render(
      <>
        <Button variant="icon" label="Like Dune" icon={<svg />} />
        <Button href="/movie/1">More info</Button>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Like Dune' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /more info/i })).toHaveAttribute('href', '/movie/1');
  });
});

describe('Modal', () => {
  function Harness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Open
        </button>
        <Modal open={open} onClose={() => setOpen(false)} title="Dialog title">
          <button type="button">First</button>
          <button type="button">Last</button>
        </Modal>
      </>
    );
  }

  it('traps focus, closes on Escape and restores focus', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Open' });
    await user.click(opener);
    const dialog = await screen.findByRole('dialog', { name: 'Dialog title' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    for (let i = 0; i < 5; i++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(document.activeElement).toBe(opener);
  });
});

describe('Rating', () => {
  it('star rating is a keyboard slider with half steps', async () => {
    const onChange = vi.fn();
    render(<StarRating value={6} onChange={onChange} label="Your rating" />);
    const slider = screen.getByRole('slider', { name: 'Your rating' });
    expect(slider).toHaveAttribute('aria-valuetext', '3 of 5 stars');
    slider.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith(7);
    await userEvent.keyboard('{Delete}');
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
  it('rating ring announces the score', () => {
    render(<RatingRing value={8.25} label="TMDB rating" />);
    expect(screen.getByRole('img', { name: 'TMDB rating: 8.3 out of 10' })).toBeInTheDocument();
  });
});

describe('Switch, Tabs, Input', () => {
  it('switch toggles aria-checked', async () => {
    function S() {
      const [on, setOn] = useState(false);
      return <Switch label="Sound" checked={on} onChange={setOn} />;
    }
    render(<S />);
    const sw = screen.getByRole('switch', { name: 'Sound' });
    await userEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'true');
  });
  it('tabs move with arrow keys', async () => {
    function T() {
      const [v, setV] = useState('a');
      return (
        <Tabs
          label="Sections"
          value={v}
          onChange={setV}
          items={[
            { id: 'a', label: 'A' },
            { id: 'b', label: 'B' },
          ]}
        />
      );
    }
    render(<T />);
    screen.getByRole('tab', { name: 'A' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'B' })).toHaveAttribute('aria-selected', 'true');
  });
  it('input wires label and error', () => {
    render(<Input label="Email" error="That doesn’t look like an email address." />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('email address');
  });
});

describe('Search combobox', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('search/multi'))
          return new Response(
            JSON.stringify({
              page: 1,
              total_pages: 1,
              movies: [
                {
                  id: 11,
                  title: 'Neon Harbor',
                  overview: '',
                  poster_path: null,
                  backdrop_path: null,
                  release_date: '2020-01-01',
                  vote_average: 7,
                  vote_count: 1,
                  popularity: 1,
                  genre_ids: [],
                  original_language: 'en',
                  adult: false,
                },
              ],
              people: [],
            }),
          );
        return new Response(
          JSON.stringify({ page: 1, results: [], total_pages: 1, total_results: 0 }),
        );
      }),
    );
    push.mockReset();
  });

  it('is fully keyboard operable with combobox/listbox ARIA', async () => {
    const user = userEvent.setup();
    wrap(<SearchOverlay />);
    act(() => useUiStore.getState().set('searchOpen', true));
    const box = await screen.findByRole('combobox', { name: /search movies and people/i });
    await user.type(box, 'neon');
    const option = await screen.findByRole('option', { name: /neon harbor/i }, { timeout: 3000 });
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await waitFor(() => expect(box).toHaveAttribute('aria-activedescendant', option.id));
    await user.keyboard('{Enter}');
    await waitFor(() => expect(push).toHaveBeenCalledWith('/movie/11', { scroll: false }));
    act(() => useUiStore.getState().set('searchOpen', false));
  });
});

describe('MovieCard keyboard behaviour', () => {
  const movie: Movie = {
    id: 42,
    title: 'Dune',
    overview: '',
    poster_path: null,
    backdrop_path: null,
    release_date: '2024-03-01',
    vote_average: 8.2,
    vote_count: 1,
    popularity: 1,
    genre_ids: [],
    original_language: 'en',
    adult: false,
  };

  it('is a link with an accessible name; Space opens the preview; Enter navigates', async () => {
    const user = userEvent.setup();
    wrap(<MovieCard movie={movie} />);
    const link = screen.getByRole('link', { name: 'Dune, 2024, rated 8.2' });
    expect(link).toHaveAttribute('href', '/movie/42');
    link.focus();
    await user.keyboard(' ');
    expect(usePreviewStore.getState().movie?.id).toBe(42);
    expect(usePreviewStore.getState().source).toBe('keyboard');
    usePreviewStore.getState().close();
    await user.keyboard('{Enter}');
    await waitFor(() => expect(push).toHaveBeenCalledWith('/movie/42', { scroll: false }));
  });
});
