# Hisab design system: Neel & Haldi

Hisab is a *bahi-khata*, a merchant's account book, made digital. The visual language borrows from two things
the Tirupur textile trade already knows: **neel** (indigo dye) for the page and ink, and **haldi** (turmeric) for
the one mark that matters. Everything else is ruled lines, stamps and numbers.

Tokens live in `src/index.css`. Primitives live in `src/ui/`. Views compose primitives only.

## Principles

1. **Numbers are the hero.** Money and hashes are set in Geist Mono with tabular figures. Rupees always use
   Indian grouping (`₹35,88,585`). Nothing decorative competes with an amount.
2. **One accent, used as a progress ladder.** Turmeric intensity *is* the state of a receivable:
   OPEN is plain ink, FINANCED is a turmeric outline, PARTIAL is a dashed turmeric outline, REALISED is a solid
   turmeric stamp. Sindoor red appears only for errors, disputes and the double-finance revert.
3. **Ruled, not boxed.** Group with hairlines and space. A raised panel means "this is a separate document"
   (a shipping bill, an MT103, a phone). Lists inside panels are ruled rows, never nested cards.
4. **Motion explains state, nothing else.** See Motion.

## Colour

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | `#edeff7` | `#0b0d1f` | page |
| `surface` | `#f8f9fd` | `#121534` | panels |
| `raised` | `#ffffff` | `#1a1e45` | selected row, popovers, phone |
| `sunken` | `#e2e5f1` | `#0e1128` | code / MT103 wells, inputs |
| `line` / `line-strong` | `#cdd1e6` / `#a9afd0` | `#2a2f63` / `#3d4386` | hairlines / focus-adjacent borders |
| `text` / `muted` / `faint` | `#14173a` / `#545a8c` / `#7a80ad` | `#e9eaf6` / `#9095c6` / `#6a6fa3` | ink ladder (`faint` only for ≥14px secondary meta) |
| `accent` | `#e3ae45` | `#e3ae45` | turmeric fills, spine, focus ring |
| `accent-ink` | `#17110a` | `#17110a` | text on turmeric fills |
| `accent-text` | `#8a5a06` | `#ecc06a` | turmeric used as text on the page |
| `accent-soft` | `#f7e7c3` | `#3a3020` | selected / highlighted row wash |
| `danger` / `danger-soft` | `#b3362b` / `#f6dcd8` | `#f07a6e` / `#3d1c24` | errors only |

All text pairs pass WCAG AA. Theme follows `prefers-color-scheme` and can be toggled. The choice is stored per
browser, and `data-theme` is set on `<html>` before first paint.

## Type

| Role | Family | Setting |
|---|---|---|
| Display (view titles, SB numbers, big amounts) | Bricolage Grotesque Variable | `font-display`, weight 600–700, `tracking-tight` |
| Body, labels, buttons | Hanken Grotesk Variable | `font-sans`, 14–15px base, weight 400/500/600 |
| Money, hashes, UTRs, MT103, timestamps | Geist Mono Variable | `font-mono tabular` |
| Wordmark only | Tiro Devanagari Hindi | `font-deva`, for हिसाब |

Scale: 12 / 13 / 14 / 16 / 20 / 28 / 40. No uppercase-tracked eyebrows above every block: at most one small label per
view. Labels in forms sit above inputs.

## Shape

- `rounded-ui` (6px, from the `--radius-ui` theme token) for every panel, button, input and tab.
- `rounded-stamp` (3px, from `--radius-stamp`) for state stamps only.
- No pills and no circles, except the phone frame and avatar-free org initials.
- Shadows only on `raised` things that float (phone, toasts, popovers). Use `shadow-lift`, which is tinted by `--c-shadow`.

## Primitives (`src/ui/`)

`Button` (primary = turmeric fill, secondary = hairline, ghost, danger; sizes sm/md; `loading` shows an inline
mono ellipsis, not a spinner) · `Stamp` (state badge, the ladder above) · `Panel` (surface + hairline, optional
title row) · `Money` (INR/USD with Indian grouping, mono, optional `size`) · `Hash` (shortened `0x1a2b…9f0e`,
copy-on-click with a check icon swap) · `Field` (label above, helper/error below) · `Slider` (range + mono value) ·
`Tabs` (persona switcher, underline indicator with Motion `layoutId`) · `Empty` (icon + one line + the action that
fills it) · `Skeleton` (shape-matched blocks, shimmer disabled under reduced motion) · `RuleRow` (a ruled
key/value or table row).

Icons: `@phosphor-icons/react`, weight `regular`, size 16/20. No emoji, no hand-drawn SVG.

## Motion

Library: `motion/react` for state transitions only. No smooth scroll, no canvas, no scroll-linked animation.

| Moment | Motion | Why |
|---|---|---|
| Receivable becomes REALISED | Stamp lands: scale 1.35 → 1, rotate −6° → −2°, 280ms ease-out | marks the loop closing |
| State stamp changes (OPEN → FINANCED) | cross-fade + 4px rise, 180ms | shows *what* changed |
| Phone notification arrives | slide in from top with spring, then a 2-cycle buzz | the demo's "cash, today" beat |
| Persona tab switch | underline slides via `layoutId` | shows where you are |
| `ALREADY_LOCKED` revert | banner shakes once, 3 cycles, 300ms | a refusal, felt |
| Toast | fade + 8px rise | feedback |

Entrances fire once. Under `prefers-reduced-motion`, every one of these becomes an instant state swap.

## Copy

Plain and specific. No em dashes, no "seamless", no cute labels. Amounts are exact, never rounded.

## Marketing surface (landing, `/start`, `/pay`)

The console rules above stay as they are. The public pages use the same tokens, with three differences:

- **Type.** Display sizes go past the console scale: headlines up to 76px, section titles up to 46px. The sizes live in `src/tempo/kit.tsx` (`H1`, `H2`, `H3`, `LEAD`); use those constants, never ad hoc sizes.
- **Motion.** A block may enter once as it scrolls into view (`Reveal`). The hero bill plays its life on a loop while it is on screen. Money figures count to their value when the value changes. Still no smooth-scroll library, no canvas, no scrubbed scroll animation, and everything is static under reduced motion.
- **Labels.** One small mono label (`LABEL`) for at most one section in three.

Shared pieces: `kit.tsx` (scale, `Section`, `Reveal`, `CountUp`), `BillCard.tsx` (one bill as a ledger page; the hero, the tour and the pay page all use it), `maths.ts` (the vault's waterfall in `bigint`, checked by `pnpm check:maths`), `chain.ts` (read-only `eth_call`).

Button labels are fixed per intent across the site: "Run your invoice", "Watch the pitch", "Get started", "Demo pay page", "View on explorer".
