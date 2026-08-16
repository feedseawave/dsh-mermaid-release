import { copyFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { clientBundle } from '../tsdown.client.ts'

const require = createRequire(import.meta.url)
// The package root as a plain path (tsdown's config bundling keeps
// import.meta.url as a file:// URL, so path arithmetic needs the conversion).
const PACKAGE_ROOT = fileURLToPath(new URL('.', import.meta.url))

export default clientBundle('@dsh-mermaid-renderer/dsh-client-ui-mermaid', ['lib/types/index.js', 'lib/types/invariant.js'], {
  lib: {
    plugins: [{
      // The upstream UMD build (one self-contained script, every diagram
      // type) ships beside the client bundle and is served by the modules
      // node half at /plugins/<id>/mermaid.js; MermaidBlock loads it through
      // one shared <script> element on first use, keeping the library out of
      // every boot path. The build chain owns this copy so consumers of the
      // published artifact never depend on a package script.
      name: 'dsh-copy-mermaid-vendor',
      writeBundle() {
        const umd = require.resolve('mermaid/dist/mermaid.min.js')
        const target = resolve(PACKAGE_ROOT, 'lib/mermaid.js')
        mkdirSync(resolve(PACKAGE_ROOT, 'lib'), { recursive: true })
        copyFileSync(umd, target)
      },
    }],
  },
})
