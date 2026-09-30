# Unit test fixtures

- `branding-tokens-0.1.0.css`: the token sheet the family reference (Branding) generated from its own `src/foundations/` on 2026-09-23, before the canonical source moved into this package. The package reproduced it byte for byte at token set 0.1.0; `tests/tokens.test.mjs` proves every later set is this sheet with exactly the lines it lists changed (0.2.0: the header, `border-control`, weight 400, the label and the window elevations). Never regenerate it: it is the baseline of the extraction.
- `people.mjs`: an entity source for the picker (people with teams, one disabled), with controllable delay, failure and paging.
- `notices.mjs`: a notification adapter over in-memory items shaped as the product relay of `beyond-notifications/1` answers, with switches for failure, unavailability and unreachable products, and a `shape` switch that answers as Beyond Projects does instead (`sources: [{ product, state }]` and a summary `{ unread, more, sources }` bounded by `bound`).
- `rows.mjs`: request rows for the collection.
- `family.mjs`: `beyond-family/1` descriptors as a product relay answers them (inside a project, outside one, a person with no organization) and a Spanish label set for the family bar.
- `controls.mjs`: a scene of every component that draws an icon-only control, in the state that shows it, for the icon-only survey.
- `shelf.mjs`: an in-memory `Storage` for `Preferences`, which can refuse every access as a browser with blocked site data does.
- `types/`: a typed plain DOM consumer (`dom.ts`) and a typed React consumer (`consumer.tsx`) with their `tsconfig.json`; `npm run types` compiles them and never runs them.
