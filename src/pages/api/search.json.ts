import { fetchAllPosts, type WpPost } from '../../lib/wp';

export async function GET() {
  try {
    const posts = await fetchAllPosts();
    
    // Crear un índice de búsqueda con la información esencial
    const searchIndex = posts.map((post: WpPost) => ({
      id: post.id,
      title: post.title.rendered,
      slug: post.slug,
      excerpt: post.excerpt.rendered.replace(/<[^>]*>/g, ''), // Remover HTML
      date: post.date,
      author: post._embedded?.author?.[0]?.name || 'Autor desconocido'
    }));

    return new Response(JSON.stringify(searchIndex), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600' // Cache por 1 hora
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error al obtener posts' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
