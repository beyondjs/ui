# Unreleased: three pendings of the suite's register

Made on 2026-10-31 on the branch `claude/pendings-20261031`, from `feature/next` at 0.45.1 (`ce16336`). The package's version is unchanged: 0.46.0 is taken by another branch ("framed choices"), so the coordinator numbers the release that carries this work (0.47.0 or later) after checking collisions. Nothing here is packed, vendored, published or accepted.

## A product's own Reduced in the package's scripted motion

The suite's pending `ui-opening-exit-motion-choice` (Beyond Home's DK83): with Reduced chosen on the device (`data-motion="reduced"` on the document root) and the system asking for full motion, the opening's hand-over still ran six Web Animations, since `OpeningExit` read only `prefers-reduced-motion` and a stylesheet cannot reach scripted animations.

- **`Stillness`** (`src/dom/core/stillness.js`, internal): whether the person asked for less motion, the system's setting or the root's `data-motion="reduced"`. A product's `data-motion="full"` never overrides the system's setting: only less motion is honored.
- **Every scripted motion reads it:** the opening's hand-over (`OpeningExit.moving`), a closed surface's picture (`Leaving.play`), the notification panel's height, a tab row's scroll cue (`edges.js`), a diff's reveal and dictation's level.
- **Checks:** `tests/stillness.test.mjs` (the guard's cases; the hand-over runs no Web Animation and lands nothing on the bar under the root's Reduced, and does with motion allowed; a closed surface leaves a picture with motion allowed and none under the root's Reduced). The opening's browser acceptance adds `OpeningArrival`'s chosen-Reduced check (`acceptance/opening-arrival.mjs`): the system at `no-preference`, `data-motion="reduced"` written before any script, `Element.prototype.animate` counted, and the hand-over ends with no call and `html[data-bui-opened]` set.

## The sidebar's search results against the list rules

The last open part of the suite's pending `ui-list-rules-gaps`, gap 10. The results were checked against D162's L1–L10 ([list tools](../../list-tools.md#the-sidebars-search-results-unreleased)); what applies is now done:

- **L8:** the query's words are marked in result names given as text (`Matches`).
- **L7:** Down from the field reaches the first result; Up, Down, Home and End move between the results' links, "See all results" last; Up from the first returns to the field (`SidebarResultKeys`, `src/dom/sidebar/keys.js`).
- **L10:** no match offers **Clear search** («Borrar búsqueda»), which puts the caret back in the empty field; an outage asks again by itself on `Again`'s schedule (`search.again`, its options but `run`; React passes it through) and says when it last tried with `AgainLine`, with **Try again**. Its words no longer restate the button: "Search did not respond." («La búsqueda no respondió.»).
- **A fix found on the way:** a request that a newer query, `clear()` or `destroy()` stopped could still say "Search did not respond." when its source rejected as it aborted; every stop now makes its late answer ignored.
- The other rules are the sidebar's own (navigation is outside D162's scope): its entries are one line each with a mark and an age, with no menu, at the sidebar's width; the results are a preview that ends with "See all results".
- **Checks:** `tests/entries.test.mjs` (two new tests: marks, keys and modifiers; Clear search, the tries' line, the words kept while trying, the tries ending with an answer and stopping on a new query), the typed fixture `tests/fixtures/types/conversation.ts` (`again`, and `run` refused), and the browser check "sidebar search:" (`acceptance/checks/panels.mjs`) extended with the marks, Down and Up, Clear search and the tries' line.

## The settling check's frame read after the change

The suite's pending `ui-firefox-panel-settling-check`: in 0.44.0's whole acceptance Firefox once failed React's "a composer docked in a thread… panel hidden or shown", the frame before the press already at the new width (710 → 710 px).

- **Cause, established by a check that makes it happen:** the recorder (`acceptance/support/frames.mjs`) notes the mark when a frame begins and reads the composer in a task the frame posts. The press comes from a Playwright evaluate, a task of its own. When that task ran after a frame began and before the frame's read, the read saw the new layout while its frame was unmarked, so `Settling.before` took the new width.
- **Change:** a read that finds the mark set after its frame began is not painted, as a read after a resize already was. The frame before keeps the width before; the first frame begun after the press lands it, as before.
- **Check:** "settling: a change made between a frame and its read is never read as that frame's" (`acceptance/checks/settling.mjs`) runs a loop started before the recorder, whose task is queued ahead of the recorder's in each frame, and presses Details there, only before that frame's read. It requires the frame the press landed between to be read as not painted and the frame before to keep the width before. On the recorder before the change it fails in Firefox in both consumers (no frame read as not painted).

## Executed checks

Through the machine's test queue, on 2026-10-31. Evidence of each run is added below as it ends.

- **Firefox 155, one heavy run** (`BEYOND_UI_BROWSER=firefox`, one archive of the working tree for every run, `DEBUG=1`):
  - the new race check on the recorder before the change: 0 of 2 passed (DOM and React 19: "read as not painted: 0"), the failure reproduced;
  - with the change, the settling checks (the four narrowings, the panel hidden and shown, the race) five times: 40 of 40 passed, the panel check 10 of 10;
  - "sidebar search:": 2 of 2 passed;
  - `node acceptance/opening.mjs`: 29 opening checks passed.
- **Unit, affected files** (light): 31 files, 197 of 197 passed (`entries`, `stillness`, the opening's, notifications', sidebars', diff's, dictation's, `quiet`, `spanish`, React's sidebar and round). `npm run types` compiles.
