import { defineConfig } from "vite";

export default defineConfig({
  root: ".", // Current directory
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: "./index.html",
      },
    },
  },
  server: {
    port: 3000,
    open: true, // Automatically open browser
  },
  esbuild: {
    target: "es2020",
  },
});
