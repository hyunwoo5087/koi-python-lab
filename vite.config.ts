import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages project site is served from https://<user>.github.io/koi-python-lab/,
// so assets need that prefix. Override with BASE_PATH=/ for a custom domain.
const base = process.env.BASE_PATH ?? "/koi-python-lab/";

export default defineConfig({
  base,
  plugins: [react()],
  server: { host: "0.0.0.0", port: 5173 },
  preview: { host: "0.0.0.0", port: 4173 },
});
