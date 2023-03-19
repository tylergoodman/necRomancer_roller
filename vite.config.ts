import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/necRomancer_roller/",
  build: {
    rollupOptions: {
      external: /^lit/,
    },
  },
});
