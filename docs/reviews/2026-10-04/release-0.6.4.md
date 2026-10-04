# Release 0.6.4 — 4 October 2026

A patch release of `@beyond-js/ui` over [0.6.3](release-0.6.3.md), answering an independent review of 0.6.0 to 0.6.3 that the suite's coordinating session commissioned. The token set is unchanged (0.3.0).

## What changed

| Finding | Cause | Change | Where |
| --- | --- | --- | --- |
| Medium: the React `FamilyBar` was made again whenever `account.preferences.everywhere` changed. CDN's administration passes an address built from the screen in view, so every navigation tore the bar down: its menus closed, focus fell to the page's body and the notification slot was appended again; an inline function, which 0.6.3 recommends, would have done it on every render | `everywhere` was among the bar's dependencies | `everywhere` and `onclose` are read from the latest props when used; only the product's `Preferences` instance and its `locales` make a new bar | `src/react/family.js` |
| Low (accessibility): `PageHeader`'s `<header>` carried `aria-labelledby` | Inside `<main>` a `<header>` has the generic role, which takes no name (ARIA 1.2); outside it, it is a second banner beside the family bar | The header takes no name; the H1 names the page. A page stays inside the shell's `<main>` | `src/dom/page/header.js`, `src/react/page.js` |

## Checks

The new React test fails on 0.6.3 (a new bar after the address changed) and passes on 0.6.4.

| Check | Result |
| --- | --- |
| `npm test` (`react-page.test.mjs`: the same bar and profile button after a string address and two inline functions, the dialog reading the latest address and the latest `onclose`; now also run on React 18.3.1 through `react18.test.mjs`; `page.test.mjs`: the header has no `aria-labelledby`) | 240 of 240 |
| `npm run types` | No diagnostics |
| `npm run acceptance` in Chrome 154 | 146 of 146 |

Tarball: `beyond-ui-0.6.4.tgz`, `sha512-qXyFz6/fT3NvETUGG1hfLMFrknQyoxvjI36KyNoXx5fZGPvo3qCTACJyrqdGTugql2tzlUjEZnjjAS03oyTclQ==`.

## Family reference synchronization

No reference impact: neither change alters what a person sees; the first keeps the bar's menus and focus across a navigation, as the reference draws them.
