// @vitest-environment jsdom
// MermaidBlock: renders one settled mermaid fence as an SVG figure inside the
// shared CodeBlock chrome (banner + copy stay); parse failures and loading
// keep the plain CodeBlock surface; the vendor script is injected once and
// shared; the strict security level keeps model-authored diagrams inert.

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { MermaidBlock } from '../src/client/MermaidBlock.tsx'
import type { MermaidBlockProps } from '../src/client/MermaidBlock.tsx'

// mermaid measures label text through SVGElement.getBBox, which jsdom does
// not implement. The stub returns per-character estimates so the REAL
// mermaid pipeline (parse, layout, SVG generation) runs un-mocked here;
// true browser measurement is pinned by the web e2e lane.
beforeAll(() => {
  Object.defineProperty(SVGElement.prototype, 'getBBox', {
    configurable: true,
    value: function () {
      const text = (this as Element).textContent ?? ''
      return { x: 0, y: 0, width: text.length * 8, height: 16 }
    },
  })
})

// Preinstall the real mermaid library as the vendor-script global, exactly
// what the UMD script exposes in the browser; the block then skips injection.
beforeAll(async () => {
  window.mermaid = (await import('mermaid')).default
})

afterEach(() => {
  cleanup()
  // The shared script-loading promise caches per module instance; reset it
  // so the injection test starts from a cold table.
  vi.resetModules()
})

function renderBlock(code: string, lang = 'mermaid') {
  return render(<MermaidBlock {...({ lang, code } as MermaidBlockProps)} />)
}

describe('MermaidBlock', () => {
  it('renders a valid flowchart into an svg inside the CodeBlock chrome', async () => {
    const view = renderBlock('graph TD;\nA-->B;\n')
    await waitFor(() => {
      expect(view.container.querySelector('svg')).not.toBeNull()
    })
    // The figure keeps the shared chrome: language banner and copy button.
    expect(screen.getByText('mermaid')).toBeTruthy()
    expect(screen.getByRole('button', { name: '复制' })).toBeTruthy()
    expect(view.container.querySelector('pre')).toBeNull()
  })

  it('falls back to the plain CodeBlock surface for invalid mermaid', async () => {
    const view = renderBlock('this is not mermaid at all ???')
    // The rejected parse settles back on the code surface with the source.
    await waitFor(() => {
      expect(view.container.querySelector('pre code')?.textContent).toContain('this is not mermaid at all ???')
    })
    expect(screen.getByText('mermaid')).toBeTruthy()
  })

  it('keeps the plain surface while the vendor script has not arrived', () => {
    delete window.mermaid
    const view = renderBlock('graph TD;\nA-->B;\n')
    // Before the injected script's load event fires, the source stays visible.
    expect(view.container.querySelector('pre code')?.textContent).toContain('graph TD;')
    // Exactly one shared script element is injected, pointing at the vendor endpoint.
    const scripts = Array.from(document.querySelectorAll('script')).filter(el => el.src.includes('/plugins/@dsh-mermaid-renderer/dsh-client-ui-mermaid/mermaid.js'))
    expect(scripts).toHaveLength(1)
  })

  it('renders once the injected vendor script fires its load event', async () => {
    delete window.mermaid
    const view = renderBlock('graph TD;\nA-->B;\n')
    // Simulate the vendor script arriving: install the global, fire onload.
    window.mermaid = (await import('mermaid')).default
    const scripts = Array.from(document.querySelectorAll('script')).filter(el => el.src.includes('mermaid.js'))
    scripts.forEach(script => script.dispatchEvent(new Event('load')))
    await waitFor(() => {
      expect(view.container.querySelector('svg')).not.toBeNull()
    })
  })

  it('never injects model-authored HTML or scripts when the diagram fails to render', async () => {
    // Model-authored diagram source is untrusted. Under jsdom these payloads
    // make mermaid's strict pipeline hang rather than reject, so this test
    // pins the security-relevant half: no SVG figure ever appears, no raw
    // HTML or script enters the DOM, and the authored source stays visible
    // as plain text. True browser strict-mode rendering is pinned by the web
    // e2e lane (mermaid-rendering scenario).
    const malicious = [
      'graph TD;',
      'A["<img src=x onerror=alert(1)><script>alert(1)</script>"] --> B',
      'A -->|javascript:alert(1)| C',
    ].join('\n')
    const view = renderBlock(malicious)
    // Give a settling pipeline every chance to land a figure.
    await new Promise((resolve) => { setTimeout(resolve, 500) })
    expect(view.container.querySelector('svg')).toBeNull()
    expect(view.container.querySelector('img')).toBeNull()
    expect(view.container.querySelector('script')).toBeNull()
    expect(view.container.querySelector('pre code')?.textContent).toContain('<script>alert(1)</script>')
  })
})
