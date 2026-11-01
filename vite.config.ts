import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
   plugins: [vue(), tailwindcss()],
  base: process.env.VITE_BASE ?? (process.env.GITHUB_ACTIONS === 'true' ? '/dnd5v/' : '/'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
