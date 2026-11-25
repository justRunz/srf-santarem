import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';

const secret = { context: 'server', access: 'secret', optional: true };

// Portuguese URLs, English file names: each public route points to a view in src/views/.
// One route per view keeps per-page bundles (the map's CSS stays on /contactos only).
const routes = {
  '/beneficios': 'Benefits',
  '/equipamentos': 'Equipment',
  '/precos': 'Pricing',
  '/contactos': 'Contact',
  '/termos': 'Terms',
  '/privacidade': 'Privacy',
};
const portugueseRoutes = {
  name: 'portuguese-routes',
  hooks: {
    'astro:config:setup': ({ injectRoute }) => {
      for (const [pattern, view] of Object.entries(routes))
        injectRoute({ pattern, entrypoint: new URL(`./src/views/${view}.astro`, import.meta.url) });
    },
  },
};

export default defineConfig({
  // The site stays static; only /api/booking runs on demand (prerender = false).
  adapter: vercel(),
  integrations: [portugueseRoutes],
  env: {
    schema: {
      // Optional: without them the site still starts and email sending returns an error.
      RESEND_API_KEY: envField.string(secret),
      EMAIL_FROM: envField.string(secret),
      EMAIL_TO: envField.string(secret),
    },
  },
});
