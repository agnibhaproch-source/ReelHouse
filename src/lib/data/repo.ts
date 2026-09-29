import type { ExperienceSettings } from '@/stores/ui';
import type {
  HistoryItem,
  Profile,
  ProfileInput,
  ReviewInput,
  SiteReview,
  WatchItem,
  MovieSnapshot,
  HistoryKind,
} from './types';

/** Persistence contract implemented by the guest (localStorage) and Supabase backends. */
export interface Repo {
  readonly kind: 'local' | 'supabase';
  profiles: {
    list(): Promise<Profile[]>;
    create(input: ProfileInput): Promise<Profile>;
    update(
      id: string,
      patch: Partial<ProfileInput> & { settings?: Partial<ExperienceSettings> },
    ): Promise<Profile>;
    remove(id: string): Promise<void>;
  };
  watchlist: {
    list(profileId: string): Promise<WatchItem[]>;
    add(profileId: string, movie: MovieSnapshot): Promise<WatchItem>;
    remove(profileId: string, movieId: number): Promise<void>;
    reorder(profileId: string, movieIds: number[]): Promise<void>;
  };
  history: {
    list(profileId: string): Promise<HistoryItem[]>;
    record(
      profileId: string,
      movie: MovieSnapshot,
      kind: HistoryKind,
      progress?: number,
    ): Promise<void>;
    remove(profileId: string, movieId: number): Promise<void>;
    clear(profileId: string): Promise<void>;
  };
  ratings: {
    all(profileId: string): Promise<Record<number, number>>;
    set(profileId: string, movieId: number, score: number | null): Promise<void>;
    average(movieId: number): Promise<{ average: number; count: number }>;
  };
  reviews: {
    list(movieId: number, profileId: string): Promise<SiteReview[]>;
    upsert(profile: Profile | null, profileId: string, input: ReviewInput): Promise<SiteReview>;
    remove(profileId: string, reviewId: string): Promise<void>;
    like(profileId: string, reviewId: string, on: boolean): Promise<void>;
    report(profileId: string, reviewId: string, reason: string): Promise<void>;
  };
}
