import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';

const secret = { context: 'server', access: 'secret', optional: true };

export default defineConfig({
  // O site continua estático; só /api/pedido corre a pedido (prerender = false).
  adapter: vercel(),
  env: {
    schema: {
      // Opcionais: sem elas o site arranca e o envio por email devolve um erro.
      RESEND_API_KEY: envField.string(secret),
      EMAIL_FROM: envField.string(secret),
      EMAIL_TO: envField.string(secret),
    },
  },
});
