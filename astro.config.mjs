// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://headlesscms.byteinnovalabs.xyz/', // Cambia por tu dominio real
  integrations: [
    // Puedes agregar @astrojs/sitemap si lo instalas
  ],
  output: 'static'
});
