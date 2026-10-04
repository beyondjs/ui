# Release 0.6.2 — 4 October 2026

A patch release of `@beyond-js/ui` over [0.6.1](release-0.6.1.md), answering the reports of the page system's first adoptions (Snapshots, CDN's administration and Projects). The token set is unchanged (0.3.0) and every 0.6.1 option keeps working.

## What changed

| Report | Cause | Change | Where |
| --- | --- | --- | --- |
| Snapshots and CDN: choosing a language in "Language and appearance" closed the dialog, leaving focus on the page | A React product draws its family bar again when its labels change, as they do with the language, and destroying the bar destroyed the open dialog | The dialog outlives the bar that opened it (the profile menu `leave()`s it: an open dialog stays until it closes, then releases itself), rewrites its copy in place when the language changes, with focus where it was, and on closing returns focus to the profile button in view (`open({ restore })` takes a function) | `src/dom/preferences/dialog.js`, `src/dom/family/account.js` |
| Snapshots: "Change for all of Beyond" did not return to the exact list view | The address was fixed when the bar was made | In the bar it is Accounts' account page completed with the product and the page in view each time the dialog opens (the descriptor's `links.manage.account`), else the product's `everywhere`; `everywhere` may be a function asked at each opening | `dialog.js`, `account.js` |
| CDN: a wide table in a section widened a release page at 320 px by 4 px | Blocks of `.bui-section-body` (and of the main column and the side panel) kept `min-width: auto` | Every block of those grids may shrink below its content, so a wide table scrolls in its own box | `src/styles/page.css` |
| Projects: no event when the dialog closes, so it polled to redraw its page in the new language | — | `account.preferences.onclose` (and `PreferencesDialog`'s `onclose`); to follow each choice a product subscribes to its `Preferences`, which says every change | `dialog.js`, `types/page.d.ts` |

## Checks

The new checks failed before the change and pass after it: the acceptance's layout page with a wide table in a section scrolled sideways at 320 px (DOM and React 19), and the unit tests found the dialog gone after the bar was destroyed.

| Check | Result |
| --- | --- |
| `npm test` (`page.test.mjs`: a language change keeps the dialog open with its copy rewritten and focus on the language; the dialog outliving a bar drawn again and returning focus to the new profile button; "Change for all of Beyond" completed from the descriptor; `everywhere` as a function; `leave()`; `onclose`) | 238 of 238 |
| `npm run types` | No diagnostics |
| `npm run acceptance` in Chrome 154 (new in `checks/layout.mjs`: a wide table in a section at 320 px, a language change keeping the dialog open with its title rewritten) | 146 of 146 |
| `npm run acceptance -- page:` in Firefox 155 and WebKit 26.6 | 6 of 6 in each |

Tarball: `beyond-ui-0.6.2.tgz`, `sha512-xc8xk1SYfz1JvvwHBcW1kfIVTVYjOiFLSqIrobMa+hVzRpMTNRKY5isnBMlRfLieJwbS0glDGPFBW2NqD74bBg==`.

## Family reference synchronization

No reference impact beyond 0.12.2's: the reference draws "Language and appearance" as one dialog in the profile menu's product group, which this release keeps open across a language change.
