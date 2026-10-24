# Local UI 0.30.0: a resource page's raised panel

Evidence baseline: UI `f45b127` (0.29.0) on `feature/next` plus this change, made in a worktree on 2026-10-24 for the suite's pending `family-resource-page-adoption`. Token set 0.7.0, unchanged. Implementation is not the owner's acceptance.

## Why

On 2026-10-24 the owner rejected Conduict's repository page and asked for a better one whose findings apply across the family. The redesign became the family's resource page: the person's work on the object leads the main column, the object's conditions stand in a raised side panel, and its record is a tab (the suite's `branding/docs/foundations.md`). Conduict drew the raised panel with styles of its own and placed what follows a copy's row under the machine's name with a measured offset of 9 px plus the row's gap, because the package offered neither. Every product that follows the composition would have copied both.

## What changed

- **`Page`'s `raised`** (DOM option and setter, React prop). The aside is drawn on `--color-surface-raised` with a 1 px line in `--color-border`, `--radius-base`, `--space-5` inside and no shadow (C2). Its regions are divided by a line with `--space-5` on each side, and their headings take the body's size, still semibold (D158). `data-raised` marks it. A panel kept in view (`panel`) is never raised. Styles in the new `styles/resource.css`.
- **Under a row's name.** `--bui-row-axis` is the distance from a list item's edge to its row's name when the row leads with a state's mark: the row's padding, the 9 px mark and the gap. `.bui-row-under` starts what the item holds after its row there (its quiet actions, a fold, its technical details) and ends it one row padding before the item's end. An item whose row leads with an icon, or nothing, sets the property itself.
- **No public API was removed.**

## Executed checks

- **Unit suite:** `npm test`, 830 of 830. `page.test.mjs` holds `raised` (flat by default, kept across an aside removed and given again, never on a panel kept in view) and `react-page.test.mjs` renders React's `raised` with the DOM page's markup.
- **Declarations:** `npm run types` compiles, with `raised` in `tests/fixtures/types/resource.ts` and `resource.tsx`.
- **Browser acceptance:** `npm run acceptance`, from the packed 0.30.0 archive in the `dom`, `react19` and `react18` consumers:
  - Chrome 155.0.8059.85: 375 of 375;
  - WebKit 26.6: 375 of 375;
  - Firefox 155.0: 373 of 375 in the full run, while other browser runs shared the computer. The two failures were motion timings unrelated to this change, "drawer motion" in `react19` (no 200 ms slide sampled) and "the panel enters and leaves…" in `dom` (the thread's width sampled during the exit). Each passed when run again alone (`npm run acceptance -- "drawer motion"`, 2 of 2; `-- "the panel enters and leaves"`, 1 of 1).

  The new check (`checks/layout.mjs`, the `layout.html` pages with `?raised=1`, in `dom` and `react19`) measures at 390, 1024 and 1440 px in both themes: the aside on the raised surface's own colour with a 1 px line and no shadow, its two regions divided, a copy's mark on the panel's edge (its section heading's), its quiet actions in `.bui-row-under` starting under the row's name, and no sideways scroll. Its first run compared the panel's colour with the page's and failed in the light theme, where the raised surface is the page's white and its line sets it apart; it now compares it with the token as resolved.
- **Correction before release:** the panel's rules pushed `page.css` past the 300-line target, so they moved to `resource.css`.

## Limits

This is package evidence only. Conduict adopts 0.30.0 in the same change (its repository page draws the panel with `raised` and its copies with `.bui-row-under`, Conduict `cf14c26e`). The other products vendor 0.25.0 to 0.28.0; their resource pages and their adoption are the suite's `*-resource-page-adoption` pendings. Nothing here is screen-reader output or hosted behavior.

## Family reference synchronization

The family reference (Beyond Suite's `branding/`) records the raised panel in its round `raised` (0.52.0) and draws it with its own styles until it vendors 0.30.0.

## Artifact

- Archive: `dist-pack/beyond-ui-0.30.0.tgz`, packed by `npm run pack:consumers` from `695d985` and copied into Conduict's `frontend/tools/`.
- SHA-256: `c7ad00cb5b2f4400162e5592d96210001f04fb6447dc7817faaf75a67b1f3382`.
- Integrity: `sha512-7Ay6TsPAGRyHdy08TOCIcleolZTC9uqQtxG8QVN4bKODLZiALO5aS0KWDD5V7dkmhCqwp+wReZMcl75APFrhzQ==`, the one Conduict's lockfile records.
