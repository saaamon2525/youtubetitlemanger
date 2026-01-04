import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['path', 'fs', 'stream', 'zlib', 'util'],
      globals: {
        process: true,
      },
      protocolImports: true,
    }),
  ],
  optimizeDeps: {
    exclude: ['kuromoji'],
  },
  base: '/youtubetitlemanger/',
})
