import noise from '@/shaders/noise.glsl';

/** Resolves `#include <noise>` in our shader files (three's own chunks are untouched). */
export function withChunks(src: string): string {
  return src.replace('#include <noise>', noise);
}
