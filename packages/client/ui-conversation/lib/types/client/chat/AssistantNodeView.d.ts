import type { PropsRenderSlots } from '@deepseek-ai/dsh-client-ui-slots';
import type { ChatNodeViewProps } from '../contract/slots.ts';
/** Streaming, settled, and interrupted Assistant states share one keyed renderer instance. */
export declare const AssistantNodeView: import("react").MemoExoticComponent<({ node, useTurnData, openFile, loadImage, fileMentions, t, renderSlot, }: ChatNodeViewProps<"assistant-step"> & PropsRenderSlots<"conversation.chat.fenceview">) => import("react").JSX.Element>;
//# sourceMappingURL=AssistantNodeView.d.ts.map