# Release 0.6.1 — 4 October 2026

A patch release of `@beyond-js/ui` over [0.6.0](release-0.6.0.md), answering a report from Conduict's adoption of the page system. The token set is unchanged (0.3.0) and every 0.6.0 option keeps working.

## What changed

| Report | Cause | Change | Where |
| --- | --- | --- | --- |
| In Conduict, an environment's header with five tabs made the page scroll sideways by 62 to 163 px at 320–390 px, instead of the tab row scrolling inside itself; under 640 px, three header buttons did the same | `.bui-page-header` was a grid with an implicit `auto` column, so the tab row's full width (nowrap links in a nested scrolling list, which is not itself the grid item) became the column's minimum; `.bui-page-title` under 640 px likewise | `.bui-page-header` and, under a 640 px region, `.bui-page-title` have one `minmax(0, 1fr)` column, and `.bui-page-tabs` has `min-width: 0`, so the tabs scroll inside their row | `src/styles/page.css` |

## Checks

The acceptance's layout page now has six tabs and three header buttons. Its check failed on 0.6.0 ("320px light: no sideways scroll", DOM and React 19) and passes on 0.6.1. It also accepts actions that wrap below a long title from 640 px, and requires them on the title's line from a 1400 px region.

| Check | Result |
| --- | --- |
| `npm test` | 238 of 238 |
| `npm run acceptance -- page:` in Chrome 154, Firefox 155 and WebKit 26.6 | 6 of 6 in each |

Tarball: `beyond-ui-0.6.1.tgz`, `sha512-QHcGdNBi/Go+TSfHPlnjuGmwYGyHtPh7ryP846blsYBesXcxQqBHg7MKzJNKjnfoCwBpJTzqatukywHNjAO9Sg==`.

## Family reference synchronization

No reference impact: the correction makes a narrow header behave as 0.6.0 documented (the tabs scroll inside their row); no visible rule, wording or state changes.
