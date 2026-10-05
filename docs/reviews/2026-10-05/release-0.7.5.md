# Release 0.7.5 — 5 October 2026

A patch release of `@beyond-js/ui` over [0.7.4](release-0.7.4.md), asked for by the suite's coordinating session after Projects vendored 0.7.4.

0.7.4 set the provider window's opener to null. That broke a trip whose window stays open, the first leg of Projects' two-leg Connect GitHub: it relied on a `postMessage` to its opener to wake the page, and with the opener gone nothing woke it. Projects added a same-origin `BroadcastChannel` for its own page (projects `11266ef` and later). That cannot reach a product hosted on another origin, such as Conduict's side sheet running Projects' task. This release makes `ProviderWindow` itself end every trip from the server, across origins. Only `ProviderWindow` changes; the token set stays 0.3.0.

## What changed

| Change | Detail |
| --- | --- |
| The attempt is read while the window is open | Every `interval` ms (2500 by default; 0 turns it off), one read at a time, for at most `follow` ms (15 min). A late answer is dropped, and `read()` stays bounded by `bound` (20 s). A window that stays open (the first leg of a two-leg connect) or a landing on another origin than the page therefore ends as soon as the server says `done` or `waiting`. The closed-window poll (`poll`, 500 ms) stays |
| A same-origin wake-up | `ProviderWindow` listens on the `BroadcastChannel` named `channel` (`'beyond-provider'` by default; `null` for none) for `{ type: 'beyond-provider' }`, so a landing on the page's own origin wakes it at once without an opener, and products no longer each add one. The `message` handler for `origin` stays |
| The window opens blank, then goes to the address | It opens on this origin (`open('', 'beyond-provider')`), loses its opener there, and only then goes to `href` (`location.replace`). WebKit navigates a window that `open()` returns afterwards and refuses that navigation once the opener is gone, so dropping the opener right after `open(href)` (0.7.4) could stop Safari from reaching the provider at all. If a window of that name is left on another origin, it is opened again by name at the address |
| The page closes the window only while it is on this origin | A window on another origin with no opener can only close itself: Chrome refuses the page's `close()`, and WebKit reports it as an unsafe navigation. Firefox allows it, but the behavior is now the same in every engine. A landing closes itself once it has recorded the outcome, as Projects' does, or says the window can be closed |
| React `ProviderWindow` | Takes `interval`, `follow` and `channel` |

## Checks

| Check | Result |
| --- | --- |
| `npm test` | 311 of 311, two cases more than 0.7.4: a window that stays open is read every interval, one read at a time, and ends on `done`; a channel wakes it with no interval, and closes with it. The 0.7.4 cases now also check that the window opens blank, loses its opener, then goes to the address |
| `npm run types` | No diagnostics |
| `npm run acceptance` | 168 of 168 in Chrome 154, Firefox 155 and WebKit 26.6. New: `choose: provider window across origins`, where the page is on `127.0.0.1` and the stand-in landing on `localhost` (another origin) with no opener. The landing goes through two legs that only record their outcome on the acceptance server (`/attempt`) and never close or message the page, and the page ends the trip by reading |

A probe in Chrome confirmed, before the change, that the page cannot close a window whose opener it dropped, whether or not the window navigated since.

Tarball: `beyond-ui-0.7.5.tgz`, `sha512-IaNNNkOju1E/XxOvy0iRl3KHoaOBhRlCjINh8ryClCFohsegUVcBLWp+1xdtd4+mXUh7apg/7PS8EsbOIk+DnA==`.

## Consumers

Projects is the only consumer of `ProviderWindow`, through `service/src/interface/assets/trip.js`. Its landing closing itself and its channel keep working, and its own channel can be removed in favor of this one. One case to check in Safari: Projects' second leg navigates the named window with `window.open(address, 'beyond-provider')` while that window is on another origin with no opener. WebKit may refuse it as it refused the page's `close()`. This release's acceptance does not exercise that navigation, because its two legs run in place.

## Family reference synchronization

There is no visible change of the reference's own. The suite's family reference records the vendored version with the products' move to it.
