/**
 * The barebones overlay is pure bundle metadata: it must parse as a patch list
 * and disable the expected base rows without adding runtime code.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import * as yaml from 'js-yaml'
import { entryListSchema } from '@deepseek-ai/cordis-plugin-include'

describe('dsh-base-barebones bundle', () => {
  it('declares a parseable patch list that disables bundled DeepSeek egress defaults', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const manifest = JSON.parse(
      readFileSync(resolve(root, 'package.json'), 'utf8'),
    ) as {
      dependencies?: Record<string, string>
      dsh?: { bundle?: { patch?: string } }
    }
    expect(manifest.dsh?.bundle?.patch).toBe('./cordis.patch.yml')
    expect(manifest.dependencies).toEqual({ '@deepseek-ai/dsh-base': 'workspace:^' })
    const parsed = yaml.load(
      readFileSync(resolve(root, manifest.dsh.bundle.patch), 'utf8'),
      { schema: entryListSchema },
    )
    expect(Array.isArray(parsed)).toBe(true)
    const rows = parsed as { id?: string; disabled?: boolean; config?: Record<string, unknown> }[]
    expect(rows.map(row => row.id)).toEqual([
      'session-log-deepseek',
      'plugin-package-inventory-deepseek',
      'session-title-llm',
      'session-telemetry-otel',
      'llm-deepseek',
      'agent-default-model',
      'web',
      'web-search-deepseek',
      'tool-web',
    ])
    for (const id of [
      'session-log-deepseek',
      'plugin-package-inventory-deepseek',
      'session-title-llm',
      'session-telemetry-otel',
      'llm-deepseek',
      'web-search-deepseek',
    ] as const) {
      expect(rows.find(row => row.id === id)?.disabled).toBe(true)
    }
    expect(rows.find(row => row.id === 'agent-default-model')?.config).toEqual({
      provider: 'configure-provider',
      model: 'configure-model',
    })
    expect(rows.find(row => row.id === 'web')?.config).toEqual({ fetchProvider: 'http' })
    expect(rows.find(row => row.id === 'tool-web')?.config).toEqual({ search: false, fetch: true })
  })
})
