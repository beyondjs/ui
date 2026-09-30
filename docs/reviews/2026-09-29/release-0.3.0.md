# `@beyond-js/ui` 0.3.0: the decisions round (2026-09-29)

Evidence type: local integration and release, with executed unit, declaration and installed browser checks. Branch `decisions-release` from `feature/next` at `5bd1c68` (0.2.2). Nothing is published; the tarball is vendored by each product.

## What 0.3.0 contains

- **Foundations** (branch `decisions-foundations`, [its record](decisions-round.md)): token set 0.2.0, approved by the owner (D08: `border-control` on every control boundary; D09: `--weight-regular` 400 below body size, `--text-label` 0.75rem in sentence case; D10: `window` and `window-focus` elevations; D12: the corals' use), Rubik 300/400/500 latin and latin-ext shipped as `@beyond-js/ui/fonts.css` with its OFL licence, and no case transform in the stylesheet (D20).
- **Icons and Preferences** (branch `decisions-icons`, [its record](decisions-round-icons.md)): one catalog of 53 outline glyphs (`icon`, React `Icon`, `icons`, `unlabeled`) at 16, 20 and 24 px, and `Preferences` with `usePreferences` (D07).
- **Closed at integration** (D11):
  - Every icon-only control of the package shows its accessible name as a tooltip (`Hint`, `src/dom/core/hint.js`): the dialog's close, a toast's dismiss, chip removal, the header toggle, `Help`, the bell, the anonymous account and a glyph-only `ActionMenu`. It shows on hover after 300 ms, at once on keyboard focus (`:focus-visible`, or focus that follows a key, which WebKit does not mark), and for 1.5 s on a touch press. It is `aria-hidden` and describes nothing, so the name is heard once, and it is drawn inside a modal dialog. `Tooltip` takes `describe: false` for the same use in products; `Disclosure` takes `hint: true`.
  - `help` and `user` joined the owner's closed list of ten, **for the owner to confirm**. Both are conventional glyphs (essential help beside a field, the account before a name is known), named and with their tooltip.
  - The family bar's Docs link keeps its label wherever it shows. Between 480 and 719 px it had shown its book glyph alone; with the label it no longer fit at 480 px beside a sidebar toggle and a Spanish label ("Documentación"), so it now moves into the account menu below 600 px instead of 480.
- Merge resolution: the two branches met in the acceptance consumer's entries (the font loader and the icons pages), the README's module table, the acceptance guide and the validation guide. The token sheet, fonts, exports and the stylesheet order (`base`, `icons`, then the rest) merged without conflict.

## Checks

| Check | Result |
| --- | --- |
| `npm test` (build, Node's test runner over happy-dom, React 18.3.1 suites in a child process) | 154 tests, 154 pass, 0 fail |
| `npm run types` | compiles with no error |
| `npm run acceptance`, Chrome 154.0.8037.92 | 104 passed, 0 failed, 104 checks |
| `BEYOND_UI_BROWSER=firefox npm run acceptance`, Firefox 155.0 | 104 passed, 0 failed, 104 checks |
| `BEYOND_UI_BROWSER=webkit npm run acceptance`, WebKit 26.6 | 104 passed, 0 failed, 104 checks |
| `npm pack` | `beyond-ui-0.3.0.tgz`, 105 files, integrity `sha512-gDs+uLnPDZgt5xr7i/hUofMPWStL2yYXkZOuYi0V0W8BVExSWnDxYW1dsfnnZ5t0GlHsCF5cDTtBPEYtAIfWcQ==`, the same tarball the three acceptance runs installed |

The acceptance now measures the family bar at 600 and 480 px as well (one row, nothing outside or overlapping, the Docs label shown at 600 px and above and in the account menu below), and at 600, 660 and 719 px with the family's four long product names and long organization and project names, in both consumers. `checks/icons.mjs` hovers every control that carries a tooltip on the consumer page and checks its text, `aria-hidden` and the absence of `aria-describedby`, then focuses the open dialog's close button after a key and checks that the tooltip shows inside the dialog. A first WebKit run failed that step because a focus trap's focus did not match `:focus-visible`; the tracker in `core/interaction.js` now remembers whether the last press was a key. WebKit, like Safari by default, does not Tab to buttons, so the check moves focus by code after a key.

## What did not run or is not established

- No product has adopted 0.3.0 yet; each product's adoption, measurements and records are their own assignments.
- `Tooltip` appends to the page's body. Inside a modal dialog, a product's own `Tooltip` is under the top layer, while the package's own tooltips are drawn in the dialog.
- No screen reader was run: "heard once" rests on `aria-hidden` and the absence of `aria-describedby`, not on the speech output.
- The owner has not yet confirmed `help` and `user` on the closed list.

## Family reference synchronization

**Synchronization pending (coordinator).** Visible changes in 0.3.0 to reflect in the family reference: token set 0.2.0 and its foundations (see the foundations record), the icon catalog replacing `branding/src/app/parts/icons.js`, tooltips on icon-only controls, the Docs link moving into the account menu below 600 px, and `Preferences` with "Change for all of Beyond". The reference re-vendors 0.3.0 in the coordinator's integration.
