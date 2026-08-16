/**
 * Mermaid fence plugin, browser half: one fenceview registrant owning the
 * 'mermaid' language key, so settled mermaid fences in assistant markdown
 * render as diagrams instead of the plain code surface. The seat itself is
 * declared and dispatched by ui-conversation's assistant-step renderer; this
 * plugin contributes only its own language.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
export { MermaidBlock } from './MermaidBlock.tsx';
export type { MermaidBlockProps } from './MermaidBlock.tsx';
/** Required services: the slot registry only — no locale seat, no store, no wire. */
export declare const inject: string[];
/**
 * Client plugin body: owns how 'mermaid' fences render inside assistant
 * markdown.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map