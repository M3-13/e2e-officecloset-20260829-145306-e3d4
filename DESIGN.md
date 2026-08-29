# Design — Project Identity

> This document is project-long-lived. Tokens are not changed without
> the Architect's approval. Developers MUST use these tokens
> instead of improvising their own colors/spacings.

## Style Direction

Eleganter Hollywood-Red-Carpet-Look: warmer, fast schwarzer Hintergrund mit Champagner-Gold als Akzent und klassischer Serifen-Typografie, ruhig und hochwertig wie eine Abendgarderobe.

## Colors

- `--color-bg`: **#0D0B0C**
- `--color-fg`: **#F5EFE6**
- `--color-accent`: **#C8A24A**
- `--color-border`: **#3A2F2A**
- `--color-muted`: **#8A7A6E**

## Typography

- `font_family`: Georgia, 'Times New Roman', serif
- `heading_weight`: 600
- `body_weight`: 400

## Spacing Scale

- `--space-0`: 4px
- `--space-1`: 8px
- `--space-2`: 12px
- `--space-3`: 16px
- `--space-4`: 24px
- `--space-5`: 32px
- `--space-6`: 48px

## Border-Radii

- `--radius-sm`: 6px
- `--radius-md`: 12px
- `--radius-lg`: 20px
- `--radius-pill`: 999px

## Components

### Button

min-height 44px (mobile tap), padding 12px 24px, radius md, font-weight 600, letter-spacing 0.02em, transition 150ms. Primary: bg=accent #C8A24A, text=bg #0D0B0C, hover=#D9B45C, active=#B18A3C, disabled opacity 0.45. Secondary: bg transparent, border 1px solid accent, text=accent, hover bg rgba(200,162,74,0.12). Danger: bg=#9C2B2B, text=#F5EFE6, hover=#B33A3A, active=#7E2222.

### Card

bg=#141112, border 1px solid border, radius lg (20px), padding 24px, optional 2px gold top hairline via accent für hervorgehobene Outfit-Karten.

### Input

min-height 44px, bg=#141112, border 1px solid border, radius md, padding 12px 16px, text=fg, placeholder=muted; focus: border=accent, box-shadow 0 0 0 3px rgba(200,162,74,0.25); error: border=#9C2B2B.

### NavBar

height 64px, bg=bg, border-bottom 1px solid border, sticky top; Markenname in Serif mit accent, Links in muted, aktiver Link fg.

### CategoryChip

height 36px, padding 0 16px, radius pill, border 1px solid accent, text=accent, bg transparent; active: bg=accent, text=bg; hover: bg rgba(200,162,74,0.12).

### ImagePlaceholder

aspect-ratio 3/4, radius md, bg=#1A1614, border 1px dashed border, zentriertes goldenes Garderoben-/Kleiderbügel-Symbol in accent bei 40% Deckkraft, Text in muted.

### Modal

bg=#141112, border 1px solid border, radius lg, padding 24px, max-width 480px, backdrop rgba(0,0,0,0.72), Schließen-Button min 44px.

### Alert

padding 12px 16px, radius md, border 1px solid; success: border/accent text #9FCB8B auf rgba(159,203,139,0.10); error: border #9C2B2B, text #E4A0A0 auf rgba(156,43,43,0.10); info: border=border, text=muted.

## Layout Principles

- Container max-width 1200px, zentriert, Seitenabstand 16px mobil / 24px ab 640px
- Breakpoints: 640px (mobile), 960px (tablet), 1200px (desktop)
- Garderoben-Grid: auto-fill, minmax(220px, 1fr), gap 24px
- Abschnittsabstand 48px, innerhalb von Karten 16-24px
- Sticky NavBar mit maximaler Breite 1200px; Formulare maximal 520px breit zentrieren
- Destruktive Aktionen räumlich von primären Aktionen trennen und in Danger-Optik darstellen
