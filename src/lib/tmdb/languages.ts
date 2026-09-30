export interface LanguageConfig {
  code: string;
  name: string;
  native: string;
  /** Primary production region, used for "Popular in …" discover calls. */
  region?: string;
}

/** Universal language rows — `discover` with `with_original_language`. */
export const LANGUAGES: readonly LanguageConfig[] = [
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', region: 'IN' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', region: 'IN' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', region: 'IN' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', region: 'IN' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', region: 'IN' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', region: 'IN' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', region: 'IN' },
  { code: 'ko', name: 'Korean', native: '한국어', region: 'KR' },
  { code: 'ja', name: 'Japanese', native: '日本語', region: 'JP' },
  { code: 'es', name: 'Spanish', native: 'Español', region: 'ES' },
  { code: 'fr', name: 'French', native: 'Français', region: 'FR' },
  { code: 'en', name: 'English', native: 'English', region: 'US' },
];

export const HOME_LANGUAGE_ROWS = ['hi', 'ta', 'te', 'ml', 'kn', 'bn', 'mr', 'ko', 'ja'] as const;

export function getLanguage(code: string): LanguageConfig | undefined {
  return LANGUAGES.find((l) => l.code === code);
}

export function languageName(code: string): string {
  return (
    getLanguage(code)?.name ?? new Intl.DisplayNames(['en'], { type: 'language' }).of(code) ?? code
  );
}

/** TMDB content-language options for the settings page (`language` param). */
export const CONTENT_LANGUAGES = [
  { value: 'en-US', label: 'English' },
  { value: 'hi-IN', label: 'Hindi' },
  { value: 'ta-IN', label: 'Tamil' },
  { value: 'te-IN', label: 'Telugu' },
  { value: 'ml-IN', label: 'Malayalam' },
  { value: 'ko-KR', label: 'Korean' },
  { value: 'ja-JP', label: 'Japanese' },
  { value: 'es-ES', label: 'Spanish' },
  { value: 'fr-FR', label: 'French' },
] as const;

export const REGIONS = [
  { value: 'IN', label: 'India' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'KR', label: 'South Korea' },
  { value: 'JP', label: 'Japan' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
] as const;
