import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const parse = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    beta = { messages: { parse } };
  },
}));

describe('ask: Claude interpreter (mocked SDK)', () => {
  beforeEach(() => {
    vi.resetModules();
    parse.mockReset();
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
  });
  afterEach(() => vi.unstubAllEnvs());

  it('sends a low-effort structured request with default fallbacks and maps the output', async () => {
    parse.mockResolvedValue({
      stop_reason: 'end_turn',
      parsed_output: {
        genres: ['thriller', 'mystery'],
        exclude_genres: ['horror'],
        languages: ['ko'],
        year_from: 1850,
        year_to: null,
        runtime_min_minutes: null,
        runtime_max_minutes: 120,
        min_rating_out_of_10: 12,
        sort: 'top',
      },
    });
    const { interpret } = await import('@/lib/nl-search.server');
    const r = await interpret('  a  slow-burn Korean mystery   ');
    expect(r.source).toBe('ai');
    expect(r.interpretation).toMatchObject({
      genres: [53, 9648],
      excludeGenres: [27],
      languages: ['ko'],
      yearFrom: 1900, // clamped
      runtimeMax: 120,
      ratingMin: 9, // clamped
      sort: 'top',
    });
    const req = parse.mock.calls[0]?.[0];
    expect(req).toMatchObject({
      model: 'claude-opus-5-5',
      fallbacks: 'default',
      betas: ['server-side-fallback-2026-07-01'],
      output_config: { effort: 'low' },
      messages: [{ role: 'user', content: 'a slow-burn Korean mystery' }],
    });
    // Memoised: the same description doesn't call the API again.
    await interpret('A slow-burn Korean mystery');
    expect(parse).toHaveBeenCalledTimes(1);
  });

  it('falls back to the keyword parser on errors and refusals', async () => {
    const { interpret } = await import('@/lib/nl-search.server');
    parse.mockRejectedValueOnce(new Error('network'));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const a = await interpret('korean thriller');
    expect(a).toMatchObject({
      source: 'rules',
      interpretation: { genres: [53], languages: ['ko'] },
    });
    parse.mockResolvedValueOnce({ stop_reason: 'refusal', parsed_output: null });
    expect((await interpret('french comedy')).source).toBe('rules');
    spy.mockRestore();
  });

  it('uses the keyword parser when no key is configured', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    const { interpret } = await import('@/lib/nl-search.server');
    expect((await interpret('japanese animation')).source).toBe('rules');
    expect(parse).not.toHaveBeenCalled();
  });
});
