# 0.2.0: the family bar and the family round's patterns — 29 September 2026

On 2026-09-29 the owner approved five decisions of the family reference's register for implementation: D01 (a family bar in every signed-in surface, product first, then organization / project), D04 (product switching keeps the project), D06 (one "not available here" pattern), D17 (consequence-first confirmation and named outcomes) and D20 (voice and one availability vocabulary). The owner also rejected R06, so the product name stays beside the wordmark, through the one family lockup. D03, D05, D07, D08, D09 and the rest of the register are not approved and are not implemented here. 0.2.0 is the package side of that round. Each product adopts it in its own assignment.

## What changed

| Decision | Change | Files |
| --- | --- | --- |
| D01, D04 | `FamilyBar`, DOM and React. It is the shared `Header` with the brand link home, the product name drawn as the lockup's name as the product switcher, organization / project menus (one location menu below 720 px), Docs (in the account menu below 480 px), the notification slot and the account menu. It renders `beyond-family/1`, degrades to loading and unavailable states without an error, is sticky and stays one row down to 320 px | `src/dom/family/` (`bar.js`, `switcher.js`, `location.js`, `account.js`, `places.js`, `menu.js`, `labels.js`), `src/react/family.js`, `src/styles/family.css`, `src/styles/navigation.css`, `types/family.d.ts` |
| D01 | `ProductNav`, DOM and React: a product's own tabs under the bar. The row scrolls sideways, keeps the current tab in view (also after web fonts load) and is sticky only on request | `src/dom/nav.js`, `src/styles/navigation.css` |
| D06 | `Unavailable`, DOM and React (rendered by React with the DOM markup): title, reason, who can change it, a code tag and actions. The icon follows the kind (lock, plug, information); tones are never danger | `src/dom/unavailable.js`, `src/styles/feedback.css` |
| D17 | `confirm({ consequence: { lost, kept, recovery } })` shows a short list under the message, with the labels `lost`, `kept` and `recovery`. The documentation states that the accept label is the action's own verb and that a toast repeats it in the past tense. There is no `outcome()` helper, because a past tense is the product's language, not a trivial function | `src/dom/questions.js`, `src/styles/overlays.css`, `docs/components.md` |
| D20 | `availability`, the one ordered, frozen vocabulary with tones: Available (success), Closed access (warning), In preparation (info), Planned (neutral), Retired (neutral). It is exported by both modules, and the catalog gives the Spanish set and a `Badge` example | `src/dom/availability.js` |
| Lockup residual | The name's box is trimmed to its cap top and baseline (`text-box: trim-both cap alphabetic`, under `@supports`) and raised by 0.0555 × the wordmark's height to the letters' centre. Padding keeps the divider 0.714 × tall, as before | `src/styles/header.css` |
| Icons | `user`, `book`, `lock` and `plug` | `src/dom/core/icons.js` |

The navigation menus are disclosures of links built on `Disclosure`, as the family reference's `Menu` is, and not the ARIA menu role: `ActionMenu` stays for actions on a record. On top of the disclosure they add section headings, focus on the first entry when a menu opens, arrow keys, Home and End, and closing once an entry is chosen. An unavailable product without an address is text that the arrow keys still reach, so its reason can be read. The React adapter's host of the bar takes no box (`display: contents`), because a sticky bar inside a host of its own height would scroll away.

## The lockup residual

The consumers reported the name 0.9 px low at `--bui-lockup-height: 28px`. Measured again in Chrome 154 with the family wordmark and Rubik 500, the 0.1.8 placement put the cap top and baseline between −0.43 and +1.15 px from the letters' over 18–40 px. The offsets form a sawtooth: +0.99 at 28, +1.15 at 40, 0.00 at 21. The cause is that Chrome rounds a font's ascent and descent to whole pixels, so the baseline inside a line-height-centred box jumps with the size. A trimmed box is exactly the cap height, so its place no longer depends on those rounded metrics.

| Heights | 0.1.8 (cap top, baseline) | 0.2.0 |
| --- | --- | --- |
| 18–40 px, every pixel | −0.43 to +1.15 px | −0.02 to +0.01 px |

The measurement takes the letters from the wordmark's path bounds: the capitals span y 3.26 to 11.624 of the 16.742 view box. The name's baseline comes from a zero-sized probe on its line and its cap top from Rubik's cap height at the rendered size. A browser without `text-box` keeps the 0.1.8 placement.

## The family bar measured

The measurement was taken in Chrome 154 headless, in the installed `dom` (English) and `react19` (Spanish, with a sidebar toggle) consumers, with the family wordmark and Rubik, at 1440, 1024, 768, 390 and 320 px, in light and dark:

| Measure | Result, every width, theme and consumer |
| --- | --- |
| Rows | One, 44 px tall, at the top of the page. The background is navy in both themes (`--color-family-bar`) |
| Horizontal page scroll | None |
| Parts outside the bar or overlapping | None |
| Centres of the wordmark, product button, location button, Docs, bell and avatar against the bar's centre | 0.00 px, except the bell at −0.12 px (the notification entry's own glyph box) |
| Product name against the wordmark letters (cap top, baseline) | 0.00 px, 0.00 px |
| Wordmark height | 21 px, never shrunk |
| Location | Two menus from 720 px up and one location menu below. Docs is in the bar from 480 px up and in the account menu below |
| Focus ring | `--color-family-marker` |
| Loading to ready | Bar height, wordmark and name do not move |

The phone widths give the location the room the other parts can spare. Below 480 px the gutters and gaps narrow, the account button drops its chevron and Docs moves into the account menu. With a product's sidebar toggle, the switcher also drops its chevron (the name is still the button), and the toggle keeps a target's height at 32 px wide. Below 360 px the gutter is 4 px. At 320 px, a location of "Storefront redesign" shows the following, with 4 px between it and the bell in every case:

| 320 px | Fine pointer | Touch (44 px targets) |
| --- | --- | --- |
| No toggle (`dom`) | 29 px of text ("St…") | 19 px |
| Sidebar toggle (`react19`) | 15 px | 5 px (only the ellipsis) |

The button keeps its full accessible name, for example "Location: Northwind Studio / Storefront redesign. Change organization or project", and its panel names both. A consumer that wants more room at 320 px has none left to take from the bar: the wordmark, the lockup and the targets are fixed.

## What ran

| Command | Result |
| --- | --- |
| `npm test` | 109 of 109. New: `family.test.mjs` (13: descriptor rendering, loading null, unavailable fallback, product menu availability and reasons, current markers, accessible names, labels override, the narrow location menu, keyboard, redraw focus, `onnavigate`, toggle and teardown), `patterns.test.mjs` (5: `ProductNav`, `Unavailable`, the consequence, `availability`) and `react-family.test.mjs` (4, also run on React 18.3.1 by `react18.test.mjs`) |
| `npm run types` | Clean, with typed DOM and React consumers of every new export |
| `npm run acceptance` | 84 of 84 (69 of 0.1.8 plus 15 new: the packed 0.2.0 tarball installed in the `dom`, `react19` and `react18` consumers, Chrome 154 headless). An earlier run of the same day failed one check (81 of 82): at 320 px with a sidebar toggle the location button slid under the bell. The phone rules above and a stricter overlap test answer it |
| Measurement scripts (scratch, not retained) | The tables above |

New acceptance checks (`acceptance/checks/family.mjs`, 15 runs across the consumers): the widths-and-themes check (`dom`, `react19`; its overlap test compares every control left to right, since a shrunk group can still overflow), a 320 px touch screen, the lockup from 18 to 40 px, the keyboard (Enter and Space open on the first entry, arrows, End, Escape returns focus, the marker focus ring, choosing an organization through `onnavigate`; `dom`, `react19`, `react18`), the menus inside the viewport at 390 and 320 px (with Docs moved into the account menu), the states (loading without a jump, unavailable naming the fallback, the sticky bar with a non-sticky `ProductNav`), and `ProductNav`, `Unavailable` and the consequence. The family pages carry copies of the brand assets (`acceptance/fixtures/brand/`, with hashes and the font licence); the package still ships none.

## Not established

- No product has adopted 0.2.0. The coordinator distributes the tarball (`npm run pack:consumers` was not run here), and each product records its own adoption and measurements.
- The measurements are of this package's fixture pages in Chrome only. Other browsers, screen readers, 200 % zoom of the bar and touch devices were not measured here.
- `beyond-family/1` is rendered from fixtures, not from a Projects relay.

## Family reference synchronization

**Synchronization blocked** in this assignment, which was told not to edit `branding/`. The affected parts are the reference's family bar (`branding/src/app/chrome/familybar.js`), menu (`parts/menu.js`), unavailable pattern (`chrome/unavailable.js`), its catalog of shared components and consumers, and decisions D01, D04, D06, D17 and D20 (approved) and R06 (rejected). The owner is the round's coordinator, who integrates the reference. The remaining work is to catalog `FamilyBar`, `ProductNav`, `Unavailable`, the consequence and `availability` as package components, and to move the reference's own bar onto the package's.

Package 0.2.0, token set 0.1.0 (unchanged, `proposed`). The evidence is local execution on 2026-09-29, and nothing is published.
