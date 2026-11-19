import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  css: {
    modules: {
      // Stable, readable class names: Disclosure.module.css → .flxra-Disclosure-<class>
      generateScopedName: (local, file) =>
        `flxra-${file.split("/").pop()!.replace(/\.module\.css$/, "")}-${local}`,
    },
  },
  build: {
    // The build script clears dist first; leaving it alone here lets the
    // watchers (vite and tsc) write into the same folder in dev.
    emptyOutDir: false,
    cssCodeSplit: false,
    lib: { entry: "src/index.ts", formats: ["es"], cssFileName: "styles" },
    rollupOptions: {
      external: [/^react($|\/)/, /^react-dom($|\/)/],
      // One output file per source file, so "use client" stays on exactly
      // the components that declare it, and consumers can tree-shake.
      output: { preserveModules: true, preserveModulesRoot: "src", entryFileNames: "[name].js" },
    },
  },
});
