export type TmdbErrorKind = 'config' | 'http' | 'validation' | 'network' | 'not_found' | 'rate_limit';

export class TmdbError extends Error {
  override readonly name = 'TmdbError';

  constructor(
    readonly kind: TmdbErrorKind,
    message: string,
    readonly status?: number,
    readonly path?: string,
  ) {
    super(message);
  }
}

export const isTmdbError = (e: unknown): e is TmdbError => e instanceof TmdbError;
