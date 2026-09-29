# 0.2.1: the package in WebKit and Firefox — 29 September 2026

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

## Not established

- WebKit is Safari's engine run by Playwright on macOS. It is not Safari, and iOS was not run. Firefox is Playwright's build, not a release channel.
- The fallback placement of the lockup was measured only by forcing it in engines that support `text-box`.
- No product has adopted 0.2.1, and screen readers were not run.

## Family reference synchronization

**No reference impact.** 0.2.1 changes no journey, navigation, state, wording or recovery that the family reference models. It makes the behavior that 0.2.0 already specified (focus returns to the opener, Escape closes a panel, the current tab is in view) hold in WebKit and Firefox. The family reference records the 0.2.0 round's synchronization separately ([0.2.0](family-bar.md#family-reference-synchronization)).

Package 0.2.1, token set 0.1.0 (unchanged, `proposed`). The evidence is local execution on 2026-09-29. Nothing is published.
