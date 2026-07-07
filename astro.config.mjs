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
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
