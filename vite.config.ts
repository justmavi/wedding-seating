import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During local dev the API runs as a separate Express process on :3001.
// Vite proxies /api to it so the frontend can use same-origin relative URLs
// (exactly like in production on Vercel).
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
  build: {
    outDir: "dist",
  },
});
