import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" so one build serves both the Tauri asset protocol and the static
// web preview at <slug>.hanzo.app.
export default defineConfig({
  plugins: [react()],
  base: "./",
  clearScreen: false,
  server: { port: 1420, strictPort: true },
  build: { target: "es2021", sourcemap: false },
});
