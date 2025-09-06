// src/lib/wp.ts
const CMS = (import.meta.env.PUBLIC_CMS_URL ?? 'https://cms.byteinnovalabs.xyz').replace(/\/+$/,'');
const API_BASE = `${CMS}/wp-json/wp/v2`;

export type WpMediaSize = { source_url: string; width: number; height: number; mime_type?: string };
export type WpFeatured = {
  alt_text?: string;
  media_details?: { width?: number; height?: number; sizes?: Record<string, WpMediaSize> };
  source_url: string;
};
export type WpPost = {
  id: number;
  slug: string;
  date: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content?: { rendered: string };
  featured_media?: number;
  _embedded?: { ['wp:featuredmedia']?: Array<WpFeatured> };
};

function withParams(url: string, params: Record<string, string | number | undefined>) {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params)) if (v !== undefined) u.searchParams.set(k, String(v));
  return u.toString();
}

export async function fetchPosts(perPage = 10): Promise<WpPost[]> {
  const url = withParams(`${API_BASE}/posts`, { per_page: perPage, orderby: 'date', order: 'desc', _embed: 1 });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`WP posts ${res.status}`);
  return res.json();
}

export async function fetchPostBySlug(slug: string): Promise<WpPost | null> {
  const url = withParams(`${API_BASE}/posts`, { slug, _embed: 1 });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`WP post ${res.status}`);
  const arr: WpPost[] = await res.json();
  return arr[0] ?? null;
}

export function getFeatured(fmArray?: WpFeatured[]) {
  return fmArray?.[0] ?? null;
}

// lib/wp.ts
export function buildResponsiveFromWp(fm: any, opts: { maxWidth: number; sizes: string }) {
  if (!fm) return null;

  const sizes = fm.media_details?.sizes || {};
  const entries = Object.values(sizes) as any[];

  // Ordenar de menor a mayor
  const sorted = entries.sort((a, b) => a.width - b.width);

  const srcset = sorted.map((s) => `${s.source_url} ${s.width}w`).join(', ');
  const webpSrcset = sorted
    .map((s) => `${s.source_url.replace('/wp-content/uploads/', '/wp-content/uploads-webpc/uploads/')}.webp ${s.width}w`)
    .join(', ');

  const largest = sorted[sorted.length - 1];

  return {
    src: largest.source_url,
    srcset,
    webpSrcset,
    sizes: opts.sizes,
    alt: fm.alt_text || '',
    width: largest.width,
    height: largest.height
  };
}
