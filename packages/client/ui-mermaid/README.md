# @deepseek-ai/dsh-client-ui-mermaid

English | [中文](README.zh.md)

Mermaid diagram plugin, browser half: one registrant on the `conversation.chat.fenceview` seat owning the `mermaid` language key. A settled `mermaid` fence in assistant markdown renders as an SVG diagram inside the shared CodeBlock chrome (language banner and copy button stay, so the authored source remains one click away); streaming fences, parse failures, and the lazy-loading window keep the plain code surface. The seat itself is declared and dispatched by ui-conversation's assistant-step renderer, which offers every settled fence to the fenceview registry by language tag; an unclaimed key keeps the built-in CodeBlock, so this plugin is purely additive.

The mermaid bundle is lazily imported on first use — it is far too large for the boot bundle, so the build splits it into its own chunk that loads when the first diagram appears. Rendering runs under mermaid's strict security level: model-authored diagram source is untrusted, so links are sanitized and scripts or click payloads never enter the figure; the SVG string is injected through the same sanctioned innerHTML path as the shiki highlighter.

The `/client` exports are the plugin body (`apply`/`inject`) and the `MermaidBlock` component.

## Model Experience

None, as the plugin is browser-side diagram presentation; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **No dark-mode theme switching** — the figure uses mermaid's default theme; adapting it to the active `ui-theme` mode would re-initialize or re-render on theme change.
- **No interaction** — strict security level drops click/link payloads by design; mermaid's own interactivity is out of scope.
- **jsdom gap** — malformed diagrams that make mermaid's strict pipeline hang instead of reject keep the loading surface forever in jsdom-only tests; real browsers are pinned by the `mermaid-rendering` web e2e scenario.
