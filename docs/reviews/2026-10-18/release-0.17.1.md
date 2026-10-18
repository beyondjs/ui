# Release 0.17.1 — 2026-10-18

Evidence baseline: UI `a889ac0` (0.17.0) on `feature/next`, clean, plus this change on `audit/2026-10-18-ui-0171`. Token set 0.6.0 is unchanged. The four corrections answer defects the live verification of 2026-10-18 found on the composed products; they implement existing family rules (D95, D132, C2) and create no new approval or product acceptance.

## What changed and why

- **The family bar keeps an open menu across a redraw (D95).** Cause: `FamilyBar#draw` destroyed every part and built new menus whenever the descriptor, fallback or notice was set, so a menu the person had open vanished with no exit and focus fell to the page; the family motion check then failed in WebKit for CDN, Delegate and Conduict ("menu closed with no exit"). React's `FamilyBar` also created a whole new bar when `brand.href`, `account.label` or an entry's address changed (three times after Delegate's first paint). Now `HeldMenu` reads the open menu before a redraw (its part, the focused entry by address and words, the search typed, the scroll) and opens the same menu of the new drawing in the same frame with no entry, focus on the same entry; `Same` makes equal data draw nothing new (plain data by content, functions and nodes by identity); `brand` and `account` setters apply those values in place, and the React adapter uses them instead of a new bar. Conduict's local `BarMenus` did the same from outside.
- **One outage retry, `Again` (D132).** Six products each carried their own schedule and line. `Again` is the one schedule (5, 15, 30, 60 s, then every 60 s; at once on `online` and when the page is shown again; one try at a time; a hidden page waits; stoppable; a refusal is an answer and ends it; only reads), `AgainLine` the line ("Last tried 12:04 · trying again by itself" / «Último intento 12:04 · se vuelve a intentar por sí solo»), React `useAgain`, and `Unavailable`'s `again` for `kind: 'outage'`, which owns both and offers "Try again" when the product passes no action. Products are not migrated in this release.
- **CopyValue's Copy never shrinks or wraps.** Cause: the button was a shrinkable flex item, so inside a fact's value that breaks words anywhere it wrapped one letter per line (Snapshots' pending capture at 1440 px). Now `flex: none` and `white-space: nowrap`; React's host may shrink so the value is cut. Snapshots carried this rule locally.
- **One set of font faces after the opening.** Cause: `OpeningDocument` copied `fonts.css` into the opening stylesheet under `opening-fonts/` addresses, so every Inter and Rubik face was declared twice; one copy of each face stays unloaded and `document.fonts.check('400 16px Inter')` answered false (Conduict's bar and Projects' foundations checks). Measured before the change, in Chrome, Firefox and WebKit: 24 faces, and only the later-declared copy of a used face loads. Same addresses alone do not help (Firefox still leaves one copy unloaded). Now the opening keeps its faces for its own first paint (no flash) and, once the application is ready and declares the same faces itself, `OpeningFonts` loads the faces in use under the application's declaration and removes the opening's `@font-face` rules; with no application faces, or one that cannot load within 10 s, the opening's stay.

## What ran

Executed locally on this change:

- `npm test`: 653 tests, 653 passed (638 before; the new `held.test.mjs`, `again.test.mjs` and the additions to `list.test.mjs` and `opening.test.mjs`). A first run found that the bar's guard against an equal descriptor also stopped `descriptor = null` from starting a new loading bound (the contract of 0.15.0's `audit-family.test.mjs`); null again now starts the bound, as before.
- `npm run types`: the declarations, with the typed consumers `hold.ts` and `hold.tsx`.
- `npm run acceptance` (packed tarball, DOM, React 19 and React 18 consumers): 303 checks passed and none failed in Chrome 155, Firefox 155 and WebKit 26.6, each including the seven new `holding.mjs` checks.
- `npm run acceptance:opening`: 9 scenarios passed in each of Chrome, Firefox and WebKit, each counting twelve Inter and Rubik faces with `400 16px Inter` loaded after readiness, against a fixture that declares its own `fonts.css` before the opening's stylesheet (the order in which the opening's copy had won).

Not exercised: a screen reader, a hosted product, or any product's adoption of 0.17.1 (each consumer verifies its own vendoring).

## Family reference

Visible behaviour changes the reference should reflect: a family bar menu stays open while its data changes; an outage's `Unavailable` says "Last tried {time} · trying again by itself" with the shared Try again; Copy stays on one line. The reference's catalog should list `Again`, `AgainLine` and `useAgain` and its vendored ui should move to 0.17.1. Not edited here (outside this assignment); synchronization is left to the reference's owner.
