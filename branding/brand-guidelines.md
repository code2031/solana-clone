# SolClone Brand Guidelines

## Brand Identity

**Name:** SolClone
**Token Symbol:** SCLONE
**Tagline:** High-Performance Blockchain, Redefined
**Tone:** Technical, trustworthy, cutting-edge

---

## Logo

### Primary Logo

The SolClone logo is a hexagonal mark with a purple-to-green gradient, containing the letters "SC" in clean, bold typography. The hexagon represents the block structure of the chain, while the gradient conveys the energy and speed of the network.

- File: `logo.svg`
- Minimum size: 32px height
- Clear space: maintain at least 50% of the logo height as padding on all sides

### Logo Variants

| Variant            | Usage                                     |
|--------------------|-------------------------------------------|
| Full color         | Primary use on dark backgrounds            |
| Monochrome white   | Use on dark or complex backgrounds         |
| Monochrome dark    | Use on light backgrounds                   |
| Icon only          | Favicons, app icons, small contexts        |

### Logo Misuse

Do not:
- Rotate or skew the logo
- Change the gradient colors
- Add drop shadows or effects
- Place on low-contrast backgrounds
- Stretch or distort the proportions
- Use the logo smaller than 32px in height

---

## Color Palette

### Primary Colors

| Color          | Hex       | RGB             | Usage                         |
|----------------|-----------|-----------------|-------------------------------|
| Purple         | `#9945FF` | 153, 69, 255    | Primary brand color, CTAs      |
| Green          | `#14F195` | 20, 241, 149    | Accent, success states, highlights |

### Secondary Colors

| Color          | Hex       | RGB             | Usage                         |
|----------------|-----------|-----------------|-------------------------------|
| Dark BG        | `#0F0B2E` | 15, 11, 46      | Primary background             |
| Deep Purple    | `#1A1145` | 26, 17, 69      | Card backgrounds, elevated surfaces |
| Light          | `#E8E8E8` | 232, 232, 232   | Body text on dark backgrounds  |
| White          | `#FFFFFF` | 255, 255, 255   | Headings, high-emphasis text   |

### Gradient

The primary brand gradient flows from Purple to Green:

```
#9945FF -----> #14F195
```

CSS:
```css
background: linear-gradient(135deg, #9945FF 0%, #14F195 100%);
```

### Semantic Colors

| Purpose     | Color     | Hex       |
|-------------|-----------|-----------|
| Success     | Green     | `#14F195` |
| Error       | Red       | `#FF4545` |
| Warning     | Amber     | `#FFB545` |
| Info        | Blue      | `#45A4FF` |

---

## Typography

### UI Typography

**Primary Font:** Inter

| Style        | Weight    | Size   | Usage                  |
|--------------|-----------|--------|------------------------|
| Display      | Bold 700  | 48px   | Hero headings          |
| H1           | Bold 700  | 36px   | Page titles            |
| H2           | SemiBold 600 | 28px | Section headings       |
| H3           | SemiBold 600 | 22px | Subsection headings    |
| Body         | Regular 400  | 16px | Body text              |
| Body Small   | Regular 400  | 14px | Secondary text         |
| Caption      | Medium 500   | 12px | Labels, metadata       |

### Code Typography

**Code Font:** JetBrains Mono

| Style        | Weight    | Size   | Usage                  |
|--------------|-----------|--------|------------------------|
| Code Block   | Regular 400  | 14px | Code examples          |
| Inline Code  | Regular 400  | 14px | Inline code references |
| Terminal      | Regular 400  | 13px | CLI output             |

### Font Loading

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
```

---

## Iconography

- Use outlined icons at 24px default size
- Stroke width: 1.5px
- Icons should use the Light (`#E8E8E8`) color on dark backgrounds
- Active/selected icons use Green (`#14F195`)

---

## Spacing and Layout

### Spacing Scale

| Token   | Value  |
|---------|--------|
| `xs`    | 4px    |
| `sm`    | 8px    |
| `md`    | 16px   |
| `lg`    | 24px   |
| `xl`    | 32px   |
| `2xl`   | 48px   |
| `3xl`   | 64px   |

### Border Radius

| Element     | Radius |
|-------------|--------|
| Buttons     | 8px    |
| Cards       | 12px   |
| Modals      | 16px   |
| Pills/Tags  | 9999px |

---

## UI Components

### Buttons

```css
/* Primary */
.btn-primary {
  background: linear-gradient(135deg, #9945FF 0%, #14F195 100%);
  color: #FFFFFF;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 16px;
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
}

/* Secondary */
.btn-secondary {
  background: transparent;
  color: #E8E8E8;
  border: 1px solid #9945FF;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 16px;
  padding: 12px 24px;
  border-radius: 8px;
}

/* Ghost */
.btn-ghost {
  background: transparent;
  color: #14F195;
  border: none;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 16px;
  padding: 12px 24px;
}
```

### Cards

```css
.card {
  background: #1A1145;
  border: 1px solid rgba(153, 69, 255, 0.2);
  border-radius: 12px;
  padding: 24px;
}
```

---

## Voice and Tone

### Writing Principles

1. **Technical accuracy** -- never sacrifice correctness for simplicity
2. **Concise** -- say more with fewer words
3. **Developer-first** -- assume the reader writes code
4. **Confident but not arrogant** -- present facts, avoid hype
5. **Accessible** -- complex topics explained clearly, jargon defined on first use

### Do

- Use active voice: "Validators process transactions"
- Be specific: "Finality in 400ms" not "Very fast finality"
- Lead with the benefit: "Deploy in seconds with a single CLI command"
- Include code examples wherever possible

### Don't

- Use marketing superlatives: "revolutionary", "game-changing"
- Make unsubstantiated claims
- Use informal slang or memes in documentation
- Assume the reader knows blockchain-specific jargon without context

### Terminology

| Use This          | Instead Of          |
|-------------------|---------------------|
| Program           | Smart contract       |
| Account           | State                |
| Lamports          | Wei / Gwei           |
| Validator         | Miner                |
| Epoch             | Period               |
| SCLONE            | Token / Coin         |

---

## Social Media and Marketing

### Profile Images

- Use the hexagonal logo mark on solid `#0F0B2E` background
- Minimum 400x400px for social profile images

### Banner Images

- Use the full gradient as background
- Place the SolClone wordmark centered
- Recommended dimensions: 1500x500px (Twitter/X), 1584x396px (LinkedIn)

### Hashtags

- Primary: `#SolClone`
- Secondary: `#SCLONE`, `#BuildOnSolClone`

---

## File Formats

| Asset          | Format          | Notes                         |
|----------------|-----------------|-------------------------------|
| Logo (vector)  | SVG             | Primary format for all uses    |
| Logo (raster)  | PNG (2x, 3x)   | For contexts that need raster  |
| Favicon        | ICO + PNG       | 16x16, 32x32, 180x180         |
| OG Image       | PNG 1200x630    | For social media link previews |
