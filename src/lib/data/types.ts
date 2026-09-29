import type { ExperienceSettings } from '@/stores/ui';

export const AVATARS = ['reel', 'clapper', 'popcorn', 'ticket', 'lamp', 'star'] as const;
export type AvatarKey = (typeof AVATARS)[number];

export interface Profile {
  id: string;
  user_id: string | null;
  name: string;
  avatar: AvatarKey;
  is_kids: boolean;
  language: string;
  settings: Partial<ExperienceSettings>;
  created_at: string;
}

export type ProfileInput = Pick<Profile, 'name' | 'avatar' | 'is_kids' | 'language'>;

export interface MovieSnapshot {
  movie_id: number;
  title: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  release_date?: string | null;
  genre_ids?: number[];
  original_language?: string;
}

export interface WatchItem extends MovieSnapshot {
  added_at: string;
  position: number;
}

export type HistoryKind = 'view' | 'trailer';

export interface HistoryItem extends MovieSnapshot {
  kind: HistoryKind;
  at: string;
  /** 0–1 trailer watched fraction (for the progress line). */
  progress: number;
}

export interface SiteReview {
  id: string;
  profile_id: string;
  profile_name: string;
  avatar: AvatarKey;
  movie_id: number;
  body: string;
  spoiler: boolean;
  created_at: string;
  updated_at: string;
  likes: number;
  liked: boolean;
}

export interface ReviewInput {
  id?: string;
  movie_id: number;
  body: string;
  spoiler: boolean;
}

export const MAX_PROFILES = 5;
export const MAX_REVIEW_LENGTH = 2000;
