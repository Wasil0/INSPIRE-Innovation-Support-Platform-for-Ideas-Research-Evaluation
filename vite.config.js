import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// 1. Import 'path' module
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // 2. Add the resolve block
  resolve: {
    alias: {
      // Configure the path alias to match your jsconfig.json
      "@": path.resolve(__dirname, "./src"),
    },
  },
})