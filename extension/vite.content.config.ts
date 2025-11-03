import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// Dedicated build to produce a single classic (non-module) content script
export default defineConfig(() => {
  return {
    publicDir: 'public',
    build: {
      outDir: 'dist',
      emptyOutDir: false, // keep background/popup build output
      sourcemap: true,
      minify: false,
      rollupOptions: {
        input: resolve(__dirname, 'src/content-script.ts'),
        output: {
          entryFileNames: 'content-script.js',
          format: 'iife',
          // Ensure a single-file bundle with no imports
          inlineDynamicImports: true
        }
      }
    }
  }
})


