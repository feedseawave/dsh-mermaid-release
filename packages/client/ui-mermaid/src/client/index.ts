/**
 * Mermaid fence plugin, browser half: one fenceview registrant owning the
 * 'mermaid' language key, so settled mermaid fences in assistant markdown
 * render as diagrams instead of the plain code surface. The seat itself is
 * declared and dispatched by ui-conversation's assistant-step renderer; this
 * plugin contributes only its own language.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the ui-conversation SlotMap merge (the fenceview seat).
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { MermaidBlock } from './MermaidBlock.tsx'

export { MermaidBlock } from './MermaidBlock.tsx'
export type { MermaidBlockProps } from './MermaidBlock.tsx'

/** Required services: the slot registry only — no locale seat, no store, no wire. */
export const inject = ['slots']

/**
 * Client plugin body: owns how 'mermaid' fences render inside assistant
 * markdown.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.slots.inject('conversation.chat.fenceview', () => ctx.slots.register({
    name: 'conversation.chat.fenceview',
    key: 'mermaid',
  }, MermaidBlock))
}
