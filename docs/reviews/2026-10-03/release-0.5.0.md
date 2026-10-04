# Release 0.5.0 — 3 October 2026

A minor release of `@beyond-js/ui` over [0.4.1](release-0.4.1.md) carrying the package's part of the owner's decisions of 2026-10-03 (recorded by the suite as settled contract S22): D50 (long operations, approved and amended), D43 and D44 as amended, Q09 with D48 (signing out of Beyond) and D49 as amended. The token set is unchanged (0.2.0), every 0.4.x option keeps working, and nothing is published or vendored into a product here: each product re-vendors 0.5.0 in its own assignment (`npm run pack:consumers -- <consumer>`).

## What changed

| Decision | Change | Where |
| --- | --- | --- |
| D50 | `Clock`: the page's time and beat, one timer while anything listens, `now` injectable, `tick()` re-evaluates at once; `Clock.system` by default | `src/dom/time/clock.js` |
| D50 | `Steps`: an operation's steps (`done`, `progress`, `stalled`, `failed`, `waiting`) with since/until, expected `{ median, p90 }`, phase and reason. A finished step says how long it took, the step in progress how long it has run against "usually about {median}", and strictly past its 90th percentile "Taking longer than usual"; a blocked or failed step says its reason with technical details. Drawn from the record and the clock only; a polite live region announces changes of state and a step becoming slow, once | `src/dom/operations/steps.js`, `step.js`, `timing.js`, `announcer.js`, `src/dom/time/words.js` |
| D50, E52 | `Awaited`: one card with a title and since when, the time left of the median and, from the median on, of the 90th percentile ("About 1 min left", "Less than a minute left"), "Taking longer than usual" past the 90th percentile with **Check again** (single-flight, shown running, a failed check said in place), a bar that only `end()` completes (indeterminate when the time cannot be told or has passed), the `Steps` inside, a reason that replaces the time with why and the way on, and `onend(outcome)` for the product's "Ready · …" | `src/dom/operations/awaited.js` |
| D50 | `Freshness`: a state's word with "Checked {n} ago" kept current by the clock, and "Last known: {state} · {time}" with a neutral dot while disconnected | `src/dom/operations/freshness.js` |
| D43 | `TechnicalDetails`: a native disclosure with the source's words, the request identifier and the time, and **Copy details**, copying all three (the time in ISO 8601) through the Clipboard API under a 5 s bound; a refusal is said in place and the text selected | `src/dom/operations/details.js` |
| D50 | English and Spanish copy on each component (`Steps.labels.es`, also on the React components); styles in `operations.css` and `details.css`, with no motion under reduced motion | `src/dom/operations/labels.js`, `src/styles/` |
| D44 | `Tooltip` takes `when`; `NameTip` shows a cut name whole on hover and keyboard focus only while `Cut` measures it cut, `aria-hidden`, hidden by a press. The family bar's organization and project names (wide and narrow forms) and a `Select`'s chosen text (DOM and React, measured in the select's font) use it. `ChoiceMenu` and `Picker` already wrapped and are unchanged; opened menus list names whole. Selects inside `Picker`, `Collection` and `NotificationInbox` are now destroyed with them | `src/dom/core/cut.js`, `tooltip.js`, `select.js`, `family/location.js`, `src/react/fields.js` |
| D44 | The `Sidebar`'s product row no longer cuts its section name with an ellipsis: the name is a fixed label, so it wraps and the row grows past its 44 px minimum (the glyph stays on the first line); the drawer behaves as before | `src/styles/sidebar.css` |
| Q09, D48 | The profile menu's last entry reads "Sign out of Beyond". `account.signout: { end, before?, after?, bound? }`: `before()` may cancel, `end()` runs under a 5 s bound that never blocks, then the bar goes to `links.leave` (the descriptor's or `fallback.links.leave`) with `product` and `return` (the current address without transient parameters, `Manage.clean`); without it, `after()`. The entry says "Signing out…", keeps the menu open and ignores a second press. The callback and `{ href }` forms still work | `src/dom/family/leave.js`, `account.js`, `menu.js`, `places.js`, `manage.js`, `labels.js`, `src/react/family.js` |
| D49 | The `Sidebar`'s default cut, 1024 px, is documented as the family's one cut; a product departs from it only with a recorded measurement | `src/dom/sidebar/sidebar.js`, `types/family.d.ts`, `docs/components.md`, `docs/architecture.md` |

The descriptor field consumed is `links.leave` of `beyond-family/1`: the absolute address of Accounts' interface `/leave` page, with no query. It is optional; Projects adds it in a parallel assignment.

## Checks

| Check | Result |
| --- | --- |
| `npm test` (new: `operations.test.mjs`, `awaited.test.mjs`, `cut.test.mjs`, `signout.test.mjs`, `react-operations.test.mjs`, the sidebar row's wrapping name in `cut.test.mjs`, also run on React 18.3.1 by `react18.test.mjs`; the earlier "Sign out" assertions now read "Sign out of Beyond") | 227 of 227 |
| `npm run types` (both typed consumers use `Clock`, `Steps`, `Awaited`, `Freshness`, `TechnicalDetails`, `Tooltip`'s `when`, `links.leave` and the `{ end, before, after, bound }` sign-out, with an expected error for an unknown step state) | No diagnostics |
| `npm run acceptance` (new `checks/operations.mjs`, 5 checks over the plain DOM, React 19 and React 18 consumers, and in `checks/sidebar.mjs` a long section name wrapping at 390 and 320 px in both themes) | 137 of 137 in Chrome 154, Firefox 155 and WebKit 26.6, run one after another on the same tarball (`sha512-fy3FEYxJ…`) |
| `npm run pack:consumers -- <scratch consumer>` | `dist-pack/beyond-ui-0.5.0.tgz` with the same integrity, copied into the consumer's `tools/` |

The clipboard is read back through the real Clipboard API only in Chrome (with granted permissions); in Firefox and WebKit the check records what `writeText` received. The truncation measurements are real in the browser; in the unit tests happy-dom does not lay out and the sizes are given.

A pass is package evidence only: no product has re-vendored 0.5.0 here, Accounts' `/leave` page is a stand-in on the fixture's origin, no screen reader was run and nothing is hosted.

## Family reference synchronization

Blocked in this assignment by scope: the suite's reference and documentation are synchronized by a separate agent of the same round. What the reference needs: the components `Steps`, `Awaited`, `Freshness`, `TechnicalDetails` and `Clock` with their states, thresholds and EN/ES copy (above and in the [component catalog](../../components.md#long-operations)); the profile menu's "Sign out of Beyond" / «Cerrar sesión en Beyond» with its working state "Signing out…" / «Cerrando sesión…» and the `links.leave` field; cut names shown whole in a tooltip; and the 1024 px family cut.
