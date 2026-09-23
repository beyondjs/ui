# Unit test fixtures

- `branding-tokens-0.1.0.css`: the token sheet the family reference (Branding) generated from its own `src/foundations/` on 2026-09-23, before the canonical source moved into this package. `tests/tokens.test.mjs` proves the package reproduces it byte for byte. Never regenerate it: it is the baseline of the extraction.
- `people.mjs`: an entity source for the picker (people with teams, one disabled), with controllable delay, failure and paging.
- `notices.mjs`: a notification adapter over in-memory items shaped as the product relay of `beyond-notifications/1` answers, with switches for failure, unavailability and unreachable products.
- `rows.mjs`: request rows for the collection.
- `types/`: a typed plain DOM consumer (`dom.ts`) and a typed React consumer (`consumer.tsx`) with their `tsconfig.json`; `npm run types` compiles them and never runs them.
