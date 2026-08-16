#!/usr/bin/env node
/**
 * Rewrites the synchronized fork sources into publishable packages:
 * - package names -> @dsh-mermaid scope (web-app becomes dsh-web-app-mermaid)
 * - versions -> 0.0.1-rc.1-mermaid.1
 * - workspace:^ deps -> npm ranges against the published upstream baseline
 * - web-app bundle: npm aliases redirect the four forked deps to our forks,
 *   plus a direct dep on the mermaid plugin
 * - self-name references (tsdown bundle ids, VENDOR_SCRIPT, inject lists)
 * - tsconfig: strip project references (types resolve from node_modules /
 *   the repo paths facade)
 * - cordis.patch.yml plugin rows for forked packages point at fork names
 *
 * Idempotent on the rewritten output. Run after sync.mjs.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('.', import.meta.url))
const MODE = process.argv.includes('--publish') ? 'publish' : 'local'
const SCOPE = '@dsh-mermaid-renderer'
const VERSION = '0.1.0-rc.6-mermaid.10'
const UPSTREAM_VERSION = '0.1.0-rc.6'

/** Upstream name -> fork name for the published forks. */
const RENAME = {
  '@deepseek-ai/dsh-client-ui-primitives': `${SCOPE}/dsh-client-ui-primitives`,
  '@deepseek-ai/dsh-client-ui-conversation': `${SCOPE}/dsh-client-ui-conversation`,
  '@deepseek-ai/dsh-client-modules': `${SCOPE}/dsh-client-modules`,
  '@deepseek-ai/dsh-web-frontend': `${SCOPE}/dsh-web-frontend`,
  '@deepseek-ai/dsh-web-app': `${SCOPE}/dsh-web-app-mermaid`,
  '@deepseek-ai/dsh-client-ui-mermaid': `${SCOPE}/dsh-client-ui-mermaid`,
}

/** Package dir -> upstream name of that package. */
const PKGS = {
  'packages/client/ui-primitives': '@deepseek-ai/dsh-client-ui-primitives',
  'packages/client/ui-conversation': '@deepseek-ai/dsh-client-ui-conversation',
  'packages/client/modules': '@deepseek-ai/dsh-client-modules',
  'packages/client/ui-mermaid': '@deepseek-ai/dsh-client-ui-mermaid',
  'packages/bundle/web-app': '@deepseek-ai/dsh-web-app',
  'apps/web': '@deepseek-ai/dsh-web-frontend',
}

/** npm ranges for the upstream baseline (families share one version). */
function npmRange(name) {
  if (name.startsWith('@deepseek-ai/dsh-')) return `^${UPSTREAM_VERSION}`
  const VENDOR = {
    '@deepseek-ai/cordis': '4.0.1',
    '@deepseek-ai/cordis-plugin-group': '1.0.1',
    '@deepseek-ai/cordis-plugin-loader': '1.0.2',
    '@deepseek-ai/schemastery': '3.18.1',
  }
  if (VENDOR[name]) return `^${VENDOR[name]}`
  throw new Error(`no npm range for ${name}`)
}

const FORKED_UPSTREAM_NAMES = new Set([
  '@deepseek-ai/dsh-client-modules',
  '@deepseek-ai/dsh-client-ui-conversation',
  '@deepseek-ai/dsh-web-frontend',
])

function applyDeps(pkg, { renameMermaid = true } = {}) {
  for (const field of ['dependencies', 'peerDependencies', 'devDependencies']) {
    if (!pkg[field]) continue
    const next = {}
    for (const [name, range] of Object.entries(pkg[field])) {
      if (name === '@deepseek-ai/dsh-client-ui-mermaid' && renameMermaid) {
        // Our own plugin: upstream never published it, so no alias can exist.
        next[RENAME[name]] = MODE === 'local' ? 'workspace:^' : `^${VERSION}`
        continue
      }
      if (name === `${SCOPE}/dsh-client-ui-primitives`) {
        // Never reference the fork primitives package: the browser module
        // table resolves the official name to the shell seed shipped inside
        // the fork web-frontend dist (harness MarkdownText with
        // fenceRenderer), so npm-level peer/deps stay on the official range.
        next['@deepseek-ai/dsh-client-ui-primitives'] = MODE === 'local' ? 'workspace:^' : npmRange('@deepseek-ai/dsh-client-ui-primitives')
        continue
      }
      if (name === '@deepseek-ai/dsh-client-ui-conversation') {
        // Fork sibling: the published upstream conversation lacks the
        // `conversation.chat.fenceview` seat (npm rc.6 is older than the
        // harness tree), so any reference to the official name pulls a second
        // conversation instance into the browser beside the fork row and
        // splits the fenceview seat registry. Every reference — inject lists,
        // peer/dev deps — must name the fork.
        next[RENAME[name]] = MODE === 'local' ? 'workspace:^' : `^${VERSION}`
        continue
      }
      if (name.startsWith(`${SCOPE}/`)) {
        // Already rewritten in an earlier run; still normalize the range to
        // the current mode so a local-then-publish sequence cannot leak
        // `workspace:^` into a published manifest (npm publish does not
        // convert the pnpm protocol).
        next[name] = MODE === 'local' ? 'workspace:^' : `^${VERSION}`
        continue
      }
      if (name.startsWith('@dsh-mermaid/')) {
        // Earlier placeholder scope; map to the final scope under the same
        // package name and normalize the range for the current mode.
        next[`${SCOPE}/${name.slice('@dsh-mermaid/'.length)}`] = MODE === 'local' ? 'workspace:^' : `^${VERSION}`
        continue
      }
      if (name.startsWith('@deepseek-ai/')) {
        // Every upstream-family reference gets the pinned baseline range,
        // whatever range a previous rewrite run or the upstream manifest had.
        next[name] = npmRange(name)
        continue
      }
      next[name] = range
    }
    pkg[field] = next
  }
}

function rewriteManifest(path, upstreamName) {
  const pkg = JSON.parse(readFileSync(path, 'utf8'))
  pkg.name = RENAME[upstreamName]
  pkg.version = VERSION
  pkg.repository = {
    type: 'git',
    url: 'git+https://github.com/dsh-mermaid/dsh-mermaid-release.git',
    directory: path.split(/[\\/]/).slice(1).join('/'),
  }
  const isWebAppBundle = upstreamName === '@deepseek-ai/dsh-web-app'
  applyDeps(pkg)
  if (upstreamName === '@deepseek-ai/dsh-client-ui-mermaid') {
    // The client inject list is a manifest array, not a dependency field:
    // rewrite fork-sibling edges (conversation, primitives) there too so the
    // browser module system prefetches the fork halves, never the official
    // ones (which lack the fenceview seat / MarkdownText fenceRenderer).
    const client = pkg.dsh?.client
    if (client !== undefined && Array.isArray(client.inject)) {
      client.inject = client.inject.map((name) =>
        name === '@deepseek-ai/dsh-client-ui-conversation'
          ? RENAME[name]
          : name,
      )
    }
  }
  if (isWebAppBundle) {
    if (MODE === 'publish') {
      // Published form: the forks are direct dependencies under their own
      // names (a complete top-level install the loader and require.resolve
      // find); upstream-internal references to the upstream names keep
      // resolving to the published upstream packages, which stay unloaded
      // because only our patch rows name plugin entries.
      for (const upstream of FORKED_UPSTREAM_NAMES) {
        delete pkg.dependencies[upstream] // any earlier alias form
        delete pkg.dependencies[RENAME[upstream]]
        pkg.dependencies[RENAME[upstream]] = `^${VERSION}`
      }
      delete pkg.dependencies[`${SCOPE}/dsh-client-ui-mermaid`]
      pkg.dependencies[`${SCOPE}/dsh-client-ui-mermaid`] = `^${VERSION}`
    } else {
      // In-repo form: the workspace provides the forks under their own names.
      for (const upstream of FORKED_UPSTREAM_NAMES) {
        delete pkg.dependencies[upstream]
        pkg.dependencies[RENAME[upstream]] = 'workspace:^'
      }
      pkg.dependencies[`${SCOPE}/dsh-client-ui-mermaid`] = 'workspace:^'
    }
    pkg.description = 'The dsh browser-surface bundle fork that adds mermaid fence rendering (dsh-web-app + dsh-client-ui-mermaid)'
  }
  writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n')
}

function rewriteText(path, upstreamName, replacer) {
  const text = readFileSync(path, 'utf8')
  const next = replacer(text, upstreamName)
  if (next !== text) writeFileSync(path, next)
}

const selfName = (upstreamName) => {
  // Matches the upstream name AND any earlier placeholder-scope spelling of
  // the fork name (sync resets the five archive forks but not ui-mermaid).
  const bare = upstreamName.slice(upstreamName.lastIndexOf('/') + 1)
  return new RegExp(`@(?:deepseek-ai|dsh-mermaid)\\/${bare.replaceAll('.', '\\.')}`, 'g')
}

/** Kept project references per package dir (composite redirect targets). */
const EXPECTED_REFERENCES = {
  'packages/client/ui-primitives': [],
  'packages/client/ui-conversation': ['../ui-primitives'],
  'packages/client/modules': [],
  'packages/client/ui-mermaid': ['../ui-conversation', '../ui-primitives'],
  'packages/bundle/web-app': [],
  'apps/web': [],
  // Build-only sources: vite's oxc transform reads project references and
  // fails on the missing upstream workspaces, so they must be empty.
  'packages/client/web': [],
  'packages/client/web-react': [],
  'packages/client/ui-slots': [],
  'packages/client/ui-attachment': [],
  'packages/client/schema-form': [],
}

/**
 * Rewrites a package tsconfig to the kept references (empty = dropped), so
 * sync-reset and prior rewrite runs cannot drift it.
 */
function cleanReferences(abs, dir, table) {
  const cfgPath = join(abs, 'tsconfig.json')
  const require = createRequire(import.meta.url)
  const ts = require('typescript')
  const parsed = ts.parseConfigFileTextToJson(cfgPath, readFileSync(cfgPath, 'utf8'))
  if (parsed.error) throw new Error(`cannot parse ${cfgPath}: ${parsed.error.messageText}`)
  const cfg = parsed.config
  const kept = table[dir] ?? []
  if (kept.length === 0) delete cfg.references
  else cfg.references = kept.map((path) => ({ path }))
  writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n')
}

for (const [dir, upstreamName] of Object.entries(PKGS)) {
  const abs = join(ROOT, dir)
  rewriteManifest(join(abs, 'package.json'), upstreamName)

  // tsdown bundle ids: the emitted load({id}) must match the published name.
  const tsdown = join(abs, 'tsdown.config.ts')
  if (existsSync(tsdown)) {
    rewriteText(tsdown, upstreamName, (t) => t.replace(selfName(upstreamName), RENAME[upstreamName]))
  }

  // Self-name references in source (plugin URL paths, inject lists, docs).
  const self = selfName(upstreamName)
  const isMermaidPlugin = upstreamName === '@deepseek-ai/dsh-client-ui-mermaid'
  const isWebAppBundle = upstreamName === '@deepseek-ai/dsh-web-app'
  rewriteText(join(abs, 'package.json'), upstreamName, (t) => t.replaceAll(self, RENAME[upstreamName]))
  if (isMermaidPlugin) {
    for (const file of [
      'src/client/index.ts', 'src/client/MermaidBlock.tsx', 'src/index.ts', 'src/invariant.ts',
      'tests/mermaid-block.client.spec.tsx', 'tests/browser-plugin.client.spec.tsx',
    ]) {
      rewriteText(join(abs, file), upstreamName, (t) => t.replaceAll(self, RENAME[upstreamName]))
    }
  }
  if (isWebAppBundle) {
    // Patch rows name the fork packages directly: the loader imports entries
    // by package name, and the forks are direct dependencies installed under
    // their own names at the top level of the profile install.
    rewriteText(join(abs, 'cordis.patch.yml'), upstreamName, (t) => {
      let out = t
      for (const upstream of FORKED_UPSTREAM_NAMES) {
        out = out.replaceAll(`name: '${upstream}'`, `name: '${RENAME[upstream]}'`)
      }
      // Route the web-runtime/startup rows to this fork: the fork's lib
      // resolves the fork web-frontend dist, whose shell seed carries the
      // harness primitives (MarkdownText with fenceRenderer) that
      // ui-conversation/ui-mermaid need. The official web-app would serve the
      // older npm dist without fenceRenderer, silently disabling mermaid.
      out = out.replaceAll("name: '@deepseek-ai/dsh-web-app/startup'", `name: '${RENAME['@deepseek-ai/dsh-web-app']}/startup'`)
      out = out.replaceAll("name: '@deepseek-ai/dsh-web-app'", `name: '${RENAME['@deepseek-ai/dsh-web-app']}'`)
      out = out.replaceAll("name: '@deepseek-ai/dsh-client-ui-mermaid'", `name: '${RENAME['@deepseek-ai/dsh-client-ui-mermaid']}'`)
      return out
    })
  }

  // Project references kept in this repository (each fork resolves its other
  // forks through the composite redirect; everything else resolves from
  // node_modules). Written explicitly on every run so sync-reset and prior
  // rewrite runs cannot drift it.
  cleanReferences(abs, dir, EXPECTED_REFERENCES)
}

// Build-only sources get the same references cleanup (empty lists above) and
// a workspace-linkable version; their own names stay upstream so the shell's
// aliases and manifests resolve them from source.
for (const dir of [
  'packages/client/web', 'packages/client/web-react', 'packages/client/ui-slots',
  'packages/client/ui-attachment', 'packages/client/schema-form',
]) {
  cleanReferences(join(ROOT, dir), dir, EXPECTED_REFERENCES)
  const manifest = join(ROOT, dir, 'package.json')
  const pkg = JSON.parse(readFileSync(manifest, 'utf8'))
  pkg.version = VERSION
  applyDeps(pkg, { renameMermaid: false })
  writeFileSync(manifest, JSON.stringify(pkg, null, 2) + '\n')
  if (dir === 'packages/client/web') {
    // The shell kernel statically registers the module system under this id;
    // it must equal the fork name so the graph row (fork-named patch row)
    // matches and arrival stays a no-op instead of double-registering.
    rewriteText(join(ROOT, dir, 'src/boot.tsx'), '@deepseek-ai/dsh-client-web', (t) => {
      return t.replace(
        "const MODULES_ID = '@deepseek-ai/dsh-client-modules'",
        `const MODULES_ID = '${RENAME['@deepseek-ai/dsh-client-modules']}'`,
      )
    })
  }
}

// Root paths facade: forked packages resolve to their own src (types and
// vite-tsconfig-paths test resolution); everything else resolves from
// node_modules (the published upstream baseline). The upstream vendor/src
// mappings do not exist in this repository.
{
  const base = join(ROOT, 'tsconfig.base.json')
  const require = createRequire(import.meta.url)
  const ts = require('typescript')
  const parsed = ts.parseConfigFileTextToJson(base, readFileSync(base, 'utf8'))
  if (parsed.error) throw new Error(`cannot parse ${base}: ${parsed.error.messageText}`)
  const cfg = parsed.config
  cfg.compilerOptions.paths = {
    '@deepseek-ai/dsh-client-ui-primitives': ['./packages/client/ui-primitives/src'],
    '@deepseek-ai/dsh-client-ui-primitives/invariant': ['./packages/client/ui-primitives/src/invariant.ts'],
    '@deepseek-ai/dsh-client-ui-conversation': ['./packages/client/ui-conversation/src'],
    '@deepseek-ai/dsh-client-ui-conversation/client': ['./packages/client/ui-conversation/src/client'],
    '@deepseek-ai/dsh-client-modules': ['./packages/client/modules/src'],
    '@deepseek-ai/dsh-client-modules/client': ['./packages/client/modules/src/client'],
    '@deepseek-ai/dsh-client-ui-mermaid': ['./packages/client/ui-mermaid/src'],
    '@deepseek-ai/dsh-client-ui-mermaid/client': ['./packages/client/ui-mermaid/src/client'],
  }
  writeFileSync(base, JSON.stringify(cfg, null, 2) + '\n')
}

// The mermaid plugin keeps upstream specifiers in source (seed-table words and
// type-only imports) — nothing to rename there beyond self-name references.
console.log('rewritten 6 packages')
