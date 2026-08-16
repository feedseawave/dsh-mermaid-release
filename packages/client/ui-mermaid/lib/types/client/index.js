import { MermaidBlock } from "./MermaidBlock.js";
export { MermaidBlock } from "./MermaidBlock.js";
/** Required services: the slot registry only — no locale seat, no store, no wire. */
export const inject = ['slots'];
/**
 * Client plugin body: owns how 'mermaid' fences render inside assistant
 * markdown.
 * @param ctx - client root context.
 */
export function apply(ctx) {
    ctx.slots.inject('conversation.chat.fenceview', () => ctx.slots.register({
        name: 'conversation.chat.fenceview',
        key: 'mermaid',
    }, MermaidBlock));
}
//# sourceMappingURL=index.js.map