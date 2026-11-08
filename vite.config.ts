import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
    manifest: true,
    rolldownOptions: {
      input: {
        platform: "index.html",
        bls: "simulators/bls/index.html",
        gasometria: "simulators/gasometria/index.html",
        ecg: "simulators/ecg/index.html",
        eletrolitos: "simulators/eletrolitos/index.html",
        choque: "simulators/choque/index.html",
        ventilacao: "simulators/ventilacao-mecanica/index.html",
      },
    },
  },
});
