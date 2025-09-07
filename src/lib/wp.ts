// src/lib/wp.ts
const CMS = (import.meta.env.PUBLIC_CMS_URL ?? 'https://cms.byteinnovalabs.xyz').replace(/\/+$/,'');
const API_BASE = `${CMS}/wp-json/wp/v2`;

export type WpMediaSize = { source_url: string; width: number; height: number; mime_type?: string };
export type WpFeatured = {
  alt_text?: string;
  media_details?: { width?: number; height?: number; sizes?: Record<string, WpMediaSize> };
  source_url: string;
};
export type WpAuthor = {
  id: number;
  name: string;
  slug: string;
  avatar_urls?: Record<string, string>;
  description?: string;
  url?: string;
};
export type WpPost = {
  id: number;
  slug: string;
  date: string;
  author: number;
  title: { rendered: string };
  excerpt: { rendered: string };
  content?: { rendered: string };
  featured_media?: number;
  _embedded?: { 
    ['wp:featuredmedia']?: Array<WpFeatured>;
    ['author']?: Array<WpAuthor>;
  };
};

export type WpPostsResponse = {
  posts: WpPost[];
  totalPosts: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

function withParams(url: string, params: Record<string, string | number | undefined>) {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params)) if (v !== undefined) u.searchParams.set(k, String(v));
  return u.toString();
}

export async function fetchPosts(perPage = 10, page = 1): Promise<WpPostsResponse> {
  const url = withParams(`${API_BASE}/posts`, { 
    per_page: perPage, 
    page: page,
    orderby: 'date', 
    order: 'desc', 
    _embed: 1 
  });
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`WP posts ${res.status}`);
  
  const posts: WpPost[] = await res.json();
  
  // WordPress envía información de paginación en los headers
  const totalPosts = parseInt(res.headers.get('X-WP-Total') || '0');
  const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1');
  
  return {
    posts,
    totalPosts,
    totalPages,
    currentPage: page,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
}

// Función legacy para compatibilidad
export async function fetchPostsSimple(perPage = 10): Promise<WpPost[]> {
  const response = await fetchPosts(perPage, 1);
  return response.posts;
}

// Función para obtener todos los posts (útil para generar rutas estáticas)
export async function fetchAllPosts(): Promise<WpPost[]> {
  // Primero obtenemos la primera página para saber cuántos posts hay en total
  const firstPage = await fetchPosts(100, 1); // Asumimos que no hay más de 100 por página
  
  if (firstPage.totalPages === 1) {
    return firstPage.posts;
  }
  
  // Si hay más páginas, obtenemos todas
  const allPosts: WpPost[] = [...firstPage.posts];
  
  for (let page = 2; page <= firstPage.totalPages; page++) {
    const pageResponse = await fetchPosts(100, page);
    allPosts.push(...pageResponse.posts);
  }
  
  return allPosts;
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

export function getAuthor(authorArray?: WpAuthor[]) {
  return authorArray?.[0] ?? null;
}

export async function fetchAuthorById(authorId: number): Promise<WpAuthor | null> {
  const url = `${API_BASE}/users/${authorId}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`WP author ${res.status}`);
    return res.json();
  } catch (error) {
    console.error('Error fetching author:', error);
    return null;
  }
}

/**
 * Obtiene la información del autor de un post
 * Primero intenta usar los datos embedidos, si no los hay, hace una consulta separada
 */
export async function getPostAuthor(post: WpPost): Promise<WpAuthor | null> {
  // Intentar usar datos embedidos primero
  const embeddedAuthor = getAuthor(post._embedded?.author);
  if (embeddedAuthor) {
    return embeddedAuthor;
  }
  
  // Si no hay datos embedidos, hacer consulta por ID
  if (post.author) {
    return await fetchAuthorById(post.author);
  }
  
  return null;
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
