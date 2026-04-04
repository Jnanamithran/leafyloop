// client/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
    middlewareMode: false,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor:        ["react", "react-dom", "react-router-dom"],
          state:         ["@reduxjs/toolkit", "react-redux", "redux-persist"],
          query:         ["@tanstack/react-query"],
          motion:        ["framer-motion"],
          forms:         ["react-hook-form", "@hookform/resolvers", "zod"],
        },
      },
    },
  },
});
