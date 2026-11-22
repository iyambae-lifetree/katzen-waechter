import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionRateLimit, ThemeSetArgs } from 'claude-code'

import type { Lage, Pose } from '../types'
import { makeColors } from './make-colors.js'
import { beschreibung, szene } from './szene'

const lage = atom(
  { plugin: 'katzen-waechter', key: 'lage' } as const,
  { pose: 'wartet', gemeldet: { kontext: 0, limit5: 0, limit7: 0 } } as Lage,
  { shape: 'lage-1' },
)

const SCHLUSS = 'mcp__ccd_turn__wrap_up'
const POSEN = new Set<string>(['ruht', 'wartet', 'frage'])
// Ab dieser Zuglänge ist er vermutlich weggegangen: dann ein Hinweis beim Zurückkommen.
const LANGER_ZUG_MS = 3 * 60 * 1000
// Warnstufen: ab 80 % einmal, ab 92 bzw. 95 % noch einmal.
const KONTEXT_WARN = [80, 80, 92] as const
const LIMIT_WARN = [80, 80, 95] as const

// Warmes Katzenfell bei Tag, Kerzenlicht bei Nacht.
const { theme, problems } = makeColors({
  label: 'Mikeschs Fensterbank',
  roles: { accent: '#c06a1e', danger: '#b3392f', success: '#4e7d3a', warning: '#a86f14', pro: '#7a5c9a' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#efe4d2',
        'surface-1': '#f5ecdf',
        'surface-2': '#faf5ec',
        'text-primary': '#2b2119',
        'text-secondary': '#56483b',
        'text-muted': '#6b5c4d',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#1b1613',
        'surface-1': '#231d19',
        'surface-2': '#2b241f',
        'surface-3': '#322a24',
        'text-primary': '#f2e8da',
        'text-secondary': '#d1c4b3',
        'text-muted': '#ab9d8b',
      },
    },
  },
})

// Töne auf 432 Hz gestimmt (A4 = 432): C5, E5, D5, G5.
const KLANG: NonNullable<ThemeSetArgs['sound']> = {
  cues: {
    done: { layers: [{ wave: 'bell', notes: [513.74, 647.27], step: 0.14, gain: 0.22 }], reverb: 0.25 },
    ask: { layers: [{ wave: 'triangle', notes: [576.65, 769.74], step: 0.18, glide: 2, gain: 0.2 }], reverb: 0.2 },
  },
}

const LOOK: ThemeSetArgs = {
  colors: theme,
  // Leichtes Glas: Mikesch bleibt erkennbar, Text bleibt lesbar.
  backdrop: { scene: 'mikeschs-fensterbank', glass: { blur: 0, opacity: 0.5 } },
  sound: KLANG,
  // Immer hell: Cremefarben, auch wenn der Mac dunkel ist.
  overrideColorScheme: 'light',
}

function fenster(raten: readonly SessionRateLimit[], art: string): SessionRateLimit | undefined {
  return raten.find(r => r.kind === art)
}

function prozentOk(p: unknown): number | undefined {
  return typeof p === 'number' && Number.isFinite(p) ? Math.min(Math.max(p, 0), 100) : undefined
}

// „in 2 Std. 10 Min.“ aus einem ISO-Zeitpunkt, unabhängig von der Zeitzone.
function bis(iso: string | undefined, jetzt: number): string {
  if (iso === undefined) return ''
  const t = Date.parse(iso)
  if (!Number.isFinite(t) || t <= jetzt) return ''
  const min = Math.round((t - jetzt) / 60000)
  const tage = Math.floor(min / 1440)
  const std = Math.floor((min % 1440) / 60)
  const rest = min % 60
  const teile = [tage > 0 ? `${tage} Tg.` : '', std > 0 ? `${std} Std.` : '', tage === 0 && rest > 0 ? `${rest} Min.` : '']
  const text = teile.filter(Boolean).join(' ')
  return text ? `, wieder voll in ${text}` : ''
}

// Neue Warnstufe (1 oder 2) oder 0. Fällt der Wert wieder (neues Fenster,
// zusammengefasster Chat), darf später erneut gewarnt werden.
function warnstufe(p: number | undefined, grenzen: readonly [number, number, number]): number {
  if (p === undefined) return 0
  if (p >= grenzen[2]) return 2
  if (p >= grenzen[0]) return 1
  return 0
}

function setzePose($: EngineInterface, pose: Pose): void {
  update($, lage, l => (l.pose === pose ? l : { ...l, pose }))
}

async function messen(
  $: EngineInterface,
  kontextRoh: unknown,
  raten: readonly SessionRateLimit[],
): Promise<void> {
  const kontext = prozentOk(kontextRoh)
  const f5 = fenster(raten, 'five_hour')
  const f7 = fenster(raten, 'seven_day')
  const limit5 = prozentOk(f5?.percentUsed)
  const limit7 = prozentOk(f7?.percentUsed)
  const jetzt = await $.clock.now()
  const alt = await read($, lage)

  const wk = warnstufe(kontext, KONTEXT_WARN)
  const w5 = warnstufe(limit5, LIMIT_WARN)
  const w7 = warnstufe(limit7, LIMIT_WARN)

  if (wk > alt.gemeldet.kontext && kontext !== undefined) {
    $.ui.toast(
      wk === 2
        ? `Die Kerze ist fast aus: Chat zu ${Math.round(kontext)} % voll. Bald wird zusammengefasst.`
        : `Die Kerze brennt herunter: Chat zu ${Math.round(kontext)} % voll.`,
      { timeoutMs: 9000 },
    )
  }
  if (w5 > alt.gemeldet.limit5 && limit5 !== undefined) {
    $.ui.toast(
      `${w5 === 2 ? 'Napf leer' : 'Napf fast leer'}: 5-Stunden-Limit bei ${Math.round(limit5)} %${bis(f5?.resetsAt, jetzt)}.`,
      { timeoutMs: 9000 },
    )
  }
  if (w7 > alt.gemeldet.limit7 && limit7 !== undefined) {
    $.ui.toast(
      `${w7 === 2 ? 'Vorrat leer' : 'Vorrat wird knapp'}: Wochenlimit bei ${Math.round(limit7)} %${bis(f7?.resetsAt, jetzt)}.`,
      { timeoutMs: 9000 },
    )
  }

  update($, lage, l => ({
    ...l,
    kontext: kontext ?? l.kontext,
    limit5: limit5 ?? l.limit5,
    limit7: limit7 ?? l.limit7,
    reset5: f5?.resetsAt ?? l.reset5,
    reset7: f7?.resetsAt ?? l.reset7,
    gemeldet: {
      kontext: kontext === undefined ? l.gemeldet.kontext : wk,
      limit5: limit5 === undefined ? l.gemeldet.limit5 : w5,
      limit7: limit7 === undefined ? l.gemeldet.limit7 : w7,
    },
  }))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
    if (unpainted !== undefined) $.ui.log(unpainted)

    let set
    try {
      set = await $.theme.set(LOOK)
    } catch (fehler) {
      // Ein Bau ohne Klang nimmt das Ganze nicht: dann ohne Töne.
      $.ui.log(String(fehler))
      set = await $.theme.set({ ...LOOK, sound: undefined })
    }
    if (!set.isDrawn && set.requestId === undefined) $.ui.log(`katzen-waechter: ${set.reason}`)

    try {
      const u = await $.session.usage()
      await messen($, u.context.percent, u.rateLimits)
    } catch (fehler) {
      $.ui.log(`katzen-waechter: keine Messung (${String(fehler)})`)
    }
    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    try {
      await messen($, e.context?.percent, e.rateLimits ?? [])
    } catch (fehler) {
      $.ui.log(`katzen-waechter: Messung übersprungen (${String(fehler)})`)
    }
    return next(e)
  })

  on('turn.start', ($, e, next) => {
    try {
      if (e.agentId === undefined) setzePose($, 'ruht')
    } catch {
      // nur Anzeige
    }
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) try {
      const war = (await read($, lage)).pose
      setzePose($, war === 'frage' ? 'frage' : 'wartet')
      if (e.reason === 'answer' && e.durationMs >= LANGER_ZUG_MS) {
        $.ui.toast(war === 'frage' ? 'Fertig. Mikesch hat eine Frage an dich.' : 'Fertig. Mikesch wartet auf dich.', {
          timeoutMs: 12000,
        })
      }
    } catch {
      // nur Anzeige
    }
    return next(e)
  })

  // Stellt der Abschluss eine Frage, hebt Mikesch die Pfote.
  on('tool.call', { tool: SCHLUSS }, ($, e, next) => {
    const frage = (e as { ask?: unknown }).ask
    if (e.agentId === undefined && typeof frage === 'string' && frage.trim() !== '') setzePose($, 'frage')
    return next(e)
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: 'AskUserQuestion' }, async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    setzePose($, 'frage')
    try {
      return await next(e)
    } finally {
      try {
        setzePose($, 'ruht')
      } catch {
        // nur Anzeige
      }
    }
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') return next(e)
    if (e.props.scene !== 'mikeschs-fensterbank') return next(e)
    const { Svg } = $.ui.resolve(e)
    let l: Lage
    try {
      l = await read($, lage)
    } catch {
      return next(e)
    }
    // Ein alter gespeicherter Stand darf nur bekannte Posen in die Grafik bringen.
    if (!POSEN.has(l.pose)) l = { ...l, pose: 'wartet' }
    return <Svg source={szene(l)} alt={beschreibung(l)} isInteractive />
  })
}

