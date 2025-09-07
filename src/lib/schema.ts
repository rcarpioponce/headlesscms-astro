export interface SchemaArticle {
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified: string;
  author: {
    name: string;
    url?: string;
  };
  publisher: {
    name: string;
    logo: string;
  };
  url: string;
}

export interface SchemaBreadcrumb {
  name: string;
  url: string;
}

export function generateArticleSchema(article: SchemaArticle): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.headline,
    "description": article.description,
    "image": article.image,
    "datePublished": article.datePublished,
    "dateModified": article.dateModified,
    "author": {
      "@type": "Person",
      "name": article.author.name,
      "url": article.author.url
    },
    "publisher": {
      "@type": "Organization",
      "name": article.publisher.name,
      "logo": {
        "@type": "ImageObject",
        "url": article.publisher.logo
      }
    },
    "url": article.url,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": article.url
    }
  };

  return JSON.stringify(schema, null, 2);
}

export function generateBreadcrumbSchema(breadcrumbs: SchemaBreadcrumb[]): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  };

  return JSON.stringify(schema, null, 2);
}

export function generateWebsiteSchema(): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Aprende cada día más",
    "description": "Blog de tecnología y aprendizaje diario. Descubre artículos sobre desarrollo web, programación y las últimas tendencias tecnológicas.",
    "url": "https://headlesscms.byteinnovalabs.xyz",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://headlesscms.byteinnovalabs.xyz/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  return JSON.stringify(schema, null, 2);
}
