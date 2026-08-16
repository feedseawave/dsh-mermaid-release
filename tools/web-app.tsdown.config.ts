import { fileURLToPath } from 'node:url'
import { defineConfig } from 'tsdown'

const pkg = fileURLToPath(new URL('../packages/bundle/web-app', import.meta.url))

// Host-face bundle for the web-app fork: packs the tsc-emitted lib/types
// entries into lib/ ESM with every dependency external, mirroring the
// upstream root config's host pass (typertPlugin is a no-op for this package).
export default defineConfig({
  entry: [`${pkg}/lib/types/index.js`, `${pkg}/lib/types/invariant.js`, `${pkg}/lib/types/startup.js`],
  outDir: `${pkg}/lib`,
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  fixedExtension: false,
  dts: false,
  clean: false,
})
