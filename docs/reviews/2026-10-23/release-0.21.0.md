# Local UI 0.21.0 verification — the opening says what it is doing

Evidence baseline: UI `dd5577a` (0.20.4) on `feature/next`, clean, plus this change, made in a worktree on 2026-10-23 at the owner's request. The owner's screenshots showed Conduict's own "Opening Conduict…" line alone at the page's edge and the shared opening's "Opening…" beside a static ring with a dot and a **Trouble opening?** disclosure whose help said nothing a person did not know, and judged both far from the experience principle (EXP-01). Token set 0.6.0 is unchanged. Implementation is not approval: the owner accepts or rejects the result.

## What changed

- **One opening that says what it is doing** (`src/opening/`). Quick: the family lockup in the bar's proportions and a trace whose light travels while work runs, in the colour of work in progress. Past 800 ms: the steps, all at once, each with the family's mark for its state and its time in tabular figures, the document's own step (`interface`) first and then each step the product names on its waiting element: `session`, `signin`, `projects` in the family's words, any other value in the product's own. One live region says each new step, never the ticking time. The identity never moves while the opening says more below it.
- **Measured, not guessed** (`usual.js`). Each opening that finished without recovery keeps its steps' durations on this device (`<key>.opening`, the last 20 per step, durations only). From five openings on, a step past its 90th percentile says "· usually {median}" and the live region says once that it is taking longer than usual (D50).
- **Recovery with a cause** (`recovery.js`). Late at the 12-second engineering bound ("{product} hasn't opened yet" / "It keeps trying. Reload if it doesn't finish."), failed when code could not load ("{product} couldn't load" / "Reload to try again.", the step's time stopped), an uncaught failure while opening ("Something failed while it opened. Reload to try again."; the product can still finish), offline ("You're offline" / "{product} continues when you reconnect."), each with **Reload** and closed **Technical details** (step, steps with times, error, address, time) with **Copy details**. The standing **Trouble opening?** disclosure is gone; a stylesheet-only line appears after 15 s only when the controller never ran.
- **It acts by itself where that is safe.** Code that could not load while offline loads again when the connection returns; a page restored from the back-forward cache before it opened (a person who pressed Back from a sign-in) loads again.
- **Hand-over** (`exit.js`). The product is shown and takes the pointer from the first frame; the wordmark and the name move into the family bar's (which wait hidden underneath until they land), the rest fades; 360 ms, bounded at 700 ms; removed at once under reduced motion or without the Web Animations API.
- **In-page loading line.** `loading` / React `Loading` draws work in progress's half-filled circle (D129) instead of the ring with a dot that read as a choice to make. `loading.step({ step, language })` and `loading.steps` give a product's own waiting line the opening's words (React `Loading.step`, `Loading.steps`).
- The opening's script is minified (17 KB, from 13 KB unminified before), still a deferred, same-origin asset under strict CSP and Trusted Types.

## Artifact

- Archive: `dist-pack/beyond-ui-0.21.0.tgz`.
- SHA-256: `844ce7b2db9278075063f11837616e0e03eef00c71814e41fa46595a2c7079e5`.
- Integrity: `sha512-Ya3ZOUsVNqTlnPWmFw+jagumZW8hwT0b3oFxapBAoaVAHHackYCjc1aDXr2jCDB4UWSlEwhYvoe2sBdO8936JQ==`.

## Executed checks

- Unit suite: 753 of 753 (`npm test`), including the new `opening-steps.test.mjs` (words in both languages, the measured usual, the steps) and the rewritten document checks; the TypeScript declaration check passes.
- Installed browser acceptance (`npm run acceptance`, the packed archive in DOM, React 19 and React 18 consumers): 343 of 343 in Chrome.
- Opening acceptance (`npm run acceptance:opening`): 14 of 14 in each of Chrome, Firefox and WebKit: both themes at 320, 390 and 1440 px under reduced motion with the identity's place measured unchanged while steps and recovery appear; the late recovery, its details and focus kept; a module that cannot load and Reload; an uncaught failure the product outlives; an unavailable screen; JavaScript disabled; the measured usual and its announcement; offline with the reload on reconnecting; a back-forward restore; and the hand-over with motion into the fixture's bar (the product visible and taking the pointer at once, the bar's wordmark hidden until the identity lands, done within a second).
- Visual inspection in a local preview against the real `FamilyBar`: dark and light, 390 and 1280 px, English and Spanish, quick, steps, late, failed, offline and longer than usual; the hand-over traced frame by frame lands the wordmark within 0.1 px of the bar's.
- Conduict adoption against the running local composition is recorded in Conduict's E371 and the suite's opening record of this date.

Not run: screen readers, a hosted product, products other than Conduict on 0.21.0, and the owner's review.
