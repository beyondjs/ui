# Local UI 0.24.0 verification — an outage said once

Evidence baseline: UI `c4a55f4` (0.23.0, a region's wait) plus this change, made in a worktree on 2026-10-23. Token set 0.6.0 is unchanged. 0.22.0 is held by the unmerged `Lanes` round and is not part of this line. Implementation is not the owner's acceptance.

## Why

On 2026-10-23 the owner reviewed Conduict Home while Beyond Accounts was not answering. Conduict's E370 had made the page's four failed reads one `Recovery` notice, but the notice listed them: four body-size sentences spread by the browser's default paragraph margins, each with its own Technical details, a reason under one of them, no status mark, and Try again below the fold. The owner found the list of very low quality and asked for the proposal to be implemented so that every product of the suite says an outage the same way. The family registers it as D163.

## What changed

- **`Recovery` is one line.** The globe mark, who did not answer (`title`), the last-tried line and one Try again at the line's end, in the warning tone; under the words below 480 px. It lists nothing; its entries' titles appear only in its evidence. Its hidden status says the title once when it appears. `title` and `whole` can change in place. The per-read view (`src/dom/again/entry.js`) is removed and an entry's `reason` is no longer drawn.
- **One Technical details per incident.** `TechnicalDetails` takes `entries` (`{ label, text, request, time }`): a table with a row per read (`affected`, request, time), the source's words once when every read said the same and under their row otherwise, copied as one block per read. The disclosure keeps its expansion, a focused Copy and a copy's result while reads come and go.
- **The places.** `EmptyState` has `kind: 'outage'` ("Not available right now", «No disponible en este momento», the globe in the warning color, never an action) and, for every kind, `frame: false` inside a region framed already. `Section` takes `unavailable` (option, method, React prop) and `updated`, which draws `LastUpdate` ("Last updated 12:04", «Última actualización: 12:04»; "May be out of date" when the time is unknown) above content kept from an earlier read.
- **The page form.** `whole` draws the notice as the page's body in `Unavailable`'s form and geometry, its title a heading (`level`).
- **Lists.** `Collection` takes `recovery`, `outage(error)` and `details(error)`: a failure of the notice's cause says "Not available right now" in the list's place, joins the notice, and leaves it when the list answers or goes away. Other failures keep the list's own answer.
- **React.** `Recovery` (from props: `reads`, `whole`; or `notice` from `useRecovery`), `useRecovery`, `LastUpdate`; `Section`'s `unavailable` and `updated`; `EmptyState`'s `outage` and `frame`; `Collection`'s `recovery`, `outage` and `details`; `TechnicalDetails`' `entries`. The React notice is the DOM class, so timing, markup and words have one implementation.

## Executed checks

- Unit suite: 777 of 777 (`npm test`), including the rewritten `tests/recovery.test.mjs`, `tests/outage-places.test.mjs` and the React forms under StrictMode in `tests/recovery-react.test.mjs`.
- Declarations: `npm run types` passes with the fixtures `tests/fixtures/types/recovery.ts` and `.tsx`, one of which expects a `reason` to be refused.
- Browser acceptance, installed from the packed archive: see below.

## Artifact

To be recorded when the archive is packed.
