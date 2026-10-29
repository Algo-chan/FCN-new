import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_BACKEND_TARGET || "https://fcn-backend.onrender.com",
        changeOrigin: true,
        secure: false
      },
      "/socket.io": {
        target: process.env.VITE_BACKEND_TARGET || "https://fcn-backend.onrender.com",
        changeOrigin: true,
        ws: true
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectRegister: "auto",
      showMaximumFileSizeToCacheInBytesWarning: true,
      cleanupOutdatedCaches: true,
      injectManifest: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"]
},
      manifest: {
        name: "Fast Care",
        short_name: "Fast Care",
        description: "Ethiopia's digital healthcare platform. Book doctors, AI health checks, e-prescriptions. Now live in Dire Dawa.",
        start_url: "/app",
        display: "standalone",
        background_color: "#0D1117",
        theme_color: "#0A7EA4",
        orientation: "portrait",
        lang: "en",
        categories: ["medical", "health", "lifestyle"],
        screenshots: [
          {
            src: "/fcn-brand/png/logo-light@2x.png",
            type: "image/png",
            sizes: "512x512"
          }
        ],
        icons: [
          {
            src: "/fcn-brand/png/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/fcn-brand/png/icon-192-maskable.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "/fcn-brand/png/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/fcn-brand/png/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("framer-motion") || id.includes("lucide-react") || id.includes("clsx") || id.includes("tailwind-merge")) return "vendor-ui";
            if (id.includes("recharts") || id.includes("d3-")) return "vendor-charts";
            if (id.includes("react-hook-form") || id.includes("@hookform") || id.includes("zod")) return "vendor-forms";
            if (id.includes("@tanstack")) return "vendor-query";
            if (id.includes("socket.io") || id.includes("engine.io")) return "vendor-socket";
            if (id.includes("gsap")) return "vendor-gsap";
            if (id.includes("firebase")) return "vendor-firebase";
            if (id.includes("leaflet") || id.includes("react-leaflet")) return "vendor-maps";
            if (id.includes("jspdf") || id.includes("html2canvas")) return "vendor-pdf";
            if (id.includes("date-fns")) return "vendor-date";
            if (id.includes("axios")) return "vendor-http";
            if (id.includes("howler")) return "vendor-audio";
            return "vendor-misc";
          }
        }
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  }
});
