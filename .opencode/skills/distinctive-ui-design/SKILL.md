---
name: distinctive-ui-design
description: Use when building ANY UI — a page, component, or app. Forces a bold, intentional aesthetic direction and bans the generic "AI slop" look (Inter + purple-gradient-on-white + centered hero + equal cards). Constrained models default hard to that mean; this makes them choose.
---

# Distinctive UI Design

Constrained models converge on one look: Inter/system font, blue-or-purple gradient on white,
centered hero, three equal feature cards, library-default components. It's competent and
forgettable — because the *average* of the training data is exactly that. This skill forces a
chosen aesthetic and rejects the defaults.

## Step 1 — Commit to a direction BEFORE writing any markup
Answer in one line each:
- **Purpose & audience** — who uses this, to do what?
- **Tone — pick an EXTREME** (do not hedge to the safe middle): brutally minimal · maximalist ·
  retro-futurist · editorial/magazine · brutalist/raw · art-deco/geometric · organic/natural ·
  luxury/refined · playful/toy · industrial/utilitarian.
- **Differentiation** — the ONE thing someone remembers afterward. If you can't name it, you
  don't have a design yet.

Intentionality beats intensity: refined minimalism and loud maximalism both win; the timid
middle loses.

## The levers — pull them hard
- **Typography** carries the most character: a distinctive display font + a refined body font.
  NEVER make Inter / Roboto / Arial / system-ui the personality (and don't reflexively reach for
  the overused "Space Grotesk" either).
- **Color:** one dominant color + a sharp accent, defined as CSS variables. Timid, evenly-spread
  palettes read generic. BANNED: purple/blue gradient on white.
- **Motion:** ONE well-orchestrated page load with staggered reveals (`animation-delay`) delivers
  more delight than scattered micro-interactions. Add hover/scroll states that surprise.
- **Composition:** asymmetry, overlap, diagonal flow, grid-breaking elements; intentional
  negative space OR controlled density — not another centered column of equal cards.
- **Atmosphere:** backgrounds carry depth — gradient mesh, noise/grain, geometric pattern,
  layered transparency, dramatic shadow, custom cursor — not a flat solid fill.

## Match complexity to the vision
Maximalist → elaborate code, orchestrated motion/effects. Minimalist → restraint: precise
spacing, typographic detail, subtle craft. Elegance = executing the chosen vision fully.

Build on a token system (`design-tokens` pattern) so the aesthetic is consistent and cheap to
tune.

## Anti-slop checklist — if the output ships ANY of these, redo it
- [ ] Generic font as the identity (Inter/Roboto/Arial/system, or reflexive Space Grotesk)
- [ ] Purple/blue gradient on white
- [ ] Centered hero + three equal feature cards + generic footer
- [ ] Default component-library styling with no point of view
- [ ] Looks like the last UI you built — vary theme, font, and aesthetic every time

## If a brand/design system exists, honor it
A project with brand tokens, fonts, or a voice wins over a fresh direction — extend it, don't
override it.
