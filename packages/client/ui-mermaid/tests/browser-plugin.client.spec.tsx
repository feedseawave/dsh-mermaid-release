// @vitest-environment jsdom
// ui-mermaid browser half on a real cordis Context: the plugin registers the
// MermaidBlock renderer on the conversation's fenceview seat under the
// 'mermaid' language key, and registration disposal rides the plugin fiber
// (HMR safety). The node half is an inert loader seat.

import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it } from 'vitest'
import { SlotRegistry } from '@deepseek-ai/dsh-client-runtime/client'
import { MermaidBlock } from '../src/client/MermaidBlock.tsx'
import { apply, inject } from '../src/client/index.ts'
import { apply as nodeApply } from '../src/index.ts'

async function bench() {
  const ctx = new Context()
  await ctx.plugin(SlotRegistry).await()
  // The fenceview seat is declared by ui-conversation's assistant-step
  // renderer in production; the test root declares it here so the
  // contribution lands.
  ctx.slots.register({
    name: 'root', children: {
      'conversation.chat.fenceview': { kind: 'keyed', scope: 'session' },
    },
  } as never, (() => null) as never)
  const fiber = ctx.plugin({ inject: [...inject], apply })
  await fiber.await()
  return { ctx, fiber }
}

describe('ui-mermaid browser plugin', () => {
  it('registers the MermaidBlock renderer on the fenceview seat under the mermaid key', async () => {
    const b = await bench()
    const entries = b.ctx.slots.entries('conversation.chat.fenceview')
    expect(entries).toHaveLength(1)
    expect(entries[0]?.options).toMatchObject({ key: 'mermaid' })
    expect(entries[0]?.component).toBe(MermaidBlock)
  })

  it('drops the registration when the plugin fiber unloads (HMR safety)', async () => {
    const b = await bench()
    expect(b.ctx.slots.entries('conversation.chat.fenceview')).toHaveLength(1)
    await b.fiber.dispose()
    expect(b.ctx.slots.entries('conversation.chat.fenceview')).toHaveLength(0)
  })
})

describe('ui-mermaid node half', () => {
  // The invariant companion is mounted by the vitest-wide invariant host on
  // every Context this suite creates; its registration is covered there.
  it('the node apply is an inert loader seat', () => {
    expect(() => { nodeApply() }).not.toThrow()
  })
})
