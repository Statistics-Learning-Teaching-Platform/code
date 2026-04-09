import { defineConfig } from 'vite';

// Use relative asset paths so the site works on GitHub Pages
// whether it is published from a user page or a project page.
export default defineConfig({
  base: './',
});
