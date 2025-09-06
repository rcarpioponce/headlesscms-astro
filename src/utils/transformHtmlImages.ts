// utils/transformHtmlImages.ts
import { parseFragment, serialize } from 'parse5';

/**
 * Convierte HTML con <img> en <picture> + <source webp> y añade loading lazy
 */
export function transformHtmlImages(html: string): string {
  const fragment = parseFragment(html);

  function walk(node: any) {
    // Añade lazy loading a todas las imágenes, incluso las que no procesamos con <picture>
    if (node.nodeName === 'img') {
      // Asegurarse de que la imagen tenga loading="lazy"
      const hasLoading = node.attrs.some((a: any) => a.name === 'loading');
      if (!hasLoading) {
        node.attrs.push({ name: 'loading', value: 'lazy' });
      }
      
      // Asegurarse de que la imagen tenga decoding="async"
      const hasDecoding = node.attrs.some((a: any) => a.name === 'decoding');
      if (!hasDecoding) {
        node.attrs.push({ name: 'decoding', value: 'async' });
      }
      
      // Convertir a <picture> solo si es una imagen del WordPress
      const srcAttr = node.attrs.find((a: any) => a.name === 'src');
      if (srcAttr && srcAttr.value.includes('/wp-content/uploads/')) {
        const src = srcAttr.value;

        // Generamos la ruta espejo para WebP
        const webp = src
          .replace('/wp-content/uploads/', '/wp-content/uploads-webpc/uploads/')
          + '.webp';

        const altAttr = node.attrs.find((a: any) => a.name === 'alt');
        const alt = altAttr ? altAttr.value : '';
        
        // Extraer width y height si existen
        const widthAttr = node.attrs.find((a: any) => a.name === 'width');
        const heightAttr = node.attrs.find((a: any) => a.name === 'height');
        
        // Añadir todos los atributos necesarios para el img
        const imgAttrs = [
          { name: 'src', value: src },
          { name: 'alt', value: alt },
          { name: 'loading', value: 'lazy' },
          { name: 'decoding', value: 'async' }
        ];
        
        if (widthAttr) {
          imgAttrs.push({ name: 'width', value: widthAttr.value });
        }
        
        if (heightAttr) {
          imgAttrs.push({ name: 'height', value: heightAttr.value });
        }

        // Construimos <picture> con <source> y <img>
        const picture = {
          nodeName: 'picture',
          tagName: 'picture',
          attrs: [],
          namespaceURI: 'http://www.w3.org/1999/xhtml',
          childNodes: [
            {
              nodeName: 'source',
              tagName: 'source',
              attrs: [
                { name: 'srcset', value: webp },
                { name: 'type', value: 'image/webp' }
              ],
              namespaceURI: 'http://www.w3.org/1999/xhtml',
              childNodes: []
            },
            {
              nodeName: 'img',
              tagName: 'img',
              attrs: imgAttrs,
              namespaceURI: 'http://www.w3.org/1999/xhtml',
              childNodes: []
            }
          ]
        };
        return picture;
      }
    }

    if (node.childNodes) {
      node.childNodes = node.childNodes.map(walk);
    }
    return node;
  }

  const transformed = fragment.childNodes.map(walk);
  return serialize({ ...fragment, childNodes: transformed });
}
