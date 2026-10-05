# Release 0.7.9 — 5 October 2026

A patch release of `@beyond-js/ui` over [0.7.8](release-0.7.8.md), asked for by the suite's coordinating session after the final live run of Accounts' visual driver.

That run was on accounts `74dba13` with ui 0.7.8, after a fresh restart of the composition. It found 24 findings across 54 screens, all the same one: the "Organizations" crumb in `PageHeader`, 84 × 24 after rounding, but just under the driver's rule of 24 px (`box.height < 24`, unrounded).

0.7.7 gave the crumb and the arrival line's way back exactly 24 px. A fractional layout can take that a little under 24.

## What changed

| Change | Detail |
| --- | --- |
| A pixel of slack on each side | The block padding of a crumb's link and of "Back to {product}" is now (26 px − 1lh) / 2, at least 1 px (4 px where `lh` is not known). The negative margin gives the same back, so the hit area is about 26 px and the line keeps its height. The rule is in `src/styles/arrival.css` |
| The check keeps the slack | The first `page:` acceptance check now asks for at least 25 px. On 0.7.8 it fails with targets of 24.0 px |

## Checks

| Check | Result |
| --- | --- |
| `npm test` | 316 of 316 |
| `npm run types` | No diagnostics |
| `npm run acceptance` | 169 of 169 in each engine: Chrome 154, Firefox 155 and WebKit 26.6 |

Tarball: `beyond-ui-0.7.9.tgz`, `sha512-dqwmDOvLtD+AiBYS0qi3hZrSnAW809h+ph8O7Oww64FeF03SL8FT69wlg2VJo7S5ZhvJi0Sv7zte11ffiY4wng==`.

## Accounts' driver

Accounts' interface driver (`frontend/test/browser.mjs`) ran against the live composition, which the coordinating session restarted on 0.7.9 so that no prebundle of an earlier release was served. The run used accounts `b65dcd0`, `ACCOUNTS_UI=http://accounts.beyond.localhost:5190`, and `ACCOUNTS_RETURN` on Projects' origin in the composition, so the arrival line is offered and measured.

**Result: 54 screens, 0 findings.** On 0.7.8 the same driver found 24 findings, all the "Organizations" crumb under 24 px.

## What stays open

- **A multi-leg window's hand-over** stays deferred, as [0.7.5](release-0.7.5.md#what-stays-open) records.
