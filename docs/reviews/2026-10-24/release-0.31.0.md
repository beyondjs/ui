# Local UI 0.31.0: a product arrives once (D185)

Evidence baseline: UI `b73fdaf` (0.30.0, a resource page's raised panel) on `feature/next` plus this change (`86d9150`), made in a worktree on 2026-10-24 for the suite's round `arrived`. Token set 0.7.0, unchanged. Implementation is not the owner's acceptance.

The change was first built and checked as 0.30.0 over 0.29.0 (`f45b127`). Another assignment released 0.30.0 the same day, so it was rebased onto `b73fdaf`, renumbered 0.31.0 and checked again; only the version strings differ from that build in its own files.

## Why

On 2026-10-24 the owner watched Conduict open and asked for it in slow motion: the opening, the move to Home, the loading placeholders and the page itself happened "de manera tan rápida que se vuelve todo caótico". A capture of the local composition at about 60 frames a second counted six states in 1.1 s on Home:

1. the opening;
2. the identity crossing an empty page;
3. the page appearing already waiting;
4. the waits alone;
5. the content;
6. a 348 px jump as Home's setup checklist arrived above the regions.

Several of them lasted 0.1 to 0.4 s. Each rule fired as designed; together they read as chaos. The owner directed the proposal implemented at the highest standard, with its insights in the suite's guidelines: **D185, a product arrives once**. Only states a person can read are shown. The package carries its shared parts.

## What changed

- **`OpeningScreen`** (`src/opening/screen.js`). Once the product's root holds its structure with no step pending, the opening keeps covering it until the first screen is complete. Nothing drawn in the root waits for a first read any more (`waiting`, `Section`'s and React's `Waiting`, `skeleton`, `Collection`'s and `DataTable`'s placeholder rows; a wait in a part not drawn does not count), and the family bar has left `data-state="loading"`. It covers the structure for at most `OpeningScreen.budget`, 1 s, an engineering default, then hands over to what is drawn.
- **The controller.** While it covers a drawn structure the opening says no steps, and the product's last step ends at its structure, so "usual" measures the opening alone. An opening that already said its steps, or its recovery, hands over at the structure at once. A failure the product meets meanwhile is the product's to say: the opening steps aside. A product that names a step again (a sign-in) resumes the opening as before.
- **The landing** (`OpeningExit`). While the identity moves, the family bar is marked `data-bui-landing="flight"`: its wordmark and name wait hidden under the moving ones, and its separator and the product menu's chevron, which do not move, wait unseen. The rule holds for a bar drawn again during the flight. On landing (`landed`) they show where the moving ones arrived, the separator and the chevron fading in. Before, a bar that finished loading during the flight drew the product's name twice for three frames, and its separator crossed the moving wordmark. The person who reached recovery keeps a keyboard destination, now set by the exit itself.
- **The entrance.** The stage fades in over `--motion-standard` as the document first paints, only for a person who did not ask for less motion.
- **A wait only when it is slow** (`styles/feedback.css`). A region's wait and every standalone placeholder are in place, busy and announced at once, but seen only past a 300 ms grace, then fade in over `--motion-standard`. Under reduced motion they appear at the grace with no fading: the base stylesheet's reduced-motion rule leaves them their grace, which moves nothing. No content waits for a wait. A placeholder inside a wait is not graced twice. A loading line or a busy button that answers the person's own action is not a region's wait and shows at once.
- **Line counts.** `runtime.js` stays under 300 lines: a step's own words moved to `OpeningWords.line()` and the keyboard destination to `OpeningExit`.
- **No public API was removed.** `OpeningDocument`'s options are unchanged.

## Executed checks

All on `86d9150`, the archive below packed from it:

- **Unit suite:** `npm test`, 839 of 839. New: `tests/opening-screen.test.mjs` (8): a structure with nothing waiting, the budget and its start, every shared wait, a part not drawn, a reset, the one call when the budget runs out. Updated: `tests/waiting.test.mjs`, where the grace replaces the earlier "no animation" rule.
- **Declarations:** `npm run types` compiles.
- **Opening acceptance:** `npm run acceptance:opening`, 24 of 24 in each of Chrome, Firefox and WebKit. New: `OpeningArrival` (`acceptance/opening-arrival.mjs`), on the fixture's `?regions` page:
  - the structure covered while its first read runs, with no steps said past 800 ms, then shown once complete, the session's measured time ending at its structure;
  - a read slower than the budget shown at it, its wait in place;
  - an opening that already said its steps handing over at the structure;
  - with motion, the stage fading in, and the identity landing on a bar that shows nothing through it after the bar drew its brand again.

  The hand-over check reads the landing mark.
- **Browser acceptance:** `npm run acceptance`, 380 checks in each engine, from the source packed by the run, in the `dom`, `react19` and `react18` consumers. New: `acceptance/checks/waiting.mjs` (5), the grace with and without reduced motion.

  | Engine | Passed |
  | --- | --- |
  | Chrome | 380 of 380 |
  | Firefox | 380 of 380 |
  | WebKit | 380 of 380 |

## Limits

This is package evidence only:

- **Not drawn here.** The arrival's look on a real product, before and after, is measured in Conduict's record (its `docs/reviews/2026-10-24/arrival.md`).
- **The budget.** It holds only for waits drawn with the shared parts; a product's own placeholder is invisible to it.
- **The grace.** It starts when a wait is inserted. A product that draws its wait again on every change restarts it.
- **Focus.** A product that moves focus to a part of itself while the opening covers it does not get that focus, since the product is hidden until the hand-over.
- **`NotificationInbox`.** The family bar's inbox still waits with its own loading line, which neither the opening nor the grace sees (the suite's pending `ui-inbox-loading-grace`).

Nothing here is screen-reader output or hosted behavior.

## Family reference synchronization

The family reference (Beyond Suite's `branding/`) records D185 in its round `arrived` (reference 0.53.0) and vendors this archive.

## Artifact

- Archive: `dist-pack/beyond-ui-0.31.0.tgz`, packed by `npm run pack:consumers` from `86d9150` with no consumer named.
- SHA-256: `5e5337808250589d2de86dbff91a4e6055c4718815489539463643286a1b0510`.
- Integrity: `sha512-wdfN+HtkLNeZOHad1Y4sh94FPQ6qmbt4j09xgTl0eX1K/xvv+4pehanu7qRpZrJnI72TJTOjUno204Ct6MEVBA==`, the one each product's lockfile records.
