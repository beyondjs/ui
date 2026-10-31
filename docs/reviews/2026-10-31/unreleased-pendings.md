# Unreleased: three pendings of the suite's register

Made on 2026-10-31 on the branch `claude/pendings-20261031`, from `feature/next` at 0.45.1 (`ce16336`). The package's version is unchanged: 0.46.0 is taken by another branch ("framed choices"), so the coordinator numbers the release that carries this work (0.47.0 or later) after checking collisions. Nothing here is packed, vendored, published or accepted.

## A product's own Reduced in the package's scripted motion

The suite's pending `ui-opening-exit-motion-choice` (Beyond Home's DK83): with Reduced chosen on the device (`data-motion="reduced"` on the document root) and the system asking for full motion, the opening's hand-over still ran six Web Animations, since `OpeningExit` read only `prefers-reduced-motion` and a stylesheet cannot reach scripted animations.

- **`Stillness`** (`src/dom/core/stillness.js`, internal): whether the person asked for less motion, the system's setting or the root's `data-motion="reduced"`. A product's `data-motion="full"` never overrides the system's setting: only less motion is honored.
- **Every scripted motion reads it:** the opening's hand-over (`OpeningExit.moving`), a closed surface's picture (`Leaving.play`), the notification panel's height, a tab row's scroll cue (`edges.js`), a diff's reveal and dictation's level.
- **Checks:** `tests/stillness.test.mjs` (the guard's cases; the hand-over runs no Web Animation and lands nothing on the bar under the root's Reduced, and does with motion allowed; a closed surface leaves a picture with motion allowed and none under the root's Reduced). The opening's browser acceptance adds `OpeningArrival`'s chosen-Reduced check (`acceptance/opening-arrival.mjs`): the system at `no-preference`, `data-motion="reduced"` written before any script, `Element.prototype.animate` counted, and the hand-over ends with no call and `html[data-bui-opened]` set.

## Executed checks

Through the machine's test queue, on 2026-10-31. Evidence of each run is added below as it ends.

- **Unit, affected files** (light): 31 files, 197 of 197 passed (`entries`, `stillness`, the opening's, notifications', sidebars', diff's, dictation's, `quiet`, `spanish`, React's sidebar and round). `npm run types` compiles.
