import { defineConfig } from 'vite';

// GitHub Pages serves the site from /<repo>/, not the domain root, so asset
// URLs need that prefix. Locally BASE_PATH is unset and '/' is correct.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  build: {
    target: 'es2022',
    // One entry chunk keeps the single-file inline step trivial and means the
    // page makes exactly two requests before it is playable.
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
