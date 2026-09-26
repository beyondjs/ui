# 0.1.5: a disclosure panel eases out when it closes — 26 September 2026

The Beyond desktop's owner rejected the notification panel's motion: it drops in and vanishes. The panel is this package's `Disclosure` (through `NotificationEntry`), which hid its panel at once with no exit. 0.1.5 adds the exit without changing the contract that closing hides the panel immediately.

## What changed

- `src/dom/disclosure.js`: closing still sets `hidden` on the panel before returning, so nothing in it can be reached (and `NotificationEntry` still forgets its items). Before hiding a **floating** panel (computed `position` `absolute` or `fixed`), an inert copy of it (class `bui-disclosure-leaving`, every `id` and the `role` removed, `aria-hidden="true"`, `inert`) is appended beside it; it eases out and removes itself on `animationend`, or after 400 ms at the latest. A panel in the page's flow (`Help`) closes at once as before, since a copy of it would hold its place and push what follows. With `prefers-reduced-motion: reduce` no copy is made.
- `src/styles/controls.css`, `base.css`, `header.css`: the copy is positioned like the panel, takes no pointer, and plays `bui-leave` (the reverse of `bui-enter`) for `--motion-quick`; the notification entry's width rules cover it.
- `tests/disclosure.test.mjs` (the two disclosure tests moved out of `controls.test.mjs`, which the 300-line target required, plus two new tests): the panel is hidden at once, the copy of a floating panel exists without identifiers, is hidden from assistive technology and inert, is removed when its movement ends, and is not made with reduced motion; an in-flow help panel closes with no copy and is never found twice.
- Version 0.1.5; the token set stays 0.1.0.

## What ran

| Command | Result |
| --- | --- |
| `npm test` (first version of the change) | 82 of 82 |
| `npm run acceptance` (first version of the change) | 65 of 67. Both failures were `help opens by keyboard and closes with Escape` (`dom`, `react19`): while closing, the in-flow help panel's copy was a second `.bui-help-panel`. The copy was a real defect, since it held the panel's place in the flow |
| `npm test` (repaired: copies only of floating panels) | 83 of 83 |
| `npm run types` | Clean |
| `node acceptance/run.mjs help` (isolated rerun of the failed area) | 4 of 4 |
| `npm run acceptance` (whole run on the repaired revision) | 67 of 67 (the packed tarball installed in the `dom`, `react19` and `react18` consumers, Chrome headless) |

## Consumers

Re-vendored by the Beyond desktop in the same assignment. Other products keep their versions until they adopt 0.1.5.
