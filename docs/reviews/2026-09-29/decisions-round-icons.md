# Decisions round: the icon catalog and Preferences (2026-09-29)

Evidence type: local implementation with executed unit, declaration and installed browser checks. Branch `decisions-icons` from `feature/next` at `5bd1c68` (package 0.2.2, token set 0.1.0). Nothing is published; the release (0.3.0), its version bump and the merge with the tokens, type, fonts and elevation half of the round belong to the coordinator.

## What changed

**One icon catalog (D11).** `src/dom/core/glyphs.js` holds 53 outline glyphs on the 24 px grid, drawn by `.bui-icon` with one 1.8 px round stroke. It merges the package's 15 glyphs, the family reference's 41, Workspace's client set of 18 (drawn at 1.7 on the same grid; now 1.8), the Desktop's window controls (drawn with CSS borders until now: `pin`, `minimize`, `maximize`, `restore`) and CDN's step markers (a 20 px grid; `exclamation` is the one distinct glyph). Duplicates were removed by drawing and meaning: Workspace's `files`, `diagnostics`, `inspect`, `talk`, `caret`, `down` and chevron `back` are the catalog's `folder`, `alert`, `box`, `chat`, `right`, `chevron` and `left`; its `review`, `preview` and `captures` are named `merge`, `window` and `archive`; the reference's `book` gives way to the package's drawing. [The catalog guide](../../components.md#icons) lists every name and the mappings.

- `icon(name, { size = 20, label = null })` and React `<Icon name size label />` render identical markup at 16, 20 or 24 px (`.bui-icon[data-size]` in the new `src/styles/icons.css`): decorative (`aria-hidden`) without a label, `role="img"` with `aria-label` with one. An unknown name, another size or an empty label throws. `icons` (every name) and `unlabeled` (the closed list) are exported from both modules, with types in `types/icons.d.ts`.
- The components draw the same glyphs unsized through an internal builder (`glyph`, React `Mark`), so their sizes and look are unchanged; their `glyph` options now fail on an unknown name.
- The closed list of glyphs that may stand alone on a control, with an accessible name and a tooltip: `close`, `menu`, `more`, `search`, `bell`, `chevron`, `pin`, `minimize`, `maximize`, `restore`.
- `tests/support/names.mjs` surveys a page's controls (visible text, accessible name, glyphs); the unit suite runs it over a scene of every component that draws an icon-only control, and the acceptance runs it in the browser at several widths. It found one defect, corrected here: between 480 and 719 px the family bar's Docs link showed its `book` glyph alone with no accessible name (the stylesheet hides its text). The link is now named "Docs".

**Preferences (D07).** `Preferences` (`src/dom/preferences/`) owns a product's language and appearance: `restore()` for the first paint from the device copy, `apply()` for the account's values on arrival (a missing or `null` appearance is unset and keeps the product's default), `choose()` for device-only changes, the `appearance`, `locale` and `current` getters, and `subscribe()` returning its release. It sets `data-beyond-mode` (removed for `system`) and `lang` on `<html>`, stores only `{ appearance, locale }`, and guards every storage access. `Preferences.labels` carries the EN/ES copy ("Change for all of Beyond", "Cambiar en todo Beyond", and the appearance names); React reads it with `usePreferences`. Types in `types/preferences.d.ts`.

## Checks

| Check | Result |
| --- | --- |
| `npm test` (build, then Node's test runner over happy-dom; React 18.3.1 suites in a child process) | 135 tests, 135 pass, 0 fail |
| `npm run types` | compiles with no error |
| `npm run acceptance` in Chrome 154.0.8037.92 | 96 passed, 0 failed, 96 checks |
| `BEYOND_UI_BROWSER=firefox npm run acceptance` (Firefox 155.0) | 96 passed, 0 failed, 96 checks |
| `BEYOND_UI_BROWSER=webkit npm run acceptance` (WebKit 26.6) | 96 passed, 0 failed, 96 checks |
| Negative controls | the unit survey fails when `user` is removed from the recorded exceptions; the browser survey fails at 600 px ("icon-only a.bui-family-docs (book) has no accessible name") with the Docs link's name removed |

The acceptance adds eight checks (four per consumer, DOM and React 19): every catalog glyph inside its 16/20/24 px box with a 1.8 px stroke and no fill, the labelled icon as an image; icon-only controls named and on the closed list with a menu and a dialog open at 1280 and 390 px, and in the family bar at 1440, 600, 390 and 320 px, ready and loading; and `Preferences` (product default first, a device choice painted first after a reload, an arriving account with an unset appearance keeping the default and switching to Spanish, `system` removing the attribute, and a page whose `localStorage` throws still painting and choosing). The Chrome run packed the source of the first commit; Firefox and WebKit packed it with the guides' changes, which touch no module.

`tests/sources.test.mjs` now also ignores a worktree's `.git` file, which names the main checkout's path.

## What did not run or is not established

- No product adopts the catalog or `Preferences` in this branch; each product's adoption is its own assignment.
- The package's own icon-only controls (dialog close, toast dismiss, chip remove, header toggle, action menu glyph) carry names but not yet the tooltip D11 asks for.
- Three glyphs the package shows alone are outside the closed list and on record for the owner: `Help`'s question mark, the family bar's account avatar before a name is known (`user`), and the Docs link's `book` between 480 and 719 px. Showing the Docs label there is a stylesheet change (`src/styles/family.css`) with a re-measure of the bar, left to the integration because that stylesheet belongs to the other half of the round.
- No screen reader was run; the accessible names are computed by the survey's simplified algorithm and by the engines' role queries.

## Family reference synchronization

**Synchronization pending at integration.** The branch changes no visible component behavior (the Docs link gains an accessible name equal to its text). D11 asks the reference to consume the catalog instead of `branding/src/app/parts/icons.js`, and D07 changes how products apply appearance and language; both follow when the coordinator releases 0.3.0 and the reference re-vendors it. Affected: the reference's icon set and the component catalog entries for icons and preferences (`branding/src/family/components/consumers.js`). Token set unchanged in this branch (0.1.0).

## Closed in the 0.3.0 integration

The open items above were closed when the round was integrated and released as 0.3.0 (see [the release record](release-0.3.0.md)): the package's icon-only controls show their names as tooltips, `help` and `user` joined the closed list for the owner to confirm, and the Docs link keeps its label, moving into the account menu below 600 px.
