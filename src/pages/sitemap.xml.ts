import { fetchAllPosts, fetchPosts } from '../lib/wp';

export async function GET() {
  try {
    // Obtener todos los posts para el sitemap
    const posts = await fetchAllPosts();

    // URLs estáticas del sitio
    const staticUrls = [
      {
        url: '/',
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date().toISOString()
      }
    ];

    // Agregar páginas de paginación
    const postsResponse = await fetchPosts(6, 1);
    const totalPages = postsResponse.totalPages;

    for (let page = 2; page <= totalPages; page++) {
      staticUrls.push({
        url: `/page/${page}/`,
        changefreq: 'weekly',
        priority: 0.8,
        lastmod: new Date().toISOString()
      });
    }

    // URLs de posts dinámicos
    const postUrls = posts.map(post => ({
      url: `/blog/${post.slug}/`,
      changefreq: 'monthly',
      priority: 0.7,
      lastmod: new Date(post.date).toISOString()
    }));

    // Combinar todas las URLs
    const allUrls = [...staticUrls, ...postUrls];

    // URL base del sitio
    const SITE_URL = 'https://headlesscms.byteinnovalabs.xyz';

    // Generar XML del sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(({ url, changefreq, priority, lastmod }) => `  <url>
    <loc>${SITE_URL}${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return new Response(sitemap.trim(), {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}
