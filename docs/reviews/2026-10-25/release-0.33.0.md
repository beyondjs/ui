# Local UI 0.33.0: the outage said once closed, a change's outage and the offline line

Evidence baseline: UI `7568947` (0.32.1) on `feature/next` plus this change, made in a worktree on 2026-10-25 for the suite's round `outage-close`. Token set 0.7.0 is unchanged. Implementation is not the owner's acceptance. [The round's record](outage-close.md) lists the claims checked before the change and what Beyond Home must pass.

## Why

The family says an outage once (D163), but three shared pieces still said it their own way: the inbox, a table's cell and a picker. While the browser was offline, a line blamed a product that could not have answered. A change's outage had no shared answer, and the forms and questions drew every failure in the danger tone, as an alert. The owner's direction of 2026-10-25 (D186) gave that answer the warning tone. `Session`'s dialog named Beyond Accounts whatever did not answer.

## What changed

- **The inbox's outage is the page form.** `NotificationInbox` draws its relay's outage (Beyond Projects or Beyond Accounts did not answer, or a read failed while offline) as `Recovery` with `whole`:
  - who did not answer, when it last tried and one Try again;
  - the read's evidence (the relay's `request` and reason) in the line's Technical details;
  - its filters, Mark all as read and Load more hidden while they cannot work;
  - the page kept while its own tries run, and given back once the relay answers.

  `locale` picks its words. Missing setup and refused access keep their own answers.
- **A cell's outage.** `EmptyState`'s `inline` (React `inline`, hosted in a `span`) is phrasing content: the outage's mark beside "Not available right now" on one muted line, for a `DataTable` cell or a row's value.
- **A picker joins the page's notice.** `Picker` takes `recovery`, `outage(error)` and `details(error)`, as DOM options and React props, as `Collection` does:
  - the line under its list says "Not available right now" with no Try again;
  - the page's line searches again until it answers;
  - a gate in place of the list takes the picker's symptom with it.

  Collection's join became the shared `OutageRead`. In React, a `Collection` or `Picker` whose first read fails before `useRecovery`'s notice exists keeps its symptom until the notice arrives.
- **Offline.** While `navigator.onLine === false`, a `Recovery` line says "You're offline" («Estás sin conexión») with "Last tried {time} · trying again as soon as you're back online", and offers no Try again.
  - Only the first notice of the page says it (`OfflineVoice`).
  - `Again` lets a try that falls due wait, and tries at once on `online`.
  - `local` keeps naming a dependency on this computer.
  - `Unavailable`'s outage says it in its reason.
- **A change's outage (D186).** `ChangeOutcome` (DOM and React) says it in the warning tone, in a polite live region.
  - A change answered unavailable: who did not answer, then "Nothing was changed." With `again` (React `onAgain`), it offers the person's own Try again, which is never run by itself.
  - A change with no answer: "The change may have been made.", then "Check before trying again.", the way to check and the request under Technical details.
  - `FocusedForm`, `confirm` and `prompt` draw what `explain` returns through `ChangeOutcome.answer`: an outcome, `{ text, tone: 'warning' }`, or a string in the danger tone as before. The question's container no longer interrupts as an alert.
- **Who did not answer a session.** `Session`'s unavailable dialog says "{product} did not answer". The hidden frame's failure names Beyond Accounts. The product's `read()` names its `source`: the option, a read's own answer, or an error's. It used to say "Beyond Accounts is not answering" whatever did not answer.
  - `CauseName.of(id)` gives the catalog's names (Beyond CDN, Conduict).
  - Offline, the dialog says "You're offline", offers nothing, and tries again on `online`.

## Executed checks

- **Unit suite:** `npm test` through the machine's test queue, 898 of 898 on `1d8030b`. New: `offline.test.mjs` (6), `joined.test.mjs` (4) and `outcome.test.mjs` (6). Updated: `notifications-outage.test.mjs`, `session.test.mjs` and `wording.test.mjs`. An earlier full run on `e204baf`, at load 48, failed one timing test of the opening's budget (`opening-screen.test.mjs`, code this release does not touch). It passed alone, and in the run on `1d8030b`.
- **Declarations:** `npm run types` compiles, with `tests/fixtures/types/offline.ts` and `offline.tsx`.
- **Browser acceptance** of the touched checks, from the packed 0.33.0 archive below, in the `dom`, `react19` and `react18` consumers:

  - **Engines:** 95 of 95 in each of Chrome 155.0.8059.85, Firefox 155.0 and WebKit 26.6. These are `node acceptance/run.mjs` runs through the queue, filtered to the outage, recovery, technical details, notifications, picker, session and form checks (D183's waits included).
  - **The earlier archive of `e204baf`:** Chrome gave 92 of 95 at load 41. Its three failures were timing checks in code this release does not touch: the notification panel's loading delay, and a double submission's busy label in `react19`. Firefox gave 94 of 95, failing one wait in `react19` of "entry and inbox state unavailable". WebKit gave 95 of 95. None of these failed on the final archive.

  The new `acceptance/checks/closing.mjs` measures:
  - the cells' and the picker's places at 1440, 390 and 320 px in both themes;
  - a change answered unavailable in the warning tone;
  - the inbox's page form, given back once the relay answers;
  - the offline line through the browser's own emulation.

  The full acceptance of every check was not run.

## Limits

This is package evidence only. Each product vendors 0.33.0 in its own repository in the same round. Nothing here is screen-reader output or hosted behavior.

## Family reference synchronization

The family reference (Beyond Suite's `branding/`) and the Docs Site quote the words above. Main records the synchronization in the suite.

## Artifact

- Archive: `dist-pack/beyond-ui-0.33.0.tgz`, packed by `npm run pack:consumers` from `1d8030b` with no consumer named.
- SHA-256: `607137b3d8e27ed2466eb0edc4e3520f8c738e7b824a49b5dd157bf1a69d5efe`.
- Integrity: `sha512-phqa2uz9xpZOysjG4xLzaOsgYfkm2v94COSUsOUuYaBWt0fxxWyO77Wc9CCKYBFeNfKTv2SwRJ45TAX7r07jyg==`. This is byte for byte the archive the browser acceptance installed.
