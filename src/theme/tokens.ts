/**
 * Design tokens taken verbatim from `design/Workout Tracker.dc.html`.
 *
 * These are the prototype's exact values, named by the role they play rather
 * than collapsed into a shorter ramp — fidelity to the design wins over a
 * tidier palette. Nothing outside this file should contain a raw colour.
 */

export const color = {
  /** App background behind every screen. */
  bg: '#F4F5F7',
  /** Cards, sheets, the tab bar. */
  surface: '#FFFFFF',

  accent: '#2F6BFF',
  /** Tinted accent background — resume card, selected scope, off-plan chip. */
  accentBg: '#EBF1FF',
  accentBorder: 'rgba(47,107,255,0.30)',
  accentBorderMid: 'rgba(47,107,255,0.35)',
  /** Resume card on press. */
  accentBorderHover: 'rgba(47,107,255,0.60)',
  accentBorderStrong: 'rgba(47,107,255,0.55)',
  /** Unfilled portion of the resume card's progress bar. */
  accentTrack: 'rgba(47,107,255,0.18)',

  fill: '#F3F4F7',
  fillInput: '#F1F2F5',
  fillHover: '#F5F6F8',
  fillPressed: '#E4E7EC',

  dangerBg: '#FFECEA',
  /** Deeper danger fill, once releasing would delete. */
  dangerBgArmed: '#FFDCD7',
  dangerInk: '#B3311F',
  dangerBorder: 'rgba(200,42,26,0.22)',

  onAccent: '#FFFFFF',
  /** Toast background — the one place the ink colour is used as a surface. */
  inverseSurface: '#14161A',
  /** The accent at 55%, outlining a card while it is being dragged. */
  accentDrag: 'rgba(47,107,255,0.55)',
  /** A deliberately-chosen rest day in the week strip. */
  restBg: '#E4F3E9',
  restBorder: 'rgba(30,105,70,0.22)',
  restInk: '#1C6240',
  onInverse: '#FFFFFF',
  /** Undo action on the dark toast, and its pressed state. */
  undo: '#7FA8FF',
  undoPressed: '#B9CEFF',
} as const;

/** Text colours, keyed by where the design uses them. */
export const ink = {
  /** rgb(20,22,26) — body copy, titles, list rows. */
  primary: '#14161A',
  /** rgb(36,38,42) — the freestyle button label. */
  strong: '#24262A',
  /** rgb(41,43,47) — stepper glyphs, neutral dialog buttons. */
  control: '#292B2F',
  /** rgb(54,56,59) — avatar initials. */
  avatar: '#36383B',
  /** rgb(60,63,68) — back chevron. */
  chevron: '#3C3F44',
  /** rgb(67,69,72) — outline and dashed button labels. */
  action: '#434548',
  /** rgb(80,81,84) — Cancel labels and empty-state headings. */
  subtle: '#505154',
  /** rgb(90,93,99) — the disclosure caret. */
  caret: '#5A5D63',
  /** rgb(93,94,97) — the session card's meta line. */
  body: '#5D5E61',
  /** rgb(106,107,110) — Edit link, rest-day supporting copy. */
  secondary: '#6A6B6E',
  /** rgb(114,115,117) — stat labels, set targets, plain strip cells. */
  muted: '#727375',
  /** rgb(119,120,122) — the date eyebrow above a page title. */
  eyebrow: '#77787A',
  /** rgb(124,125,127) — week-strip day letters, list captions. */
  strip: '#7C7D7F',
  /** rgb(132,133,135) — the "THIS WEEK SO FAR" eyebrow. */
  faint: '#848587',
  /** rgb(139,140,142) — input placeholders. */
  placeholder: '#8B8C8E',
  /** rgb(145,145,147) — set indices, counts. */
  index: '#919193',
  /** rgb(157,158,160) — inactive disclosure chevrons. */
  disabled: '#9D9EA0',
  /** rgb(70,90,140) — the resume card's progress line, tinted toward the accent. */
  progress: '#465A8C',
  /** rgb(126,128,132) — the builder's drag-to-reorder grip. */
  grip: '#7E8084',
} as const;

/** Hairlines, keyed by the element that uses them. */
export const border = {
  /** Rows inside a list card. */
  rowSoft: 'rgba(20,22,26,0.075)',
  /** Rows inside a filled list panel — the off-plan change list, menu rows. */
  rowFill: 'rgba(20,22,26,0.078)',
  /** Exercise rows in the session card. */
  row: 'rgba(20,22,26,0.083)',
  /** Stat tiles, plain week-strip cells, the session list's top rule. */
  tile: 'rgba(20,22,26,0.101)',
  /** Standard card outline. */
  card: 'rgba(20,22,26,0.112)',
  /** The avatar ring and search fields. */
  avatar: 'rgba(20,22,26,0.124)',
  /** Small bordered controls — SWAP, +30. */
  control: 'rgba(20,22,26,0.135)',
  /** The routine switcher popover. */
  menu: 'rgba(20,22,26,0.14)',
  strong: 'rgba(20,22,26,0.158)',
  /** Empty-state cards. */
  dashed: 'rgba(20,22,26,0.169)',
  /** Unchecked radio and set-complete boxes. */
  check: 'rgba(20,22,26,0.181)',
  /** The "+ Add exercise" affordance. */
  dashedStrong: 'rgba(20,22,26,0.204)',
  /** Line-art glyphs inside empty-state tiles. */
  glyph: 'rgba(20,22,26,0.28)',
} as const;

export const radius = {
  xs: 7,
  sm: 9,
  md: 10,
  lg: 11,
  xl: 12,
  card: 14,
  menu: 16,
  panel: 18,
  cardLg: 20,
  dialog: 22,
  sheet: 26,
  pill: 999,
} as const;

export const space = {
  /** Horizontal page margin. Every screen uses this. */
  gutter: 22,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 30,
} as const;

export const font = {
  regular: 'Archivo_400Regular',
  medium: 'Archivo_500Medium',
  semibold: 'Archivo_600SemiBold',
  mono: 'DMMono_400Regular',
  monoMedium: 'DMMono_500Medium',
} as const;

/**
 * Named text styles. React Native `letterSpacing` is in points, so the
 * prototype's em values are multiplied through by their font size
 * (e.g. 31px at -0.025em → -0.775).
 */
export const text = {
  /** Uppercase DM Mono label above a title. `.16em` at 10px. */
  eyebrow: { fontFamily: font.monoMedium, fontSize: 10, lineHeight: 10, letterSpacing: 1.6, color: ink.eyebrow },
  /** Section eyebrow inside a card. `.14em` at 10px. */
  eyebrowTight: { fontFamily: font.monoMedium, fontSize: 10, lineHeight: 10, letterSpacing: 1.4, color: ink.faint },
  /** Screen title — Today, Schedule, Routines, History. */
  pageTitle: { fontFamily: font.semibold, fontSize: 31, lineHeight: 32.5, letterSpacing: -0.78, color: ink.primary },
  /** Summary screen only. */
  displayTitle: { fontFamily: font.semibold, fontSize: 34, lineHeight: 36, letterSpacing: -1.02, color: ink.primary },
  /** Bottom-sheet headings. */
  sheetTitle: { fontFamily: font.semibold, fontSize: 21, letterSpacing: -0.42, color: ink.primary },
  /** The tappable routine name on the Today card. */
  routineTitle: { fontFamily: font.semibold, fontSize: 25, lineHeight: 27.5, letterSpacing: -0.5, color: ink.primary },
  /** The resume card's session name. */
  cardTitleLg: { fontFamily: font.semibold, fontSize: 20, lineHeight: 22, letterSpacing: -0.4, color: ink.primary },
  cardTitle: { fontFamily: font.semibold, fontSize: 16, letterSpacing: -0.24, color: ink.primary },
  rowTitle: { fontFamily: font.medium, fontSize: 15, letterSpacing: -0.15, color: ink.primary },
  body: { fontFamily: font.regular, fontSize: 14, color: ink.primary },
  bodySm: { fontFamily: font.regular, fontSize: 13, lineHeight: 19.5, color: ink.secondary },
  caption: { fontFamily: font.regular, fontSize: 11, color: ink.muted },
  /** Big number in a stat tile. */
  statNumber: { fontFamily: font.monoMedium, fontSize: 24, lineHeight: 24, letterSpacing: -0.48, color: ink.primary },
  statLabel: { fontFamily: font.regular, fontSize: 11, color: ink.muted },
  /** Weight and rep values in the active workout. */
  mono: { fontFamily: font.monoMedium, fontSize: 16, color: ink.primary },
  /** Set targets and other inline numerics. */
  monoSm: { fontFamily: font.mono, fontSize: 12, color: ink.muted },
  button: { fontFamily: font.semibold, fontSize: 15, letterSpacing: -0.15 },
} as const;

export type TextVariant = keyof typeof text;

/** Phone frame the design was drawn against — reference only, never a layout constraint. */
export const DESIGN_FRAME = { width: 412, height: 892 } as const;
