import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'
import { standardDecoratorPlugin, vitestExecArgv } from './vitest.shared.ts'

// Resolution facade: the repo tsconfig.base.json paths map (fork packages ->
// their own src) must win over package exports so tests never load a second
// copy of a forked package from lib/.
const pathsPlugin = () => tsconfigPaths({ projects: ['./tsconfig.base.json'] })

export default defineConfig({
  plugins: [pathsPlugin(), standardDecoratorPlugin()],
  test: {
    setupFiles: ['./scripts/test-invariants.ts'],
    include: [
      'packages/client/ui-primitives/tests/**/*.client.spec.{ts,tsx}',
      'packages/client/ui-conversation/tests/fenceview.client.spec.tsx',
      'packages/client/modules/tests/node-half.client.spec.ts',
      'packages/client/ui-mermaid/tests/mermaid-block.client.spec.tsx',
    ],
    // Requires the runtime/locale source ecosystem (browser-plugin) or the
    // host spine (host): verified in the upstream workspace; the published
    // artifacts are exercised end to end by the consumer install gate.
    exclude: [
      '**/browser-plugin.client.spec.tsx',
      '**/host.client.spec.ts',
    ],
    pool: 'forks',
    execArgv: vitestExecArgv,
  },
})
