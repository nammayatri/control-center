import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Default to control-center.moving.tech to match api.ts
  const target = env.VITE_API_URL || "https://control-center.moving.tech";
  // Backend server URL for metrics/master-conversion APIs (dev only)
  const backendUrl = env.VITE_BACKEND_URL || "http://localhost:3001";
  const isInteg = target.includes("integ");

  const rewrite = (path: string) =>
    isInteg ? path.replace(/^\/api/, "/api/dev") : path;

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // React and core libraries
            "react-vendor": ["react", "react-dom", "react-router-dom"],
            // UI component libraries
            "radix-ui": [
              "@radix-ui/react-accordion",
              "@radix-ui/react-alert-dialog",
              "@radix-ui/react-avatar",
              "@radix-ui/react-checkbox",
              "@radix-ui/react-collapsible",
              "@radix-ui/react-dialog",
              "@radix-ui/react-dropdown-menu",
              "@radix-ui/react-label",
              "@radix-ui/react-popover",
              "@radix-ui/react-scroll-area",
              "@radix-ui/react-select",
              "@radix-ui/react-separator",
              "@radix-ui/react-slot",
              "@radix-ui/react-switch",
              "@radix-ui/react-tabs",
              "@radix-ui/react-tooltip",
            ],
            // Data visualization and maps
            "charts-maps": ["recharts", "leaflet", "react-leaflet"],
            // State management and utilities
            utils: [
              "@tanstack/react-query",
              "@tanstack/react-router",
              "axios",
              "zustand",
              "date-fns",
            ],
            // Other UI utilities
            "ui-utils": [
              "class-variance-authority",
              "clsx",
              "cmdk",
              "lucide-react",
              "react-day-picker",
              "sonner",
              "tailwind-merge",
            ],
          },
        },
      },
      chunkSizeWarningLimit: 1000, // Increase limit to 1MB
    },
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
        // Proxy Admin API requests (including master-conversion) to backend server
        // Note: This proxy is ONLY used in development. In production, the frontend
        // makes direct API calls using URLs from src/services/api.ts
        // Note: This should come AFTER /api/bap and /api/bpp to avoid conflicts
        "/api/metrics": {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
        "/api/master-conversion": {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
