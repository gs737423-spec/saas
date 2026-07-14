# Motion Design System

Infrastructure only. Nothing in this document describes an animation that
is currently visible in the app — every class and helper listed here is
defined but unapplied. This is the foundation the next phase will build on.

## Arquitetura

```
src/styles/motion-tokens.css   CSS custom properties (durations, easing, scale, ...)
src/styles/motion.css          Utility classes built on those tokens
src/lib/motion.ts              JS/TS helpers (stagger, counter, reduced-motion, chart props)
src/components/common/Skeleton.tsx   Reusable loading placeholder (unused)
```

`motion-tokens.css` and `motion.css` are imported once, near the top of
`src/index.css`, right after `@import "tailwindcss"` and before the
`@theme` block. Import order matters for CSS (`@import` must precede
other rules) but doesn't affect specificity — nothing in motion.css
overrides existing component styles because no component references its
classes yet.

## Tokens (`src/styles/motion-tokens.css`)

All under the `--motion-*` namespace so they never collide with the
existing `--color-*` / `--breakpoint-nav` tokens in `index.css`.

| Token | Value | Use for |
|---|---|---|
| `--motion-duration-ultrafast` | 100ms | button press feedback |
| `--motion-duration-fast` | 160ms | hover states |
| `--motion-duration-normal` | 240ms | fades, small entrances |
| `--motion-duration-slow` | 400ms | large entrances, chart draw-in |
| `--motion-ease-standard` | cubic-bezier(0.4,0,0.2,1) | default, symmetric |
| `--motion-ease-enter` | cubic-bezier(0.16,1,0.3,1) | things arriving (decelerate) |
| `--motion-ease-exit` | cubic-bezier(0.7,0,0.84,0) | things leaving (accelerate) |
| `--motion-ease-hover` | cubic-bezier(0.22,1,0.36,1) | matches existing `.overview-card-hover` |
| `--motion-ease-button` | cubic-bezier(0.34,1.56,0.64,1) | slight overshoot, tactile press |
| `--motion-scale-hover` | 1.02 | hover scale |
| `--motion-scale-active` | 0.98 | press/active scale |
| `--motion-translate-hover` | -4px | matches existing card hover lift |
| `--motion-translate-slide` | 12px | entrance slide distance |
| `--motion-glow-intensity` | 0.55 | coefficient, not a raw shadow value |
| `--motion-shadow-intensity` | 0.65 | coefficient for the shadow scale |
| `--motion-stagger-step` | 40ms | base delay between sequenced items |

`--motion-ease-hover` and `--motion-translate-hover` were deliberately
set to match the values already hardcoded in `.overview-card-hover` in
`index.css` (`cubic-bezier(0.22, 1, 0.36, 1)`, `translateY(-4px)`) — so
when that class is eventually migrated to the token system, the motion
won't change, only where the number lives.

## Utility classes (`src/styles/motion.css`)

All under `@layer utilities`. None are applied anywhere in the codebase.

- **`motion-hover`** — generic scale-on-hover (`--motion-scale-hover`).
- **`motion-card`** — hover lift (translateY), for card-like surfaces.
- **`motion-button`** — press scale + color/shadow transition.
- **`motion-input`** — border/shadow transition for focus states.
- **`motion-fade`** / **`motion-slide`** / **`motion-scale`** — entrance
  primitives, gated by `[data-state="visible"]` so a component can add the
  class at rest (`opacity:0`) and flip the attribute once mounted/in-view.
- **`motion-glow`** / **`motion-glow-hover`** — soft colored halo via
  `filter: drop-shadow(...)`, color supplied through `--motion-glow-color`.
- **`motion-skeleton`** — shimmer loading placeholder (pure CSS sweep).
- **`motion-number`** — marks text as GPU-composited (`tabular-nums`,
  `will-change: contents`) for use with the `useAnimatedNumber` counter.
- **`motion-chart-draw`** / **`motion-chart-fade`** — timing-only classes
  for SVG chart entrances; consumers still drive the actual
  `stroke-dashoffset` / visibility.

Also defined, not yet consumed by any component:
- **Elevation**: `.motion-surface-1/2/3` (static shadow levels),
  `.motion-elevate-hover`, `.motion-elevate-active`.
- **Shadow scale**: `--motion-shadow-1/2/3`, each built from
  `--motion-shadow-intensity` so the whole scale can be dimmed/intensified
  by changing one number.
- **Focus system**: `.motion-focus-ring`, using `:focus-visible` so mouse
  clicks never show a ring, only keyboard navigation does.

A single `@media (prefers-reduced-motion: reduce)` block at the bottom of
motion.css disables every transition/animation class above at once —
individual classes don't each need their own query.

## JS/TS helpers (`src/lib/motion.ts`)

- **`motionTokens`** — the CSS tokens mirrored as JS numbers/arrays, for
  code paths that can't read CSS custom properties (Recharts animation
  props, Web Animations API, etc).
- **`staggerDelays(count, step?)`** / **`staggerDelayFor(index, step?)`** —
  pure functions returning ms delays for sequenced entrances.
- **`useReducedMotion()`** — reactive hook mirroring the OS preference, for
  JS-driven animation that CSS alone can't gate.
- **`useAnimatedNumber(value, duration?)`** — counts a displayed number
  from its previous value to a new one using `requestAnimationFrame` and
  the `enter` easing curve; returns `value` immediately (no animation) when
  reduced motion is on.
- **`chartAnimationProps(duration?)`** — returns a `{ isAnimationActive,
  animationDuration, animationEasing }` object shaped for Recharts, so
  every chart in the app that opts in uses the same duration/easing
  instead of picking its own.

## Skeleton component (`src/components/common/Skeleton.tsx`)

`<Skeleton className="h-4 w-24" />` — thin wrapper around `.motion-skeleton`.
Not rendered by any page yet.

## Boas práticas (regras que este sistema segue e que o futuro trabalho deve seguir)

- Animate only `transform`, `opacity`, and (sparingly) `filter`. These are
  GPU-compositable and never trigger layout or paint of surrounding
  content — the rest of the box model (`width`, `height`, `top`, `left`,
  `margin`, `padding`) causes reflow and is off-limits for animation.
- Never `transition: all`. Name the exact properties.
- Never hardcode a duration or easing curve inline — always reference a
  `--motion-*` token (CSS) or `motionTokens` field (TS).
- No JavaScript for a hover/press/focus effect a CSS pseudo-class can
  express (`:hover`, `:active`, `:focus-visible`). Reach for `useAnimatedNumber`
  or `staggerDelays` only when the effect genuinely needs render-time logic
  (counting, sequencing across a list, respecting reduced motion in a
  non-CSS context).
- Every reusable motion effect gets a class or a helper here — not a
  bespoke `transition-*` combo written inline in a component.

## O que nunca utilizar

- `transition: all` (or Tailwind's `transition-all`) once a component is
  migrated to this system — pick the exact properties.
- Animating `width`, `height`, `top`, `left`, `margin`, or `padding`.
- A duration or cubic-bezier value that isn't one of the tokens above.
- `box-shadow` recipes invented per-component — pull from the shadow
  scale (`--motion-shadow-1/2/3`) once a component adopts it.
- Heavy, spread-out `filter: blur()` for decorative motion — the app
  already had a performance incident from exactly this (animated
  background blur orbs caused scroll jank; see the fix in the git log).
  The `motion-glow` class intentionally uses a small `drop-shadow` radius,
  not a large blur.

## Estado atual — auditoria

- `npm run build`: clean (TypeScript + Vite), no new warnings.
- Zero elements in the running app carry any `motion-*` class
  (verified in-browser: `document.querySelectorAll('[class*="motion-"]')`
  → 0).
- Existing `transition-all` usage in components (15 call sites, all
  Tailwind's `transition-all` utility class, no raw CSS `transition: all`)
  was **not** touched in this pass — changing those files risked a visual
  or behavioral diff, which this phase explicitly forbids. They're the
  natural first migration targets for the next phase.

## Como será utilizado nas próximas etapas

This phase only builds the vocabulary. The next phase is expected to:

1. Migrate existing ad-hoc transitions (the 15 `transition-all` call
   sites, `.overview-card-hover`, `.brand-mark` hover, etc.) onto the
   token system and utility classes — same visual result, one source of
   truth for the numbers.
2. Apply `motion-fade` / `motion-slide` / `motion-scale` to page/section
   entrances (e.g. the `page-transition` wrapper in `App.tsx`).
3. Wire `useAnimatedNumber` into KPI card values (Dashboard, Estoque,
   Marketplaces, Produtos) so they count up on data change instead of
   snapping.
4. Apply `chartAnimationProps` to the Recharts charts (`RevenueByChannelChart`,
   `SalesTrendChart`, etc.) for consistent draw-in timing.
5. Render `<Skeleton />` during the Estoque real-data fetch
   (`src/pages/Estoque.tsx`'s `loading` state) instead of an empty gap.
6. Apply `motion-focus-ring` to inputs/buttons/cards/links platform-wide
   for consistent, accessible focus states.

Nothing above happens in this phase.
