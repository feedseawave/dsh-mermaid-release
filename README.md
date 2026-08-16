# dsh-mermaid-release

Mermaid diagram rendering for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH). This repository forks the web packages DSH needs for mermaid support and publishes them under the `@dsh-mermaid-renderer` scope, so any dsh profile gains mermaid rendering by adding a single package.

## Why the fork

The published `@deepseek-ai/dsh-*` packages (`0.1.0-rc.6`) lag behind the harness source tree and lack the pieces the mermaid pipeline needs:

| Upstream package (npm rc.6) | Missing capability | Fork |
|---|---|---|
| `dsh-client-ui-conversation` | no `conversation.chat.fenceview` seat | `@dsh-mermaid-renderer/dsh-client-ui-conversation` |
| `dsh-client-ui-mermaid` | not published on npm (E404) | `@dsh-mermaid-renderer/dsh-client-ui-mermaid` |
| `dsh-client-modules` | `serveBundle` does not serve `/mermaid.js` | `@dsh-mermaid-renderer/dsh-client-modules` |
| `dsh-web-frontend` | shell seed lacks `fenceRenderer` (primitives MarkdownText) | `@dsh-mermaid-renderer/dsh-web-frontend` |
| `dsh-web-app` (bundle) | patch must route the web-runtime row to the fork | `@dsh-mermaid-renderer/dsh-web-app-mermaid` |

`@deepseek-ai/dsh-client-ui-primitives` is **not** forked: the browser module table resolves the official name to the shell seed shipped inside the fork web-frontend dist (harness build, with `fenceRenderer`).

## Packages (current version `0.1.0-rc.6-mermaid.10`)

- `@dsh-mermaid-renderer/dsh-web-app-mermaid` (consumer entry point, bundle patch)
- `@dsh-mermaid-renderer/dsh-client-modules`
- `@dsh-mermaid-renderer/dsh-client-ui-conversation`
- `@dsh-mermaid-renderer/dsh-client-ui-mermaid`
- `@dsh-mermaid-renderer/dsh-web-frontend`

## Usage

In a dsh profile directory (e.g. `.dsh-home/profiles/<name>`):

```bash
pnpm add @dsh-mermaid-renderer/dsh-web-app-mermaid@0.1.0-rc.6-mermaid.10
```

profile `package.json` (bundle replaces the official web-app):

```jsonc
{
  "dependencies": {
    "@deepseek-ai/dsh-base": "0.1.0-rc.6",
    "@dsh-mermaid-renderer/dsh-web-app-mermaid": "0.1.0-rc.6-mermaid.10"
  }
}
```

> The dsh plugin ecosystem relies heavily on `peerDependencies`; the profile's
> `pnpm-workspace.yaml` needs `autoInstallPeers: true` (pnpm 10/11 default to
> false, otherwise startup fails with missing packages).

After that, ```` ```mermaid ```` fences in assistant messages render as SVG;
invalid mermaid source stays as a code block.

## Verification

The consumer environment lives in `consumer-test/.dsh-home/profiles/my/` (its `.npmrc` uses npmmirror because this machine cannot reach npmjs directly).

```bash
cd consumer-test
DSH_HOME="$(pwd)/.dsh-home" ./node_modules/.bin/dsh --profile my   # serves :3080
```

Open http://localhost:3080, dismiss the welcome dialog, expand "未分组" (Uncategorized), open the seed session (`mermaid-e2e-seed` under `consumer-test/.dsh-home/sessions/`) and confirm the mermaid flowchart renders as SVG, the invalid fence stays as source, and the console is free of errors.

Seed session format (`dsh-session-persistence-jsonl`):
- layout `sessions/<projectKey(cwd)>/<id>/session.jsonl.zstd`
- zstd **two frames**: one for the header line, one for the event batch
- the header must include `delegationDepth` or the session is silently skipped

## Notes

- `lib/` and `apps/web/dist/` are build artifacts (the local tsc pipeline is unavailable; they are reused from prior release artifacts) and are committed so the repo can be published as-is.
- TODO: `pnpm approve-builds` (native modules such as node-pty are blocked by pnpm 11's build-script policy).
