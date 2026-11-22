import type { Lage, Pose } from '../types'

// Stufen 0 bis 3 aus einem Prozentwert. Ohne Messung Stufe 0, damit die Katze
// nicht vor einem leeren Napf sitzt, bevor überhaupt etwas gemessen wurde.
export function stufe(prozent: number | undefined, grenzen: readonly [number, number, number]): number {
  if (prozent === undefined || !Number.isFinite(prozent)) return 0
  if (prozent >= grenzen[2]) return 3
  if (prozent >= grenzen[1]) return 2
  if (prozent >= grenzen[0]) return 1
  return 0
}

export const KERZE_GRENZEN = [40, 70, 85] as const
export const NAPF_GRENZEN = [50, 80, 95] as const

// Wachshöhe der Kerze je Stufe: brennt herunter, je voller der Chat ist.
const WACHS = [96, 68, 42, 18] as const
// Körner im Napf: je Stufe weniger, bei Stufe 3 leer.
const KOERNER: readonly (readonly [number, number])[] = [
  [146, 229], [158, 226], [170, 225], [182, 227], [152, 233], [164, 231], [176, 232], [188, 233], [140, 234],
]
const KOERNER_JE_STUFE = [9, 6, 3, 0] as const

function zahl(n: number): string {
  return String(Math.round(n * 10) / 10)
}

function kerze(st: number): string {
  const h = WACHS[st] ?? WACHS[0]
  const oben = 250 - h
  const flamme = st >= 3 ? 'flamme spaet' : 'flamme'
  return `
  <g class="kerze">
    <circle class="schein" cx="78" cy="${zahl(oben - 16)}" r="${st >= 3 ? 70 : 110}" fill="url(#kerzenschein)"/>
    <ellipse cx="78" cy="250" rx="26" ry="5" class="teller"/>
    <rect x="65" y="${zahl(oben)}" width="26" height="${zahl(h)}" rx="3" class="wachs"/>
    <path d="M70 ${zahl(oben + 2)} q0 9 3 12 q3 -3 2 -12 Z" class="tropfen"/>
    <line x1="78" y1="${zahl(oben)}" x2="78" y2="${zahl(oben - 6)}" class="docht"/>
    <path class="${flamme}" d="M78 ${zahl(oben - 30)} C86 ${zahl(oben - 18)} 85 ${zahl(oben - 6)} 78 ${zahl(oben - 5)} C71 ${zahl(oben - 6)} 70 ${zahl(oben - 18)} 78 ${zahl(oben - 30)} Z"/>
  </g>`
}

function napf(st: number): string {
  const n = KOERNER_JE_STUFE[st] ?? 9
  const koerner = KOERNER.slice(0, n)
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.2" class="korn"/>`)
    .join('')
  return `
  <g class="napf">
    ${koerner}
    <path d="M130 233 L200 233 L192 250 L138 250 Z" class="schale"/>
    <ellipse cx="165" cy="233" rx="35" ry="4" class="rand"/>
    <path d="M156 242 q6 -4 12 0 q-6 4 -12 0 Z M168 242 l5 -3 v6 Z" class="fisch"/>
  </g>`
}

function augen(pose: Pose): string {
  if (pose === 'ruht') {
    return `
    <path d="M229 158 Q236 163 243 158" class="lid"/>
    <path d="M249 158 Q256 163 263 158" class="lid"/>`
  }
  return `
    <g class="augen">
      <ellipse cx="236" cy="157" rx="5.5" ry="6.5" class="auge"/>
      <ellipse cx="256" cy="157" rx="5.5" ry="6.5" class="auge"/>
      <ellipse cx="236" cy="157.5" rx="1.8" ry="5" class="pupille"/>
      <ellipse cx="256" cy="157.5" rx="1.8" ry="5" class="pupille"/>
      <circle cx="237.6" cy="154.6" r="1.3" class="glanz"/>
      <circle cx="257.6" cy="154.6" r="1.3" class="glanz"/>
    </g>`
}

function pfoten(pose: Pose): string {
  if (pose === 'frage') {
    // Rechte Pfote hebt sich ans Fenster und tippt ganz langsam an die Scheibe.
    return `
    <ellipse cx="236" cy="249" rx="9" ry="5" class="pfote"/>
    <g class="tippen">
      <path d="M262 205 C276 190 290 170 304 152" class="bein"/>
      <circle cx="305" cy="150" r="7.5" class="pfote"/>
    </g>`
  }
  return `
    <ellipse cx="236" cy="249" rx="9" ry="5" class="pfote"/>
    <ellipse cx="257" cy="249" rx="9" ry="5" class="pfote"/>`
}

function katze(pose: Pose): string {
  const kopf = pose === 'ruht' ? 'kopf' : 'kopf wach'
  return `
  <g class="katze ${pose}">
    <path d="M285 245 C330 247 346 220 332 199 C324 188 312 194 318 204" class="schwanz"/>
    <g class="atem">
      <path d="M208 251 C203 214 214 180 246 172 C278 180 291 214 288 251 Z" class="fell"/>
      <path d="M226 198 q8 4 4 14 M264 198 q-8 4 -4 14 M278 226 q-9 2 -10 12" class="streifen"/>
      <ellipse cx="246" cy="222" rx="14" ry="23" class="brust"/>
    </g>
    ${pfoten(pose)}
    <g class="${kopf}">
      <path d="M221 146 L216 110 L241 131 Z" class="fell"/>
      <path d="M271 146 L276 110 L251 131 Z" class="fell"/>
      <path d="M223 138 L220 118 L234 131 Z" class="ohr"/>
      <path d="M269 138 L272 118 L258 131 Z" class="ohr"/>
      <circle cx="246" cy="158" r="31" class="fell"/>
      <path d="M240 130 l1 9 M246 128 v10 M252 130 l-1 9" class="streifen"/>
      ${augen(pose)}
      <path d="M242.5 167 h7 l-3.5 4 Z" class="nase"/>
      <path d="M246 171 q-3 4 -7 3 M246 171 q3 4 7 3" class="maul"/>
      <path d="M232 169 l-22 -3 M232 172 l-21 3 M260 169 l22 -3 M260 172 l21 3" class="bart"/>
    </g>
  </g>`
}

function fenster(): string {
  return `
  <g class="fenster">
    <path d="M300 250 V92 A100 100 0 0 1 500 92 V250 Z" class="rahmen"/>
    <path d="M313 250 V94 A87 87 0 0 1 487 94 V250 Z" fill="url(#himmel)"/>
    <g class="sterne">
      <circle cx="342" cy="120" r="1.5" class="stern s1"/>
      <circle cx="372" cy="88" r="1.2" class="stern s2"/>
      <circle cx="415" cy="140" r="1.4" class="stern s3"/>
      <circle cx="360" cy="196" r="1.1" class="stern s2"/>
      <circle cx="468" cy="168" r="1.3" class="stern s1"/>
    </g>
    <g class="wolke">
      <ellipse cx="360" cy="150" rx="26" ry="9" class="wolkenteil"/>
      <ellipse cx="378" cy="143" rx="18" ry="10" class="wolkenteil"/>
    </g>
    <circle cx="446" cy="116" r="17" class="mond"/>
    <path d="M400 250 V8 M313 172 H487" class="sprosse"/>
  </g>`
}

const STIL = `
  svg { --wand-oben:#f3e9d8; --wand-unten:#e8d7bc; --himmel-oben:#bcd3e4; --himmel-unten:#efe4cf;
    --rahmen:#8a5a35; --holz:#b07a4a; --holz-schatten:#8f6038; --fell:#d8893a; --streifen:#b0621f;
    --brust:#f6e7cf; --ohr:#e9a99a; --auge:#86b24a; --pupille:#2a1d12; --wachs:#f4e8cc;
    --teller:#9c8a74; --schale:#5f7f9b; --rand:#7c9bb5; --korn:#9a5b2a; --mond:#f7d989;
    --stern:#ffffff; --wolke:#ffffff; --schein:#f6b44a; --schein-staerke:0.16; --stern-staerke:0; --wolken-staerke:0.75; }
  @media (prefers-color-scheme: dark) {
    svg { --wand-oben:#1f1915; --wand-unten:#16110e; --himmel-oben:#0f1a2c; --himmel-unten:#2a2436;
      --rahmen:#4a3322; --holz:#5c3f2a; --holz-schatten:#3d2a1c; --fell:#bf7533; --streifen:#8f4f1c;
      --brust:#e3d2b8; --ohr:#c98c80; --auge:#a6d25a; --pupille:#140d08; --wachs:#e8d9b8;
      --teller:#6d5f50; --schale:#3f566b; --rand:#56708a; --korn:#7d4a22; --mond:#f2ecd6;
      --stern:#fff6dd; --wolke:#3a3448; --schein:#f0a23a; --schein-staerke:0.34; --stern-staerke:0.85; --wolken-staerke:0; }
  }
  .wandoben { stop-color: var(--wand-oben); } .wandunten { stop-color: var(--wand-unten); }
  .himmeloben { stop-color: var(--himmel-oben); } .himmelunten { stop-color: var(--himmel-unten); }
  .scheininnen { stop-color: var(--schein); stop-opacity: var(--schein-staerke); }
  .scheinaussen { stop-color: var(--schein); stop-opacity: 0; }
  .rahmen { fill: var(--rahmen); }
  .sprosse { stroke: var(--rahmen); stroke-width: 7; fill: none; }
  .brett { fill: var(--holz); } .brettschatten { fill: var(--holz-schatten); }
  .fell { fill: var(--fell); } .brust, .pfote { fill: var(--brust); } .ohr { fill: var(--ohr); }
  .streifen { stroke: var(--streifen); stroke-width: 4; stroke-linecap: round; fill: none; }
  .schwanz { stroke: var(--fell); stroke-width: 13; stroke-linecap: round; fill: none; }
  .bein { stroke: var(--fell); stroke-width: 12; stroke-linecap: round; fill: none; }
  .auge { fill: var(--auge); } .pupille { fill: var(--pupille); } .glanz { fill: #ffffff; opacity: 0.8; }
  .lid { stroke: var(--pupille); stroke-width: 2.4; stroke-linecap: round; fill: none; }
  .nase { fill: var(--ohr); }
  .maul { stroke: var(--pupille); stroke-width: 1.6; fill: none; stroke-linecap: round; opacity: 0.7; }
  .bart { stroke: var(--brust); stroke-width: 1.2; stroke-linecap: round; opacity: 0.8; }
  .wachs { fill: var(--wachs); } .tropfen { fill: var(--wachs); } .teller { fill: var(--teller); }
  .docht { stroke: #3b2b1e; stroke-width: 2; stroke-linecap: round; }
  .flamme { fill: #f6b13c; } .flamme.spaet { fill: #e5672c; }
  .schale { fill: var(--schale); } .rand { fill: var(--rand); } .korn { fill: var(--korn); }
  .fisch { fill: var(--rand); opacity: 0.9; }
  .mond { fill: var(--mond); }
  .stern { fill: var(--stern); opacity: var(--stern-staerke); }
  .wolkenteil { fill: var(--wolke); opacity: var(--wolken-staerke); }

  .ecke { transform-box: view-box; }
  @media (max-aspect-ratio: 3/2) { .ecke { transform: translateX(-90px); } }
  @media (max-aspect-ratio: 5/4) { .ecke { transform: translateX(-235px); } }
  @media (max-aspect-ratio: 1/1) { .ecke { transform: translateX(-300px); } }
  @media (max-aspect-ratio: 3/4) { .ecke { transform: translateX(-425px) translateY(60px); } }
  @media (min-aspect-ratio: 17/10) { .ecke { transform: translateY(60px); } }
  @media (min-aspect-ratio: 2/1) { .ecke { transform: translateY(110px); } }
  @media (min-aspect-ratio: 12/5) { .ecke { transform: translateY(175px); } }
  @media (min-aspect-ratio: 3/1) { .ecke { transform: translateY(240px); } }
  .schwanz, .atem, .kopf, .tippen, .flamme, .schein, .wolke { transform-box: view-box; }
  .schwanz { transform-origin: 285px 245px; }
  .atem { transform-origin: 248px 251px; }
  .kopf { transform-origin: 246px 186px; }
  .tippen { transform-origin: 262px 205px; }
  .flamme { transform-origin: 78px 240px; }

  @media (prefers-reduced-motion: no-preference) {
    .atem { animation: atmen 5.5s ease-in-out infinite; }
    .ruht .schwanz { animation: schwanzruhig 9s ease-in-out infinite alternate; }
    .wartet .schwanz, .frage .schwanz { animation: schwanzwach 4.5s ease-in-out infinite alternate; }
    .kopf.wach { animation: neigen 7s ease-in-out infinite alternate; }
    .augen { animation: blinzeln 8s ease-in-out infinite; transform-box: view-box; transform-origin: 246px 157px; }
    .tippen { animation: tippen 2.6s ease-in-out infinite alternate; }
    .flamme { animation: flackern 3.2s ease-in-out infinite alternate; }
    .flamme.spaet { animation-duration: 2.2s; }
    .schein { animation: glimmen 6s ease-in-out infinite alternate; }
    .s1 { animation: funkeln 7s ease-in-out infinite alternate; }
    .s2 { animation: funkeln 9s ease-in-out infinite alternate; }
    .s3 { animation: funkeln 11s ease-in-out infinite alternate; }
    .wolke { animation: ziehen 40s ease-in-out infinite alternate; }
  }
  @keyframes atmen { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.025); } }
  @keyframes schwanzruhig { from { transform: rotate(-2deg); } to { transform: rotate(3deg); } }
  @keyframes schwanzwach { from { transform: rotate(-7deg); } to { transform: rotate(9deg); } }
  @keyframes neigen { from { transform: rotate(-3deg); } to { transform: rotate(4deg); } }
  @keyframes blinzeln { 0%, 94%, 100% { transform: scaleY(1); } 97% { transform: scaleY(0.12); } }
  @keyframes tippen { from { transform: rotate(0deg); } to { transform: rotate(-7deg); } }
  @keyframes flackern { from { transform: scale(1, 1); } to { transform: scale(0.94, 1.07); } }
  @keyframes glimmen { from { opacity: 0.85; } to { opacity: 1; } }
  @keyframes funkeln { from { opacity: 0.25; } to { opacity: var(--stern-staerke); } }
  @keyframes ziehen { from { transform: translateX(0px); } to { transform: translateX(22px); } }
`

// Baut die Szene aus der Lage. Nur Zahlen und feste Texte fließen hinein.
export function szene(lage: Lage): string {
  const kerzenStufe = stufe(lage.kontext, KERZE_GRENZEN)
  const napfStufe = stufe(Math.max(lage.limit5 ?? 0, lage.limit7 ?? 0), NAPF_GRENZEN)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<style>${STIL}</style>
<defs>
  <linearGradient id="wand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="wandoben"/><stop offset="1" class="wandunten"/></linearGradient>
  <linearGradient id="himmel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="himmeloben"/><stop offset="1" class="himmelunten"/></linearGradient>
  <radialGradient id="kerzenschein"><stop offset="0" class="scheininnen"/><stop offset="1" class="scheinaussen"/></radialGradient>
</defs>
<rect x="-2000" y="-2000" width="5600" height="5000" fill="url(#wand)"/>
<g class="ecke">
<svg x="1160" y="0" width="410" height="240" viewBox="0 -14 520 304" preserveAspectRatio="xMaxYMin meet" overflow="visible">
  ${fenster()}
  ${kerze(kerzenStufe)}
  <rect x="10" y="250" width="505" height="16" rx="3" class="brett"/>
  <rect x="16" y="266" width="493" height="6" rx="2" class="brettschatten"/>
  ${napf(napfStufe)}
  ${katze(lage.pose)}
</svg>
</g>
</svg>`
}

function prozent(p: number | undefined): string {
  return p === undefined ? 'noch nicht gemessen' : `${Math.round(p)} %`
}

// Vorlesetext für die Szene.
export function beschreibung(lage: Lage): string {
  const pose =
    lage.pose === 'frage'
      ? 'Mikesch tippt ans Fenster: Claude hat eine Frage an dich.'
      : lage.pose === 'wartet'
        ? 'Mikesch sitzt wach da und wartet auf dich.'
        : 'Mikesch döst, Claude arbeitet.'
  return `Kater Mikesch auf der Fensterbank. Kerze: Chat ${prozent(lage.kontext)} voll. Napf: 5-Stunden-Limit ${prozent(lage.limit5)}, Wochenlimit ${prozent(lage.limit7)} verbraucht. ${pose}`
}
