import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on all network interfaces so other devices (phone, tablet,
    // laptop on the same Wi-Fi) can open the dev server via this PC's IP.
    host: true,
    port: 5173,
    strictPort: true,
    // Proxy API paths to the backend, so the browser talks to the same
    // origin and other devices don't need to know the PC's IP for the API.
    proxy: {
      "/job-vacancies": "http://127.0.0.1:8000",
      "/companies": "http://127.0.0.1:8000",
      "/districts": "http://127.0.0.1:8000",
    },
  },
});
