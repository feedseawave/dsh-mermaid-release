#!/usr/bin/env node
/**
 * Synchronizes the forked packages in this release repository from an
 * upstream deepseek-harness checkout at a pinned commit, then replays the
 * per-package patches in patches/. Each fork keeps the upstream relative
 * layout (packages/client/<pkg>, apps/web) so upstream-relative imports and
 * build configs stay valid; only package manifests (names, dependencies) are
 * rewritten by a later step.
 *
 * Idempotent: re-running against the same upstream commit is a no-op
 * (patches already applied are detected via `git apply --check --reverse`).
 *
 * Usage:
 *   node sync.mjs [--upstream <path>] [--commit <sha>]
 */
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('.', import.meta.url))
const args = process.argv.slice(2)
const opt = (name, fallback) => {
  const i = args.indexOf(name)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}
const UPSTREAM = opt('--upstream', 'E:\\projects\\harness')
const COMMIT = opt('--commit', '47f943859b')

/** Upstream dir -> fork dir inside this repository (same relative layout). */
const SOURCES = {
  'packages/client/ui-primitives': 'ui-primitives.patch',
  'packages/client/ui-conversation': 'ui-conversation.patch',
  'packages/client/modules': 'modules.patch',
  'packages/bundle/web-app': 'web-app.patch',
  'apps/web': null,
  // Build-only sources the web shell's vite aliases compile from source
  // (never published): seed/platform packages the shell bakes.
  'packages/client/web': null,
  'packages/client/web-react': null,
  'packages/client/ui-slots': null,
  'packages/client/ui-attachment': null,
  'packages/client/schema-form': null,
}

const TMP = join(ROOT, '.sync-tmp')

function run(cmd, argv, opts = {}) {
  return execFileSync(cmd, argv, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], ...opts })
}

function gitApply(argv) {
  try {
    run('git', ['apply', ...argv], { cwd: ROOT })
  } catch (err) {
    console.error(err.stderr ?? err.message)
    throw err
  }
}

rmSync(TMP, { recursive: true, force: true })
mkdirSync(TMP, { recursive: true })

for (const [upstreamDir, patchName] of Object.entries(SOURCES)) {
  const tar = join(TMP, `${upstreamDir.replaceAll('/', '__')}.tar`)
  run('git', ['-C', UPSTREAM, 'archive', '--format=tar', '-o', tar, COMMIT, upstreamDir], {
    // git archive must run with the upstream checkout as cwd context
    cwd: UPSTREAM,
  })
  run('tar', ['-xf', tar.split(/[\\/]/).pop(), '-C', '.'], { cwd: TMP })
  const src = join(TMP, upstreamDir)
  const forkDir = upstreamDir
  const dst = join(ROOT, forkDir)
  rmSync(dst, { recursive: true, force: true })
  mkdirSync(join(dst, '..'), { recursive: true })
  cpSync(src, dst, { recursive: true })
  if (patchName) {
    // The archive is the pinned upstream commit, so replaying the patch onto
    // the fresh copy always succeeds; idempotency is "same inputs, same
    // outputs", not "skip already applied".
    gitApply(['-p1', join(ROOT, 'patches', patchName)])
    console.log(`applied ${patchName} -> ${forkDir}`)
  }
}

rmSync(TMP, { recursive: true, force: true })
console.log(`synced 5 forks from ${COMMIT}`)
