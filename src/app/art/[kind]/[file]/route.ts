import { allArtPaths, renderArt } from '@/lib/art/catalogue';

export const dynamic = 'force-static';

/** Prebuilds every generated poster, backdrop, still and portrait at build time. */
export function generateStaticParams() {
  return allArtPaths().map((p) => {
    const [, , kind, file] = p.split('/');
    return { kind: kind as string, file: file as string };
  });
}

export async function GET(_req: Request, ctx: { params: Promise<{ kind: string; file: string }> }) {
  const { kind, file } = await ctx.params;
  const svg = renderArt(`/art/${kind}/${file}`);
  if (!svg) return new Response('Not found', { status: 404 });
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
      // Served as an image only: no scripts, no external loads.
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
    },
  });
}
