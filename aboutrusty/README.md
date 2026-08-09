# About Rusty

The marketing/docs site for **rusty**, the durable agent runtime built in Rust — [aboutrusty.com](https://aboutrusty.com/).

The site is static marketing and documentation content only. The runtime itself lives in a separate repo: [github.com/dev-amjad-shaikh/rusty](https://github.com/dev-amjad-shaikh/rusty). Treat that repo as ground truth for every factual claim on this site (API names, versions, limits); do not invent facts the source does not support.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS + shadcn/ui

## Scripts

```bash
npm install
npm run dev    # local dev server
npm run build  # typecheck (tsc -b) + production build
```

## Content layout

Content is authored as typed TypeScript modules — no CMS, no markdown pipeline.

- `src/content/learn/` — learn/docs content modules
- `src/sections/` — page sections
- `src/pages/` — route components

## Conventions

- Voice: terse, precise, engineering-first. No marketing hype.
- The differentiator story is durability and evidence (checkpointed super-steps, interrupts, replay, flight recorder) — not framework comparisons.
- Dark ink theme; rust-orange `#FE6B35` accent.
