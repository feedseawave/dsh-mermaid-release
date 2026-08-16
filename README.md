# dsh-mermaid-release

Mermaid diagram rendering for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH). The packages below are forks of the DSH web UI packages (the npm releases lack the mermaid pieces) and are published under the `@dsh-mermaid-renderer` scope.

## Packages

- `@dsh-mermaid-renderer/dsh-web-app-mermaid` — bundle patch, the consumer entry point
- `@dsh-mermaid-renderer/dsh-client-modules`
- `@dsh-mermaid-renderer/dsh-client-ui-conversation`
- `@dsh-mermaid-renderer/dsh-client-ui-mermaid`
- `@dsh-mermaid-renderer/dsh-web-frontend`

## Usage

In a dsh profile directory (e.g. `.dsh-home/profiles/<name>`):

```bash
pnpm add @dsh-mermaid-renderer/dsh-web-app-mermaid@0.1.0-rc.6-mermaid.10
```

profile `package.json`:

```jsonc
{
  "dependencies": {
    "@deepseek-ai/dsh-base": "0.1.0-rc.6",
    "@dsh-mermaid-renderer/dsh-web-app-mermaid": "0.1.0-rc.6-mermaid.10"
  }
}
```

> The dsh plugin ecosystem relies on `peerDependencies`; the profile's `pnpm-workspace.yaml` needs `autoInstallPeers: true` (pnpm 10/11 default to false).

After that, ```` ```mermaid ```` fences in assistant messages render as SVG; invalid mermaid source stays as a code block.
