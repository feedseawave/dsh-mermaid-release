/**
 * MermaidBlock: renders one settled mermaid fence as an SVG figure inside
 * the shared CodeBlock chrome (language banner + copy stay, so the authored
 * source remains accessible). The mermaid bundle is a package-owned vendor
 * script (`lib/mermaid.js`, the upstream UMD build) served beside this
 * plugin's client bundle at `/plugins/<id>/mermaid.js`; the block injects one
 * shared <script> element on first use, so the multi-megabyte library stays
 * out of every boot path until the first diagram appears. The strict
 * security level keeps model-authored diagrams inert: links are sanitized,
 * scripts and click payloads are dropped. Parse failures and the in-flight
 * load keep the plain CodeBlock surface.
 */
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { Mermaid } from 'mermaid';
export type MermaidBlockProps = PropsRuntime<'conversation.chat.fenceview'>;
declare global {
    interface Window {
        mermaid?: Mermaid | undefined;
    }
}
/**
 * The fenceview renderer for the 'mermaid' language key.
 * @param props - The fenceview owner share: normalized language and source.
 */
export declare function MermaidBlock({ lang, code }: MermaidBlockProps): import("react").JSX.Element;
//# sourceMappingURL=MermaidBlock.d.ts.map