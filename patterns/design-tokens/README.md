---
id: design-tokens
language: css
version_bounds: "any modern browser (CSS custom properties, clamp())"
last_validated: 2026-06-21
success_rate: null
applicability:
  - "starting any web UI and you want a cohesive, tunable aesthetic"
  - "you keep hardcoding hex colors and px sizes and the design drifts"
forbidden_contexts:
  - "a one-off static page with no theming needs"
  - "a design system whose tokens already come from a component library you must match"
failure_modes:
  - "weak models hardcode hex/px inline -> inconsistent, impossible to retheme"
  - "defaulting to Inter + neutral grays + no dark mode (generic slop)"
  - "a flat single-shadow, single-radius look with no scale"
topology: "styling / theming foundation"
---

# Pattern: design-tokens

**Language / stack:** CSS custom properties (framework-agnostic)

## When to use
The foundation under any beautiful UI: define the aesthetic ONCE as tokens (type, color, space,
radius, shadow, motion) and reference them everywhere. This is what makes a look cohesive and
cheap to tune — and it's exactly the step a constrained model skips when it scatters hardcoded
values.

## When NOT to use
- A trivial static page with no theming.
- A project already standardized on a component library's tokens — match those instead.

## Key decisions (the part the model can't derive)
- **Tokens encode a COMMITTED direction, not neutral defaults.** The example commits to a *warm
  editorial* aesthetic: a serif display (Fraunces) + a grotesque body (Schibsted Grotesk), an
  ink/paper/ember palette — deliberately NOT Inter + blue. Swap the values for your own bold
  direction (see `distinctive-ui-design`); keep the structure.
- **Two layers:** a raw palette (`--ink-900`) and *semantic* tokens (`--color-text`,
  `--color-accent`). Components use the semantic layer, so retheming + dark mode = swapping the
  semantic layer only.
- **Scales, not one-offs:** a modular fluid type scale via `clamp()`, a spacing scale, a radius
  scale, and *layered* shadows. Scales are what read as "designed."
- **Motion tokens** (durations + easings) keep animation consistent and intentional.
- **Dark mode** flips the semantic layer under `prefers-color-scheme`, raw palette untouched.

## Gotchas
- Reference semantic tokens in components, never raw palette tokens — that's what makes
  retheming one-line.
- Load the actual fonts (e.g. Google Fonts) or the distinctive type silently falls back.

## The example
See `tokens.css`.
