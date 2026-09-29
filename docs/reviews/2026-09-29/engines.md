# 0.2.1 and 0.2.2: the package in WebKit and Firefox, and the family bar's adoption findings — 29 September 2026

0.2.0 was accepted in Chrome only. The same installed acceptance, run in Playwright's Firefox and WebKit builds, found focus that fell to the page's body, a product navigation row that left its current tab a fraction of a pixel outside, and a teardown check that could run only in Chromium. 0.2.1 corrects the components, not the checks, and the acceptance now runs in each of the three engines.

## What failed on 0.2.0

The acceptance run gained the `BEYOND_UI_BROWSER` option (`chrome`, `firefox`, `webkit`). Of the 84 checks on 0.2.0:

| Engine | Result | Failing checks |
| --- | --- | --- |
| Chrome 154 | 84 of 84 | None |
| Firefox 155 | 81 of 84 | `teardown` (`dom`, `react19`, `react18`): it read the document's listeners through a DevTools protocol session, which exists only in Chromium |
| WebKit 26.6 | 71 of 84 | `teardown` (all three, same cause). `dialog: … Escape closes and focus returns to the opener` (all three): focus went to the body. `picker: "all" …` (all three): focus did not return to the search field. `entry: … Escape returns focus …` (all three): Escape did not close the notification panel and focus stayed off the bell. `product navigation …` (`react19`): `{"scrolls":true,"shown":false}` |

## Causes and fixes

| Failure | Cause | Fix | Files |
| --- | --- | --- | --- |
| Dialog focus return | WebKit, like Safari on macOS, does not focus a button that is clicked. `Dialog.open()` remembered `document.activeElement`, which was the body, and returned focus there | A shared tracker, `Interaction` in core, remembers the interactive element of the last `pointerdown` or `keydown` per window (one pair of passive capture listeners on the window, a weak reference, installed when the module loads). `Dialog` remembers the focused element, or, when focus rests on the body, that element. Closing returns focus to it, or to `restore` when it is gone or unknown, and never to the body. The questions (`confirm`, `prompt`, `alert`) are dialogs and inherit it. `restore` keeps its documented role as the fallback | `src/dom/core/interaction.js`, `src/dom/dialog.js` |
| Notification entry, Escape | After clicks inside the panel nothing had focus, so Escape went to the body and never reached the disclosure's own key handler | While open, a `Disclosure` (help, the account slot, the notification entry, the family bar's menus) also listens for Escape on the document. When focus rests on the body and nothing else handled the key, it closes and focuses its own button. Escape in another focused field elsewhere is left to that field. The listener is released on close and by `destroy()` | `src/dom/disclosure.js` |
| Picker "Select all shown" | The picker moved focus to the search field only when the button it hid was focused, which a click in WebKit never makes it | "Select all shown" and "Load more" count as used when they are focused, or when focus is on the body and they were the last element pressed (`Interaction.used`) | `src/dom/picker/picker.js` |
| `ProductNav` current tab | WebKit keeps only whole pixels of `scrollLeft`. A move of 47.86 px became 47, so the current tab ended 0.86 px past the row's edge | The row moves by whole pixels, rounded towards showing the tab, and keeps the tab inside its padding. The existing check after web fonts load remains | `src/dom/nav.js` |
| `teardown` outside Chromium | The check used `DOMDebugger.getEventListeners` over a DevTools protocol session | `acceptance/support/listeners.mjs` wraps `addEventListener` and `removeEventListener` before any page script and records the listeners registered on `document` and `window`, with the browser's identity rules. The check asserts, in every engine, that the open panels listen on the document, that after destroying nothing listens on the document for `pointerdown` or `keydown`, and that nothing added since the page was ready is still registered. In Chrome it also reads the document through DevTools, as before. As a negative control, `Component.destroy()` was temporarily changed to keep its listeners: the check failed in Firefox for all three consumers (`document:keydown,document:pointerdown` left), and the change was reverted | `acceptance/checks/presentation.mjs`, `acceptance/support/listeners.mjs` |

Components that open from their own button already returned focus to it (`ActionMenu`, the family bar's menus, the disclosure's Escape inside the panel and "View all") and needed no change.

New unit tests (happy-dom, with a `pointerdown` that moves no focus, as WebKit does): a dialog returns focus to the button last pressed, and to `restore` after a key on the body cleared it; a disclosure closes on Escape at the body and focuses its button, stays open for Escape in another field, and releases its listeners; "Select all shown" pressed without focus leaves focus in the search field. Each of the three failed on the 0.2.0 sources and passes on 0.2.1.

## The lockup in Firefox and WebKit

The premise that Firefox lacks `text-box` does not hold for Firefox 155: `CSS.supports('text-box', 'trim-both cap alphabetic')` is true in all three engines, and all three use the trimmed placement. Measured with the acceptance's geometry (`acceptance/support/geometry.mjs`) in the installed `dom` and `react19` consumers, the name's cap top and baseline against the wordmark's letters, at every height from 18 to 40 px:

| Engine | Cap top | Baseline | Family bar name at 1440–320 px, both themes |
| --- | --- | --- | --- |
| Chrome 154 | −0.02 to 0.00 px | −0.01 to +0.01 px | 0.00, 0.00 px |
| Firefox 155 | −0.07 to +0.10 px | −0.01 to +0.01 px | −0.01, 0.00 px |
| WebKit 26.6 | −0.01 to 0.00 px | −0.01 px | 0.00, −0.01 px |

The fallback, the 0.1.8 translate that browsers without `text-box` keep, was measured by overriding the trimmed rules in the same pages:

| Engine | Cap top | Baseline |
| --- | --- | --- |
| Chrome 154 | −0.43 to +1.14 px (a sawtooth with the height) | −0.43 to +1.15 px |
| Firefox 155 | +0.47 to +1.70 px | +0.42 to +1.64 px |
| WebKit 26.6 | +0.54 to +1.19 px (growing with the height) | +0.53 to +1.19 px |

No constant translate can bring the fallback within 0.5 px: in Chrome alone the offsets span 1.58 px. A placement that does not depend on the font's rounded ascent and descent without `text-box` needs an inner element to align by baseline, which changes the lockup's markup in both the DOM and React forms. It was not made, because none of the three engines uses the fallback. It stays off by up to 1.7 px in a browser without `text-box`, and no such browser was measured.

Across the family bar measurement in Firefox and WebKit at 1440, 1024, 768, 390 and 320 px in both themes, there was one 44 px row, nothing outside it or overlapping, and every part centred on the bar within 0.00 px. That includes the bell, which is −0.12 px in Chrome.

## What ran

| Command | Result |
| --- | --- |
| `npm test` | 112 of 112 (109 plus the three new tests) |
| `npm run types` | Clean |
| `npm run acceptance` | 84 of 84, Chrome 154.0.8037.58 |
| `BEYOND_UI_BROWSER=firefox npm run acceptance` | 84 of 84, Firefox 155.0 |
| `BEYOND_UI_BROWSER=webkit npm run acceptance` | 84 of 84, WebKit 26.6 |
| Lockup and bar measurements (scratch scripts over the acceptance's consumers and geometry, not retained) | The tables above |

All three acceptance runs installed the same packed `beyond-js-ui-0.2.1.tgz` (`sha512-2aP2b4CzCbo75lrbHZ1ePTw6em//hhSUCnnpMqZdgqXjlWvZDPQZUDVuoYOm4yLVHq+1KZNXZIYVOiLzyM0BvA==`) into the `dom`, `react19` (19.3.0) and `react18` (18.3.1) consumers. Firefox and WebKit are Playwright's builds for `playwright-core` 1.63.0, installed with `npx playwright-core install firefox webkit`.

## 0.2.2: the location shares its width

The product adoptions of 0.2.1 (Projects, Accounts and Workspace) reported six problems in the family bar and the confirmation:
- Projects: at 768 px the location cut the organization "Estudio Ñandú" to "Estudio Ñ…" while the project kept most of the room.
- Accounts: with the descriptor unavailable and no organization in `fallback`, a divider was left with nothing after it.
- Accounts: in the same state the account menu lost "Your account", because that address came only from the descriptor.
- Workspace: at 320 px on a touch screen, with a sidebar toggle and the product name "Workspace", the location button ran 7.89 px under the bell. It fitted at 340 and 360 px.
- Workspace: below 480 px on touch the toggle was 32 px wide and the account button 28 px, below the family's own 44 px rule (WCAG 2.5.5).
- Workspace: a confirmation's consequence labels showed in upper case ("WHAT IS LOST") by package style, against D20's sentence case.

| Problem | Cause | Fix | Files |
| --- | --- | --- | --- |
| A short organization cut before a long project | Both menus shrank by the default flex rule, in proportion to their own width, so the shorter name lost as large a share as the longer one. With the Spanish page's sidebar toggle and "Documentación", the organization kept 34 px at 768 px ("Es…") and 19 px at 720 px | Wide, both names grow from nothing in equal parts up to their whole name (`flex: 1 1 0; max-width: max-content`), with the organization capped at 12rem and the project at 16rem. A short name is shown whole and the longer one takes the rest. Two long names are cut to the same width. The fallback names shown as text carry the same part classes and caps. The single location menu below 720 px is unchanged | `src/styles/family.css`, `src/dom/family/location.js` |
| A divider with nothing after it | The bar always drew the divider before the location | No divider when the location has nothing to show (`Location.blank`). A project shown alone as text has no `/` before it | `src/dom/family/bar.js`, `src/dom/family/location.js` |
| Touch targets under 44 px, and the location under the bell | Below 480 px the toggle was narrowed to 32 px, the account button had no padding (28 px) and the location kept at least an ellipsis (28 px) for every pointer. With a toggle and "Workspace" at 320 px the parts needed more than the bar's 312 px. Measured in Chrome with the targets at 44 px, the parts need 350 px: toggle 44, wordmark link 83.3, "Workspace" 91.1, location 44, bell 44, account 44. No placement fits that, since the wordmark keeps 21 px and the product name stays (R06 rejected) | On coarse pointers below 480 px, the toggle, the location and the account button are at least 44 px wide, and the bar's parts sit without gaps (each target is its own). Below 360 px the switcher drops its chevron. With a product's sidebar toggle below 380 px, the location folds into the product menu. That menu carries the location's sections, which are hidden otherwise, as Docs moves into the account menu below 480 px. Its arrow keys skip hidden sections. At 320 px on touch the controls now measure toggle 44, wordmark 83.3, "Workspace" 91.1, bell 44 and account 44 with a toggle (location folded), and wordmark 83.3, "Workspace" 91.1, location 49.5, bell 44 and account 44 without one. Mouse pointers keep their 32 px targets and layout | `src/styles/family.css`, `src/styles/navigation.css`, `src/dom/family/menu.js`, `src/dom/family/switcher.js`, `src/dom/family/location.js`, `src/dom/family/bar.js` |
| Consequence labels in upper case | `.bui-consequence dt` had `text-transform: uppercase` | The labels show as written, in sentence case | `src/styles/overlays.css` |
| No "Your account" while unavailable | The account, members, Docs and home addresses came only from the descriptor | `fallback.links` (`home`, `account`, `members`, `docs`) supplies each address the descriptor does not. The descriptor's own addresses still win, members still needs an organization in view, and the one Projects entry and the home link use `fallback.links.home` before `brand.href`. It is typed in `FamilyFallback` and documented in the catalog | `src/dom/family/places.js`, `src/dom/family/bar.js`, `types/family.d.ts`, `docs/components.md` |

The width of each name's text, measured with the acceptance's geometry after 0.2.2, shown as shown/whole in px. The `dom` page is English. The `react19` page is Spanish, with a sidebar toggle and "Documentación". `nandu` is "Estudio Ñandú" with a long project, and `long` has two long names:

| Page | Case | 1024 px | 900 px | 768 px |
| --- | --- | --- | --- | --- |
| `dom` | `nandu` | 91/91, 222/358 | 91/91, 222/358 | 91/91, 157/358 |
| `dom` | `long` | 158/250, 222/277 | 158/250, 222/277 | 124/250, 124/277 |
| `react19` | `nandu` | 91/91, 222/358 | 91/91, 181/358 | 70/91, 70/358 |
| `react19` | `long` | 158/250, 222/277 | 136/250, 136/277 | 70/250, 70/277 |

Firefox 155 and WebKit 26.6 give the same widths. Their whole widths differ by at most 1 px (359 and 278). Before 0.2.2, `react19` `nandu` measured 91, 78 and 34 px for the organization at 1024, 900 and 768 px. At 768 px the Spanish page leaves the location 223 px, so both names are cut to about 70 px each ("Estudio Ña…"). Giving it more room would mean taking room from other parts of the bar, such as showing Docs as an icon only below 1024 px. That changes the bar's forms per width, and it was not done.

New checks:
- Acceptance: `family bar location at 1024, 900 and 768 px` (`dom`, `react19`). For the `nandu` and `long` descriptors it asserts one row with nothing outside it or overlapping, that each name is whole or keeps at least 56 px of text, that a cut name is never narrower than the other one unless that one is whole or at its cap, and that "Estudio Ñandú" is whole at 1024 and 900 px. On the 0.2.1 stylesheet the check fails in both pages.
- Acceptance: the states check also opens the unavailable bar with the fixture's addresses and checks the account link and Docs. With `?fallback=bare` it checks that nothing is drawn after the product name.
- Unit tests in `family.test.mjs`:
  - The fallback addresses while unavailable and loading, with the descriptor's addresses winning when it is ready.
  - No divider and no separator with no place, and a project shown alone without a separator.
  - No account link and the brand address when the fallback names none.
  - The static names' part classes.
  - The first of these fails on the 0.2.1 sources.
- Typed consumers pass `fallback.links`.
- Acceptance: `family bar on phones (320 to 479 px) …` (`dom` without a toggle, `react19` with one). The fixture pages take `?product=`. At 320, 340, 360, 390 and 479 px, for "Workspace", "Snapshots", "Conduict" and "Delegate", with touch and with a mouse, it asserts one 44 px row, no sideways scroll, nothing outside the bar or overlapping, and a wordmark of at least 21 px. On touch it also asserts that every control is at least 44 × 44 px. With a toggle on touch below 380 px it asserts that the location is folded, that the product menu shows the organizations and projects, and that the menu stays inside the viewport. On the 0.2.1 stylesheet it fails in both pages: the location and account are under 44 px, and the location overlaps the bell.
- Acceptance: the consequence check asserts that the labels read as written and not in upper case. On the 0.2.1 stylesheet it fails with "WHAT IS LOST" and "QUÉ SE PIERDE".
- Unit test: the product menu carries the location's sections (the same entries as the location menu, organizations only outside a project, none without a descriptor). The keyboard test runs with the rule that hides them.

0.2.2 ran as follows:

| Command | Result |
| --- | --- |
| `npm test` | 115 of 115 |
| `npm run types` | Clean |
| `npm run acceptance` | 88 of 88, Chrome 154.0.8037.58 |
| `BEYOND_UI_BROWSER=firefox npm run acceptance` | 88 of 88, Firefox 155.0 |
| `BEYOND_UI_BROWSER=webkit npm run acceptance` | 88 of 88, WebKit 26.6 |

All three installed the packed `beyond-js-ui-0.2.2.tgz` (`sha512-8cZVWm5IBlLqxvwvOZzcCkKniilh3IGjpJj8gDC/1K4uPoJt8n/OSB2V0k+osGysm0ld+tjpRTJjbKDPBoghDA==`).

Other upper case by style remains in the package and was not changed here: the tag (`badge`, which also shows the availability vocabulary), table headings and the family menus' section headings. Whether D20's sentence case covers them is the owner's decision.

## Not established

- WebKit is Safari's engine run by Playwright on macOS. It is not Safari, and iOS was not run. Firefox is Playwright's build, not a release channel.
- The fallback placement of the lockup was measured only by forcing it in engines that support `text-box`.
- No product has adopted 0.2.1 or 0.2.2, and screen readers were not run.

## Family reference synchronization

**No reference impact** for 0.2.1: it changes no journey, navigation, state, wording or recovery that the family reference models. It makes the behavior that 0.2.0 already specified (focus returns to the opener, Escape closes a panel, the current tab is in view) hold in WebKit and Firefox. The family reference records the 0.2.0 round's synchronization separately ([0.2.0](family-bar.md#family-reference-synchronization)).

**Synchronization blocked** for 0.2.2 in this assignment, which does not edit `branding/`. 0.2.2 changes visible states of the bar: how the location's names are cut at tablet widths, no divider without a place, the account link and Docs kept while the descriptor is unavailable, 44 px touch targets, and the location folded into the product menu on touch below 380 px with a sidebar toggle. It also changes the confirmation's consequence labels to sentence case. The affected parts of the reference are its family bar (`branding/src/app/chrome/familybar.js`), its menu (`parts/menu.js`), its degraded-state representation and its confirmation. The owner is the round's coordinator, who integrates the reference. The remaining work is to model these in the reference.

Packages 0.2.1 and 0.2.2, token set 0.1.0 (unchanged, `proposed`). The evidence is local execution on 2026-09-29. Nothing is published.
