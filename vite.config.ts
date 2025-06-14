import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    open: true,
    // proxy: {
    //   "/api": {
    //     target: "http://localhost:5000", // ✅ backend server
    //     changeOrigin: true,
    //     secure: false,
    //   },
    // },
  },
});
