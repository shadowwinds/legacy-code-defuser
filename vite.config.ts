import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' — 相对路径，兼容 GitHub Pages 子路径部署（ADR-0001）
export default defineConfig({
  base: './',
  plugins: [react()],
})
