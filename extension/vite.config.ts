import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig(() => {
  return {
    publicDir: 'public',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: true,
      minify: false, // Disable minification to avoid issues with extension code
      rollupOptions: {
        input: {
          popup: resolve(__dirname, 'src/popup/index.html'),
          background: resolve(__dirname, 'src/background.ts')
        },
        output: {
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name === 'background') {
              return 'background.js'
            }
            return '[name].js'
          },
          format: 'es', // Keep ES format
          chunkFileNames: 'chunks/[name]-[hash].js',
          inlineDynamicImports: false
        }
      }
    }
  }
})
