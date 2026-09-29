# 63 — SEO & Metadata

- `generateMetadata` for every route; detail pages: title, overview description (≤ 160 chars), OG + Twitter image (backdrop), canonical URL.
- JSON-LD `Movie` schema on detail (name, image, datePublished, director, aggregateRating), `Person` on person pages.
- `sitemap.ts` (top 1,000 movies + genres + languages), `robots.ts`.
- Dynamic OG image route (`opengraph-image.tsx`) composing backdrop + logo + rating in brand style.
- Semantic headings, meaningful link text.

## Acceptance
- [ ] Rich results test passes for a movie page
- [ ] OG preview verified on LinkedIn and WhatsApp
