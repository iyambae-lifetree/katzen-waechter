export type Pose = 'ruht' | 'wartet' | 'frage'
export type Gemeldet = { kontext: number; limit5: number; limit7: number }
export type Lage = {
  // Prozent, fehlt solange es keine Messung gibt
  kontext?: number
  limit5?: number
  limit7?: number
  reset5?: string
  reset7?: string
  pose: Pose
  // höchste bereits angesagte Stufe je Anzeige, damit jede Warnung nur einmal kommt
  gemeldet: Gemeldet
}

declare module 'claude-code' {
  interface PluginState {
    'katzen-waechter': { lage: Shaped<Lage> }
  }
}
