import { defineConfig } from "tsdown";

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["esm"],
    target: "node22",
    platform: "node",
    outDir: "dist",
    clean: true,
    sourcemap: true,
    minify: false,
});
