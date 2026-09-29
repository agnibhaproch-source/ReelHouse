import { MAX_REVIEW_LENGTH } from './data/types';

/** Small, deliberately conservative list; masks rather than rejects. */
const WORDS = [
  'fuck',
  'shit',
  'bitch',
  'cunt',
  'asshole',
  'bastard',
  'dick',
  'slut',
  'whore',
  'motherfucker',
];
const RE = new RegExp(`\\b(${WORDS.join('|')})(s|es|ed|ing)?\\b`, 'gi');

export function maskProfanity(text: string): string {
  return text.replace(RE, (m) => `${m[0]}${'*'.repeat(m.length - 1)}`);
}

export function containsProfanity(text: string): boolean {
  RE.lastIndex = 0;
  const hit = RE.test(text);
  RE.lastIndex = 0;
  return hit;
}

/** Plain text only: strip control chars, trim, clamp length, mask profanity. */
export function cleanReviewBody(body: string): string {
  const plain = body.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  return maskProfanity(plain.slice(0, MAX_REVIEW_LENGTH));
}
