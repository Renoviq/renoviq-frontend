import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // Where `npm run dev` forwards /api and the Google sign-in routes. In production nginx does this.
  // Only /auth/google is forwarded: the app's own sign-in page is at /auth.
  const api = loadEnv(mode, __dirname, "").VITE_DEV_API || "http://localhost:3000";
  return {
    plugins: [react(), runtimeErrorOverlay(), themePlugin()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@shared": path.resolve(__dirname, "shared"),
      },
    },
    build: {
      outDir: path.resolve(__dirname, "dist"),
      emptyOutDir: true,
    },
    server: {
      proxy: {
        "/api": { target: api, changeOrigin: true, secure: false },
        "/auth/google": { target: api, changeOrigin: true, secure: false },
      },
    },
  };
});
