import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react()],
    resolve: {
        // The widget gets React from the Mendix app, so it has no React of its own to resolve.
        dedupe: ["react", "react-dom"],
        alias: {
            // The real module is provided by the Mendix client at runtime.
            "mendix/filters/builders": fileURLToPath(new URL("./src/mendix-mock/builders.ts", import.meta.url))
        }
    }
});
