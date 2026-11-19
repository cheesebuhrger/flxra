import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Class names come from the file's basename, so two CSS modules with the
// same name in different folders would collide in styles.css.
const cssModuleNames = new Map<string, string>();

export default defineConfig({
  plugins: [react()],
  css: {
    modules: {
      // Stable, readable class names: Disclosure.module.css → .flxra-Disclosure-<class>
      generateScopedName: (local, file) => {
        const name = file.split("/").pop()!.replace(/\.module\.css$/, "");
        const seen = cssModuleNames.get(name);
        if (seen && seen !== file) throw new Error(`Two CSS modules named ${name}: ${seen} and ${file}`);
        cssModuleNames.set(name, file);
        return `flxra-${name}-${local}`;
      },
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
