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
import { composeEntries } from '@deepseek-ai/dsh-app-boot'

function bundlePatches(root: string, relativePath: string): Record<string, unknown>[] {
  const parsed = yaml.load(readFileSync(resolve(root, relativePath), 'utf8'), { schema: entryListSchema })
  if (!Array.isArray(parsed)) throw new TypeError(`${relativePath} must parse to a patch list`)
  return parsed as Record<string, unknown>[]
}

function bundleRows(root: string, relativePath: string): { id?: string; disabled?: boolean; config?: Record<string, unknown> }[] {
  return bundlePatches(root, relativePath).flatMap(entry => {
    if ('insert' in entry) return (entry as { insert?: { id?: string; disabled?: boolean; config?: Record<string, unknown> }[] }).insert ?? []
    return [entry as { id?: string; disabled?: boolean; config?: Record<string, unknown> }]
  })
}

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
    const patchPath = manifest.dsh?.bundle?.patch
    if (patchPath === undefined) throw new Error('bundle patch manifest field is required')
    const parsed = yaml.load(
      readFileSync(resolve(root, patchPath), 'utf8'),
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

  it('overrides the composed base rows into a no-default-model, fetch-only profile surface', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const composedRows = composeEntries([
      bundlePatches(root, '../base/cordis.patch.yml'),
      bundlePatches(root, 'cordis.patch.yml'),
    ] as Parameters<typeof composeEntries>[0])
    expect(composedRows.find(row => row.id === 'llm-deepseek')?.disabled).toBe(true)
    expect(composedRows.find(row => row.id === 'session-title-llm')?.disabled).toBe(true)
    expect(composedRows.find(row => row.id === 'agent-default-model')?.config).toEqual({
      provider: 'configure-provider',
      model: 'configure-model',
    })
    expect(composedRows.find(row => row.id === 'web')?.config).toEqual({ fetchProvider: 'http' })
    expect(composedRows.find(row => row.id === 'tool-web')?.config).toEqual({ search: false, fetch: true })
  })

})
