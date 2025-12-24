import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.VITE_API_URL || "https://dashboard.integ.moving.tech";
  const isInteg = target.includes("integ");

  const rewrite = (path: string) =>
    isInteg ? path.replace(/^\/api/, "/api/dev") : path;

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Proxy BAP API requests
        "/api/bap": {
          target: target,
          changeOrigin: true,
          secure: true,
          rewrite: rewrite,
        },
        // Proxy BPP API requests
        "/api/bpp": {
          target: target,
          changeOrigin: true,
          secure: true,
          rewrite: rewrite,
        },
        // Proxy Admin API requests (including master-conversion) to local backend in dev
        // Note: This should come AFTER /api/bap and /api/bpp to avoid conflicts
        "/api/metrics": {
          target: target,
          changeOrigin: true,
          secure: false,
        },
        "/api/master-conversion": {
          target: target,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
