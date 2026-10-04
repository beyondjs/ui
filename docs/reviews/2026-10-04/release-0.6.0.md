# Release 0.6.0 — 4 October 2026

A minor release of `@beyond-js/ui` over [0.5.1](release-0.5.1.md): the family page system the owner approved on 2026-10-04 as decisions D52 and D54 (settled contract S23 in the family reference 0.12.0; decision 13 and 15 of the suite's repository connection review, `docs/reviews/2026-10-04/repository-connection/README.md` and `layout.md` there). Every 0.5.1 option keeps working. Nothing is published; products re-vendor 0.6.0 in their own assignments (`npm run pack:consumers -- <consumer>`).

## What it adds

| Rule | What 0.6.0 provides | Where |
| --- | --- | --- |
| LR-01, LR-09, LR-11: the frame edge to edge, content one gutter from the navigation | `Page`, a container beside the `Sidebar` (or under `ProductNav`) whose gutter is decided by the region's own width (container queries): 16 px under 640, 24 px to 1023, 32 px from 1024. Nothing is centered; unused width falls on the far side | `src/dom/page/page.js`, `src/styles/page.css` |
| LR-02: width tiers per block | `Page({ width })`: `fluid` (to `--layout-fluid-max`), `standard` (`--layout-standard`), `form` (`--layout-form`), `reading` (`--layout-measure`). The package's own prose (callout text, empty-state body, section description, header facts) stops at the measure; `.bui-reading` and `.bui-form-width` for a product's own blocks | `page.css` |
| LR-03: extra width buys structure | `Page({ aside })`: the side panel beside the main column from a 68rem region (a form column plus the panel), below it otherwise | `page.css` |
| LR-04: six templates | `Page({ template })` as `data-template` (overview, list, detail, settings, task, tool); `tool` has no gutter (D22's departures) | `page.js` |
| LR-05: one page header | `PageHeader`: crumbs only from the second level, the H1 naming what is in view (`focus()`), one status after it, a facts line, the line's actions centred on the H1 (under the title below 640 px), and `Tabs` below | `src/dom/page/header.js`, `tabs.js` |
| LR-06: flat sections | `Section`: heading, one description line, actions and content, set apart by space and one divider | `src/dom/page/section.js` |
| LR-08, D54: one place each for preferences and the way back | `Arrival` ("Opened from {product} · Back to {product}", EN/ES, same-origin takeover, Dismiss) and `PreferencesDialog` (Language and Appearance applied at once on this device, "Applies on this device." and "Change for all of Beyond"), which the family bar's profile menu opens as "Language and appearance", first in the product group, when a product passes `account.preferences` | `src/dom/page/arrival.js`, `src/dom/preferences/dialog.js`, `src/dom/family/account.js` |
| D52's tokens | Token set 0.3.0: `--layout-gutter` (16 px) with `--layout-gutter-medium` (24) and `--layout-gutter-wide` (32), `--layout-form` (40rem), `--layout-standard` (90rem), `--layout-aside` (22rem), `--layout-fluid-max` (100rem) and the compact 640 px band in `breakpoints`; the numbers are engineering defaults, to be measured | `src/foundations/scale.js`, `tokens.js` |

React renders `Page`, `PageHeader` and `Section` with the DOM classes' markup; `Arrival` and `Tabs` drive the DOM classes; the React `FamilyBar` passes `account.preferences` through. Declarations: `types/page.d.ts`, `types/family.d.ts`, `types/react.d.ts`.

Not in 0.6.0 (the review's phase 2, still to build): `SideSheet`, `Collection` column priority (LR-03's revealed columns) and list-detail at extra-wide widths.

## Checks

| Check | Result |
| --- | --- |
| `npm test` (new `page.test.mjs`: the region, its template and tiers, the side panel added and removed, invalid options refused, the header's parts and focus and empty parts hidden, `Section`, `Arrival`'s same-origin takeover and Dismiss and Spanish copy, `PreferencesDialog` applying each choice at once with its Spanish copy and refusing anything but a `Preferences`, the profile menu's entry and the bar's teardown; `react-page.test.mjs`: the React markup equal to the DOM classes', `Arrival` and `Tabs` under `StrictMode`, the React bar's entry; `tokens.test.mjs`: token set 0.3.0 is the baseline with exactly the recorded lines) | 238 of 238 |
| `npm run types` (a DOM consumer and a React consumer of the page system and `account.preferences`) | No diagnostics |
| `npm run acceptance` in Chrome 154 (new `checks/layout.mjs` on `layout.html` with the Sidebar, DOM and React 19: the H1 and the arrival line one gutter from the navigation at 320, 390, 1023, 1024, 1440, 1920 and 2560 px in both themes, no line past 80 characters, the action centred on the H1's line from 640 px and below the title under it, no sideways scroll; the side panel beside the main column from a 68rem region and below it under that; a fluid list using the width and a form page stopping at 40rem; "Language and appearance" opened from the profile menu, applying at once, leading to Accounts and returning focus) | 146 of 146 |
| `npm run acceptance -- page` in Firefox 155 and WebKit 26.6 | 9 of 9 in each |

Tarball: `beyond-ui-0.6.0.tgz`, `sha512-Q7Ydk+lNxJC4k/U9Al4CgoKk89fFDwLZ0NLqpvqqRc7M36e5MNVNezBay7rbACTi68Ekd8lpsR1EssFN9plnYA==` (`npm run pack:consumers`).

A pass is package evidence only, not a product result: each product's adoption is checked in that product and by the suite's `acceptance/family` `frame` phase.

## Family reference synchronization

Synchronized in the suite's reference with the products' adoption (reference 0.12.x, recorded there): the page system is D52 and D54 of settled contract S23, which reference 0.12.0 registered; the reference consumes this package's tokens from its vendored tarball.
