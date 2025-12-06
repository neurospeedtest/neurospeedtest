import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Safely stringify the env var, fallback to empty string if undefined to prevent build/runtime errors
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ""),
  },
});