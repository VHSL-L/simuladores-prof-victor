import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: true,
    rolldownOptions: {
      input: {
        platform: "index.html",
        choque: "simulators/choque/index.html",
        ventilacao: "simulators/ventilacao-mecanica/index.html",
      },
    },
  },
});
