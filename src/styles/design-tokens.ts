/**
 * RR Forecasting Dashboard — Design System Tokens
 * ════════════════════════════════════════════════════════════════════
 *
 * Design direction: "Bloomberg Terminal meets Stripe Dashboard"
 *   — Authoritative but clean, business-professional
 *   — Light backgrounds, crisp whites, subtle warm greys
 *   — RR Navy (#0F1923) and Gold (#C5A44E) as accent colors only
 *
 * Typography: Space Grotesk (heading) + Figtree (body)
 *
 * CSS custom properties are defined in src/index.css via @theme.
 * This file provides JS-accessible values for Recharts, inline
 * styles, programmatic usage, and serves as the canonical spec.
 *
 * Every token here has a matching CSS custom property:
 *   colors.navy.DEFAULT  →  var(--color-rr-navy)    →  bg-rr-navy
 *   colors.gold.DEFAULT  →  var(--color-rr-gold)    →  text-rr-gold
 *   shadows.card          →  var(--shadow-card)       →  shadow-card
 */

// ─────────────────────────────────────────────────────────────────────
// COLOR PALETTE
// ─────────────────────────────────────────────────────────────────────

export const colors = {
  // ── Brand: RR Navy ────────────────────────────────────────────────
  // Used sparingly: sidebar, primary buttons, emphasis.
  // CSS: --color-rr-navy-{shade}  |  Tailwind: bg-rr-navy-{shade}
  navy: {
    DEFAULT: '#0F1923',
    950: '#070D14',
    900: '#0A1219',
    800: '#0F1923',
    700: '#152231',
    600: '#1C2D42',
    500: '#243A56',
    400: '#2E4A6E',
    300: '#3D6490',
    200: '#6B8FB8',
    100: '#A8C2DB',
    50:  '#E0EAF2',
  },

  // ── Brand: RR Gold ────────────────────────────────────────────────
  // Used sparingly: accent buttons, active states, badges, focus rings.
  // CSS: --color-rr-gold-{shade}  |  Tailwind: bg-rr-gold-{shade}
  gold: {
    DEFAULT: '#C5A44E',
    900: '#5C4A1E',
    800: '#7A6328',
    700: '#8E7633',
    600: '#A08636',
    500: '#C5A44E',
    400: '#D4B96A',
    300: '#E2CD8E',
    200: '#F0E4BF',
    100: '#F8F2E0',
    50:  '#FDFAF0',
  },

  // ── Grey Scale ────────────────────────────────────────────────────
  // Foundation of the light UI. Warm-cool hybrid for professionalism.
  // CSS: --color-rr-grey-{shade}  |  Tailwind: bg-rr-grey-{shade}
  grey: {
    950: '#0C111D',
    900: '#101828',
    800: '#1D2939',
    700: '#344054',
    600: '#475467',
    500: '#667085',
    400: '#98A2B3',
    300: '#D0D5DD',
    200: '#EAECF0',
    100: '#F2F4F7',
    50:  '#F9FAFB',
    25:  '#FCFCFD',
  },

  // ── Status Colors ─────────────────────────────────────────────────
  // Each status has a base, background tint, border, and text variant.
  // Muted, professional tones — not neon.
  success: {
    DEFAULT: '#059669',
    bg:      '#ECFDF5',
    border:  '#A7F3D0',
    text:    '#065F46',
  },
  warning: {
    DEFAULT: '#D97706',
    bg:      '#FFFBEB',
    border:  '#FDE68A',
    text:    '#92400E',
  },
  danger: {
    DEFAULT: '#DC2626',
    bg:      '#FEF2F2',
    border:  '#FECACA',
    text:    '#991B1B',
  },
  info: {
    DEFAULT: '#2563EB',
    bg:      '#EFF6FF',
    border:  '#BFDBFE',
    text:    '#1E40AF',
  },

  // ── Fixed Colors ──────────────────────────────────────────────────
  white: '#FFFFFF',
  black: '#000000',
} as const;

// ─────────────────────────────────────────────────────────────────────
// SEMANTIC TOKENS
// ─────────────────────────────────────────────────────────────────────
// These map intent to color. Components should prefer semantic tokens
// over raw palette values.

export const semantic = {
  bg: {
    primary:   '#FFFFFF',                    // Main content, cards
    secondary: '#F9FAFB',                    // Page background, wells
    tertiary:  '#F2F4F7',                    // Nested wells, input bg
    hover:     '#F2F4F7',                    // Row/item hover
    active:    '#EAECF0',                    // Pressed/active
    overlay:   'rgba(15, 25, 35, 0.5)',      // Modal/drawer backdrop
  },
  text: {
    primary:     '#111827',                  // Headings, strong content
    secondary:   '#4B5563',                  // Body text, descriptions
    tertiary:    '#9CA3AF',                  // Captions, timestamps
    placeholder: '#D1D5DB',                  // Input placeholder
    inverse:     '#FFFFFF',                  // Text on dark bg
    onDark:      '#E2E8F0',                  // Sidebar primary text
    onDarkDim:   '#8B9AB5',                  // Sidebar secondary text
    onDarkMuted: '#5A6B85',                  // Sidebar tertiary text
  },
  border: {
    DEFAULT: '#E5E7EB',                      // Standard borders
    strong:  '#D0D5DD',                      // Emphasized borders
    subtle:  '#F2F4F7',                      // Faint dividers
    focus:   '#C5A44E',                      // Focus ring color (gold)
    onDark:  '#1E3048',                      // Borders on dark surfaces
  },
} as const;

// ─────────────────────────────────────────────────────────────────────
// COMPONENT TOKENS
// ─────────────────────────────────────────────────────────────────────
// Ready-to-use token sets for each component type.

export const components = {

  // ── Card ──────────────────────────────────────────────────────────
  card: {
    bg:            '#FFFFFF',
    border:        '#E5E7EB',
    borderHover:   '#D0D5DD',
    radius:        '10px',
    shadow:        '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
    shadowHover:   '0 4px 12px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.03)',
    shadowElevated:'0 8px 24px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.04)',
    padding:       '20px',
  },

  // ── Sidebar ───────────────────────────────────────────────────────
  // Stays dark navy for authority / Bloomberg feel.
  sidebar: {
    bg:           '#0F1923',
    bgHover:      '#172536',
    bgActive:     '#1E3048',
    border:       '#1C2D42',
    text:         '#C8D1DE',
    textDim:      '#7A8BA3',
    textActive:   '#FFFFFF',
    accentBg:     'rgba(197, 164, 78, 0.12)',
    accentBorder: 'rgba(197, 164, 78, 0.25)',
    accentText:   '#D4B96A',
    width:        '240px',
  },

  // ── Header ────────────────────────────────────────────────────────
  header: {
    bg:     '#FFFFFF',
    border: '#E5E7EB',
    height: '56px',
  },

  // ── KPI Card ──────────────────────────────────────────────────────
  kpi: {
    bg:            '#FFFFFF',
    border:        '#E5E7EB',
    labelColor:    '#667085',
    valueColor:    '#111827',
    subtitleColor: '#9CA3AF',
    iconSize:      '36px',
    iconRadius:    '8px',
    iconBg: {
      gold:    'rgba(197, 164, 78, 0.08)',
      success: 'rgba(5, 150, 105, 0.08)',
      warning: 'rgba(217, 119, 6, 0.08)',
      danger:  'rgba(220, 38, 38, 0.08)',
      info:    'rgba(37, 99, 235, 0.08)',
      neutral: '#F2F4F7',
    },
    iconBorder: {
      gold:    'rgba(197, 164, 78, 0.15)',
      success: 'rgba(5, 150, 105, 0.15)',
      warning: 'rgba(217, 119, 6, 0.15)',
      danger:  'rgba(220, 38, 38, 0.15)',
      info:    'rgba(37, 99, 235, 0.15)',
      neutral: '#E5E7EB',
    },
  },

  // ── Data Table ────────────────────────────────────────────────────
  table: {
    headerBg:     '#F9FAFB',
    headerText:   '#667085',
    headerBorder: '#E5E7EB',
    headerWeight: '600',
    rowBg:        '#FFFFFF',
    rowBgAlt:     '#FCFCFD',
    rowHoverBg:   '#F2F4F7',
    cellBorder:   '#F2F4F7',
    cellText:     '#344054',
    cellTextDim:  '#667085',
    fontSize:     '0.8125rem',
    cellPadding:  '10px 12px',
  },

  // ── Status Badge ──────────────────────────────────────────────────
  statusBadge: {
    radius:     '9999px',
    fontSize:   '0.6875rem',
    fontWeight: '600',
    padding:    '2px 10px',
    variants: {
      success: { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
      warning: { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' },
      danger:  { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
      info:    { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
      neutral: { bg: '#F2F4F7', text: '#475467', border: '#E5E7EB' },
      gold:    { bg: '#FDFAF0', text: '#8E7633', border: '#F0E4BF' },
    },
  },

  // ── Input / Form Control ──────────────────────────────────────────
  input: {
    bg:          '#FFFFFF',
    border:      '#D0D5DD',
    borderFocus: '#C5A44E',
    ring:        'rgba(197, 164, 78, 0.2)',
    text:        '#111827',
    placeholder: '#9CA3AF',
    radius:      '8px',
    height:      '40px',
  },

  // ── Button ────────────────────────────────────────────────────────
  button: {
    radius: '8px',
    primary: {
      bg:       '#0F1923',
      bgHover:  '#172536',
      text:     '#FFFFFF',
      border:   '#0F1923',
    },
    secondary: {
      bg:       '#FFFFFF',
      bgHover:  '#F9FAFB',
      text:     '#344054',
      border:   '#D0D5DD',
    },
    accent: {
      bg:       '#C5A44E',
      bgHover:  '#A08636',
      text:     '#FFFFFF',
      border:   '#C5A44E',
    },
    ghost: {
      bg:       'transparent',
      bgHover:  '#F2F4F7',
      text:     '#667085',
      border:   'transparent',
    },
    danger: {
      bg:       '#FEF2F2',
      bgHover:  '#FECACA',
      text:     '#DC2626',
      border:   '#FECACA',
    },
  },

  // ── Modal / Drawer ────────────────────────────────────────────────
  modal: {
    overlay: 'rgba(15, 25, 35, 0.5)',
    bg:      '#FFFFFF',
    border:  '#E5E7EB',
    radius:  '12px',
    shadow:  '0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 20px rgba(0, 0, 0, 0.08)',
  },

  // ── Tooltip ───────────────────────────────────────────────────────
  tooltip: {
    bg:     '#0F1923',
    text:   '#E2E8F0',
    radius: '6px',
    shadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },

  // ── Avatar ────────────────────────────────────────────────────────
  avatar: {
    radius: '9999px',
    border: '#E5E7EB',
    fallbackBg:   '#F2F4F7',
    fallbackText: '#667085',
  },
} as const;

// ─────────────────────────────────────────────────────────────────────
// TYPOGRAPHY
// ─────────────────────────────────────────────────────────────────────

export const typography = {
  /** Space Grotesk — geometric, monospace-inspired. Technical authority. */
  fontHeading: "'Space Grotesk', sans-serif",
  /** Figtree — clean, open, warm. Excellent data readability. */
  fontBody: "'Figtree', sans-serif",
  /** JetBrains Mono — for code snippets and monospace data. */
  fontMono: "'JetBrains Mono', 'Fira Code', monospace",

  // Font size scale (rem)
  size: {
    xs:   '0.75rem',     // 12px — captions, badges, fine print
    sm:   '0.8125rem',   // 13px — table cells, secondary body
    base: '0.875rem',    // 14px — default body text
    md:   '1rem',        // 16px — section headers
    lg:   '1.125rem',    // 18px — page titles
    xl:   '1.25rem',     // 20px — prominent headings
    '2xl':'1.5rem',      // 24px — KPI values
    '3xl':'2rem',        // 32px — hero / display
  },

  // Font weight
  weight: {
    normal:   '400',
    medium:   '500',
    semibold: '600',
    bold:     '700',
  },

  // Line height
  leading: {
    none:    '1',
    tight:   '1.2',
    snug:    '1.35',
    normal:  '1.5',
    relaxed: '1.625',
  },

  // Letter spacing
  tracking: {
    tighter: '-0.02em',
    tight:   '-0.01em',
    normal:  '0',
    wide:    '0.02em',
    wider:   '0.04em',
    widest:  '0.08em',
  },
} as const;

// ─────────────────────────────────────────────────────────────────────
// SPACING
// ─────────────────────────────────────────────────────────────────────

export const spacing = {
  px:   '1px',
  0.5:  '2px',
  1:    '4px',
  1.5:  '6px',
  2:    '8px',
  2.5:  '10px',
  3:    '12px',
  3.5:  '14px',
  4:    '16px',
  5:    '20px',
  6:    '24px',
  7:    '28px',
  8:    '32px',
  9:    '36px',
  10:   '40px',
  12:   '48px',
  14:   '56px',
  16:   '64px',
  20:   '80px',
  24:   '96px',

  // Semantic spacing
  pagePadding:   '24px',
  sectionGap:    '32px',
  contentGap:    '24px',
  cardPadding:   '20px',
  cardGap:       '16px',
  sidebarWidth:  '240px',
  headerHeight:  '56px',
} as const;

// ─────────────────────────────────────────────────────────────────────
// BORDER RADIUS
// ─────────────────────────────────────────────────────────────────────

export const radius = {
  none: '0',
  sm:   '4px',
  DEFAULT: '6px',
  md:   '8px',
  lg:   '10px',
  xl:   '12px',
  '2xl':'16px',
  full: '9999px',

  // Component-specific
  card:   '10px',
  button: '8px',
  input:  '8px',
  badge:  '9999px',
  modal:  '12px',
  avatar: '9999px',
} as const;

// ─────────────────────────────────────────────────────────────────────
// SHADOWS
// ─────────────────────────────────────────────────────────────────────
// Subtle, layered shadows. No heavy drop shadows — this is Stripe-tier.

export const shadows = {
  xs:  '0 1px 2px rgba(0, 0, 0, 0.04)',
  sm:  '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
  DEFAULT: '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.03)',
  md:  '0 4px 12px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.03)',
  lg:  '0 8px 24px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.04)',
  xl:  '0 20px 60px rgba(0, 0, 0, 0.12), 0 8px 20px rgba(0, 0, 0, 0.06)',

  // Component-specific
  card:      '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
  cardHover: '0 4px 12px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.03)',
  dropdown:  '0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.04)',
  modal:     '0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 20px rgba(0, 0, 0, 0.08)',
  sidebar:   '2px 0 8px rgba(0, 0, 0, 0.06)',
  focusRing: '0 0 0 3px rgba(197, 164, 78, 0.2)',
  goldGlow:  '0 0 16px rgba(197, 164, 78, 0.12)',
} as const;

// ─────────────────────────────────────────────────────────────────────
// TRANSITIONS
// ─────────────────────────────────────────────────────────────────────

export const transitions = {
  fast:    '120ms cubic-bezier(0.4, 0, 0.2, 1)',
  DEFAULT: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow:    '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  spring:  '400ms cubic-bezier(0.34, 1.56, 0.64, 1)',

  // Property-specific
  colors:    'color 200ms, background-color 200ms, border-color 200ms',
  transform: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  shadow:    'box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  opacity:   'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// ─────────────────────────────────────────────────────────────────────
// CHART COLORS (for Recharts and data visualizations)
// ─────────────────────────────────────────────────────────────────────

export const chart = {
  primary:  '#0F1923',
  accent:   '#C5A44E',

  // Ordered series palette — distinct, accessible, professional
  series: [
    '#2563EB',  // Blue
    '#059669',  // Emerald
    '#D97706',  // Amber
    '#DC2626',  // Red
    '#7C3AED',  // Purple
    '#0891B2',  // Cyan
    '#C5A44E',  // Gold
    '#475467',  // Grey
  ] as const,

  // Chart chrome
  grid:       '#F2F4F7',
  gridStrong: '#EAECF0',
  axis:       '#9CA3AF',
  axisLabel:  '#667085',
  crosshair:  '#D0D5DD',

  tooltip: {
    bg:     '#FFFFFF',
    border: '#E5E7EB',
    shadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
    text:   '#111827',
    label:  '#667085',
  },
} as const;

// ─────────────────────────────────────────────────────────────────────
// CSS VARIABLE REFERENCES
// ─────────────────────────────────────────────────────────────────────
// Use these when you need var() references for inline styles.

export const cssVar = {
  // Brand
  navy:         'var(--color-rr-navy)',
  gold:         'var(--color-rr-gold)',
  goldDim:      'var(--color-rr-gold-dim)',
  goldLight:    'var(--color-rr-gold-light)',

  // Semantic backgrounds
  bg:           'var(--color-rr-bg)',
  bgSecondary:  'var(--color-rr-bg-secondary)',
  bgTertiary:   'var(--color-rr-bg-tertiary)',

  // Text
  text:         'var(--color-rr-text)',
  textDim:      'var(--color-rr-text-dim)',
  textMuted:    'var(--color-rr-text-muted)',

  // Borders
  border:       'var(--color-rr-border)',

  // Status
  success:      'var(--color-rr-success)',
  warning:      'var(--color-rr-warning)',
  danger:       'var(--color-rr-danger)',
  info:         'var(--color-rr-info)',

  // Typography
  fontHeading:  'var(--font-heading)',
  fontBody:     'var(--font-body)',
  fontMono:     'var(--font-mono)',
} as const;
