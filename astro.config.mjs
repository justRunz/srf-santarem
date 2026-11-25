import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';

const secret = { context: 'server', access: 'secret', optional: true };

export default defineConfig({
  // The site stays static; only /api/booking runs on demand (prerender = false).
  adapter: vercel(),
  env: {
    schema: {
      // Optional: without them the site still starts and email sending returns an error.
      RESEND_API_KEY: envField.string(secret),
      EMAIL_FROM: envField.string(secret),
      EMAIL_TO: envField.string(secret),
    },
  },
});
