import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const proxy = { "/api": "http://127.0.0.1:4310" };

export default defineConfig({
  plugins: [react()],
  base: "./",
  define: {
    __BUILD_ID__: JSON.stringify(
      process.env.GITHUB_SHA?.slice(0, 8) ?? "local",
    ),
  },
  server: { proxy },
  preview: { proxy },
  build: { sourcemap: true },
});
