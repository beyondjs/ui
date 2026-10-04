# Release 0.6.3 — 4 October 2026

A patch release of `@beyond-js/ui` over [0.6.2](release-0.6.2.md). The token set is unchanged (0.3.0).

## What changed

| Report | Cause | Change | Where |
| --- | --- | --- | --- |
| CDN's administration, moving to 0.6.2: its own "Change for all of Beyond" address, built from its router with the screen in view, was replaced by one completed from `window.location` (`return=/` under its test's memory router) | 0.6.2 preferred the descriptor's `links.manage.account`, completed with the window's address, over the product's `everywhere` | The product's `everywhere` comes first (a string, or a function asked at each opening, for a product that routes itself); only without one does the bar use Accounts' account page from the descriptor, completed with the product and the page in view and marked `returned=accounts` like the account group's links | `src/dom/family/account.js` |

## Checks

| Check | Result |
| --- | --- |
| `npm test` (`page.test.mjs`: the product's own address first; without one, the descriptor's completed with `product`, `return` and `returned=accounts`; one dialog after the bar is drawn again) | 238 of 238 |
| `npm run types` | No diagnostics |
| `npm run acceptance -- page:` in Chrome 154 | 6 of 6 |

Tarball: `beyond-ui-0.6.3.tgz`, `sha512-blamdERutC5ZtcY5w+xiHvM4qknpCIiealLtavL0kuu8TxJoqUWGtVRH4/FeE8phERpYw/t2J1w5Pit+F8KBUA==`.

## Family reference synchronization

No reference impact: the link's destination is the same page (Your account at Accounts); only which address a product's bar uses changes.
