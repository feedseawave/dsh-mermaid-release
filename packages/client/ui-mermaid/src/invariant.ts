/**
 * Package-owned invariant companion for `@dsh-mermaid-renderer/dsh-client-ui-mermaid`.
 * @module @dsh-mermaid-renderer/dsh-client-ui-mermaid/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@dsh-mermaid-renderer/dsh-client-ui-mermaid'

/** Cordis companion plugin name. */
export const name = 'client-ui-mermaid-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: a single fenceview registration whose disposal is
 * proven by the HMR-safety spec — the plugin owns no store (the rendered SVG
 * is component-local state), emits no cordis events, and holds no
 * cross-plugin mutable state.
 */
const install: InvariantInstaller = () => {}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */
