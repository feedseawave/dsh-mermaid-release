//#region lib/types/invariant.js
/**
* Package-owned invariant companion for `@dsh-mermaid-renderer/dsh-client-ui-mermaid`.
* @module @dsh-mermaid-renderer/dsh-client-ui-mermaid/invariant
*/
const PACKAGE_NAME = "@dsh-mermaid-renderer/dsh-client-ui-mermaid";
/** Cordis companion plugin name. */
const name = "client-ui-mermaid-invariant";
/** Service required before the companion can reserve package ownership. */
const inject = ["invariants"];
/**
* No runtime invariant: a single fenceview registration whose disposal is
* proven by the HMR-safety spec — the plugin owns no store (the rendered SVG
* is component-local state), emits no cordis events, and holds no
* cross-plugin mutable state.
*/
const install = () => {};
/**
* Register this package's invariant companion.
* @param ctx - Cordis context carrying the invariant service.
* @returns the installed registration's disposer after setup succeeds.
*/
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
