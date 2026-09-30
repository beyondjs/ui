# Token set 0.2.0 and the approved foundations — 29 September 2026

On 2026-09-29 the owner approved the family reference's foundation decisions with amendments: the token set (D08, with a control boundary), the product type scale (D09, with weight 400, a larger sentence-case label and the shipped Rubik), flat surfaces (D10, with window elevations), the brand orange (D12) and sentence case everywhere (D20's extension). This record covers their implementation in `@beyond-js/ui` on the branch `decisions-foundations`. The icons and preferences of the same round (D11, D07) are recorded in `decisions-round-icons.md`. The package version is left at 0.2.2 here; the release that carries this work is the round coordinator's.

## What changed

| Decision | Change | Files |
| --- | --- | --- |
| D08 | Token set 0.2.0, `status: 'approved'`, with `approval` (date, owner, decisions). New role `border-control`: light `#767676` (new primitive `gray-500`, 4.54:1 on white), dark `#8e99bb` (navy-300, 5.78:1 on the dark surface), declared as `graphic` pairs on `canvas` and `surface`. `border-strong` stays for dividers, tags and the divider between toggles | `src/foundations/color.js`, `tokens.js`, `types/tokens.d.ts` |
| D08 | Control boundaries take `border-control`: inputs and native selects, the picker's check and radio marks, the toggle group, menu and disclosure buttons, secondary buttons (their hover now darkens to `--color-text`, since the muted color is no longer darker than the boundary in the dark theme) | `src/styles/forms.css`, `controls.css`, `picker.css` |
| D09 | `--weight-regular` (400) with its reason; `label` 0.75rem, tracking 0.02em, a sentence-case reason. Every rule of the stylesheet at `--text-small` or `--text-label` states weight 400 or 500; the three that set 300 (the family menus' panel and meta, a field's "optional") now use 400. Labels (table headings, stacked rows' column labels, tags, menu headings) are 500 | `src/foundations/scale.js`, `src/styles/*.css` |
| D09 | Rubik 300/400/500, latin and latin-ext, as woff2 (the files of `@fontsource/rubik` 5.3.0, unchanged) with the SIL OFL 1.1 licence, and `fonts.css` with one `@font-face` per weight and subset (`unicode-range`, `font-display: swap`). Exported as `@beyond-js/ui/fonts.css` and `@beyond-js/ui/fonts/*`; `fonts/` is in `files`, so `npm pack` carries it (8 files, 94 kB). `styles.css` does not import it | `fonts/`, `package.json` |
| D10 | `window` and `window-focus` elevations from the Desktop's `--frame-shadow` and `--frame-shadow-focus`, resolved per theme: an elevation entry may carry `dark`, which `TokenSheet` writes in the dark blocks. The rule is documented in `scale.js` and the catalog. No stylesheet of the package put elevation on an in-page surface before or after: the new test passed on the 0.2.2 stylesheet too | `src/foundations/scale.js`, `sheet.js` |
| D12 | The corals state their use (`use` field): coral-400 `#e46f4e` is the brand orange, coral-600 its text and fill variant on light, coral-200 its text variant on navy, coral-500 only the light accent and focus color; never white on coral-400. No value changed | `src/foundations/color.js` |
| D20 | The four `text-transform: uppercase` rules and their wide tracking are removed (`.bui-table thead th`, the stacked `td::before` label, `.bui-badge`, `.bui-navmenu-heading`), with the `text-transform: none` that undid one of them. The package's English defaults and the Spanish fixture copy were already written in sentence case; no string changed | `src/styles/collection.css`, `feedback.css`, `navigation.css` |

The token sheet's diff from 0.1.0 is exactly: the header, `--weight-regular`, `--text-label` and `--tracking-label`, the two window elevations, `--color-border-control` in each of the three theme blocks and the two dark window elevations in each dark block.

### What products see

- Labels grow from 11 px to 12 px and lose their capitals and 0.08em tracking: tags, table headings and stacked labels become shorter in width and slightly taller. Menu section headings read as written ("This project in each product").
- Control borders are darker (`#c8c8c8` → `#767676` light, `#424f6e` → `#8e99bb` dark).
- Small text that used to inherit a product's body weight (often 300) is now 400.
- A product that wants Rubik from the package imports `@beyond-js/ui/fonts.css` (or serves it with its woff2 files) and removes its own font source.

## Checks

| Check | Result |
| --- | --- |
| `npm test` (build, then Node's test runner over happy-dom) | 129 of 129 pass. New: `tests/foundations.test.mjs` (5), `tests/fonts.test.mjs` (5), and in `tests/tokens.test.mjs` the baseline-plus-changes proof, approval, `border-control`, the type scale, elevation and the brand orange's use (the byte-for-byte test is replaced by the baseline-plus-listed-changes test) |
| Negative control | `tests/foundations.test.mjs` run against the 0.2.2 stylesheet: 4 of 5 fail (case transform, Rubik 300 below body, labels, `border-control`); the elevation test passes, as it should |
| `npm run types` | Passes (typed DOM and React consumers) |
| `npm run acceptance`, Chrome 154.0.8037.92 | 92 of 92 |
| `BEYOND_UI_BROWSER=firefox`, Firefox 155.0 | 92 of 92 |
| `BEYOND_UI_BROWSER=webkit`, WebKit 26.6 | 92 of 92 |

The acceptance gained two checks for the `dom` and `react19` consumers: tags, menu headings, table headings and the 390 px stacked labels are shown as written (`innerText` equals `textContent`, `text-transform: none`) at 12 px, weight 500 and at most 0.02em tracking, and table text is weight 400; and Rubik 300, 400 and 500 load from the installed package's `fonts.css` with latin-ext requested only for text that needs it (`Łódź`). Every acceptance page now imports `@beyond-js/ui/fonts.css`, bundled by esbuild (`.woff2` as files); the Rubik TTF copies in `acceptance/fixtures/brand/` are removed, and the lockup geometry checks (18–40 px, both themes, all widths) pass on the shipped woff2 in the three engines. Screenshots of the plain DOM pages at 1440 and 390 px in both themes were inspected by eye; they are not versioned.

The unit source test that rejects machine-specific paths now ignores a Git worktree's `.git` file, which names the main checkout; the check was failing in any worktree before this change.

## Not established

- No product adopted token set 0.2.0 or `fonts.css` in this assignment; product reflow at 1440, 390 and 320 px is for each product to measure.
- The window elevations are derived values; the Desktop still uses its own custom properties until it maps them.
- Screen reader output and Safari itself (WebKit is Safari's engine) were not exercised.

## Family reference synchronization

**Synchronization blocked** in this assignment, which does not edit `branding/`. The reference consumes the token data: its manual's color roles and contrast pairs gain `border-control`, its type specimen gains weight 400 and the 0.75rem label, its elevation page gains the window levels, and its brand pages should state D12's orange roles; its mockups of tables, tags and menus still show capitals by style where they reuse package classes. The owner is the round's coordinator, who integrates the reference with token set 0.2.0 and records D08, D09, D10, D12 and D20 as approved.
