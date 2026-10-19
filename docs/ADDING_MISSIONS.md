# Adding missions

## Folder layout

Add a lowercase kebab-case folder under `missions/` containing `mission.json` and `starter.js`.

## Required mission fields

`mission.json` must define a unique `id`, `title`, `subject` (one of the IDs in `src/lib/catalog.ts`), integer `difficulty` from 1 to 5, `briefing`, `symptom`, `entry`, `concepts` (array), at least two `hints`, and at least three `cases`. Each case needs a unique `id`, an `args` array, and an `expected` value. `starter.js` must define a function named by `entry` and should include both passing and failing cases.

## Generators

Write a deterministic generator that accepts a seed and returns generated starter code and test cases. Register it in `src/lib/generators/index.ts` under its mission folder name. Every generated mission must have at least two passing and two failing cases for each seed.

## Validation

Run `npm run validate:missions` to check mission metadata, starter behavior, generator determinism, and 100 generated seeds per registered generator.
