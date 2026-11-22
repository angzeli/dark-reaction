import { defineConfig, type Plugin } from 'vite';

/**
 * A strict Content-Security-Policy for production builds. The game makes no
 * network requests at runtime, so `connect-src 'none'` is enforced by the
 * browser, not just by convention. Dev builds skip it so HMR keeps working.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "media-src 'self' blob:",
  "connect-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

function cspPlugin(): Plugin {
  return {
    name: 'dark-reaction-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<meta charset="UTF-8" />',
        `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
      );
    },
  };
}

export default defineConfig(() => ({
  // GitHub Pages serves the site from /dark-reaction/; dev and preview use the same path.
  base: '/dark-reaction/',
  plugins: [cspPlugin()],
  build: {
    target: 'es2022',
    sourcemap: true,
    assetsInlineLimit: 0,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
}));
