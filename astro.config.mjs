// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  // Bind to 0.0.0.0 by default so the server is reachable inside a container
  // (Coolify/Docker). No HOST env var needed. Port still overridable via PORT.
  server: { host: true },
  // Behind Coolify/Traefik the app is reached over HTTP internally, so Astro
  // would build url.origin as http:// and reject same-site POSTs (CSRF).
  // Trusting the proxy's x-forwarded-host for these domains makes Astro
  // reconstruct the real https origin, so form submissions work.
  security: {
    allowedDomains: [
      { hostname: 'luxoriadrive.com' },
      { hostname: 'www.luxoriadrive.com' },
    ],
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
