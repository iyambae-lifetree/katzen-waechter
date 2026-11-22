import { expect, test } from 'claude-code/testing'

import { beschreibung, KERZE_GRENZEN, NAPF_GRENZEN, stufe, szene } from './szene'
import type { Lage } from '../types'

// Der Testrahmen dieses Baus kann Backdrop nicht einhängen, darum wird die Szene direkt geprüft.
const VERBOTEN = /href|<image|foreignObject|data:|@import|\\|CDATA|<!DOCTYPE/
const GRUND: Lage = { pose: 'ruht', gemeldet: { kontext: 0, limit5: 0, limit7: 0 } }

test('Stufen von Kerze und Napf', async () => {
  expect(stufe(undefined, KERZE_GRENZEN)).toBe(0)
  expect(stufe(39, KERZE_GRENZEN)).toBe(0)
  expect(stufe(40, KERZE_GRENZEN)).toBe(1)
  expect(stufe(72, KERZE_GRENZEN)).toBe(2)
  expect(stufe(99, KERZE_GRENZEN)).toBe(3)
  expect(stufe(94.9, NAPF_GRENZEN)).toBe(2)
  expect(stufe(Number.NaN, NAPF_GRENZEN)).toBe(0)
})

test('jede Lage ergibt reine, kleine Vektorgrafik', async () => {
  for (const pose of ['ruht', 'wartet', 'frage'] as const) {
    for (const p of [undefined, 10, 75, 99]) {
      const q = szene({ ...GRUND, pose, kontext: p, limit5: p, limit7: p })
      expect(q.length > 1000).toBe(true)
      expect(q.length < 131072).toBe(true)
      expect(VERBOTEN.test(q)).toBe(false)
    }
  }
})

test('Kerze brennt herunter, Napf leert sich', async () => {
  const voll = szene({ ...GRUND, kontext: 5, limit5: 5 })
  const leer = szene({ ...GRUND, kontext: 95, limit5: 97 })
  expect((voll.match(/class="korn"/g) ?? []).length).toBe(9)
  expect((leer.match(/class="korn"/g) ?? []).length).toBe(0)
  expect(voll).toContain('height="96"')
  expect(leer).toContain('height="18"')
  expect(leer).toContain('flamme spaet')
})

test('Pose und Vorlesetext', async () => {
  expect(szene({ ...GRUND, pose: 'frage' })).toContain('class="tippen"')
  expect(szene({ ...GRUND, pose: 'ruht' })).toContain('class="lid"')
  expect(beschreibung({ ...GRUND, pose: 'frage' })).toContain('Frage')
  expect(beschreibung({ ...GRUND, kontext: 42.4 })).toContain('Chat 42 % voll')
  expect(beschreibung(GRUND)).toContain('noch nicht gemessen')
})
