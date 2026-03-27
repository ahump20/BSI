import { defineConfig } from "vite";

export default defineConfig({
  base: "/games/sandlot-sluggers/",
  publicDir: "public",
  build: {
    outDir: "../../public/games/sandlot-sluggers",
    emptyOutDir: true,
    sourcemap: true,
    target: "es2020",
  },
  server: {
    port: 5176,
    strictPort: true,
    host: true,
    proxy: {
      "/api": {
        target: "https://blazesportsintel.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
