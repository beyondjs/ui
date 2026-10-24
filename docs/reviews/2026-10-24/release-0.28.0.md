# Local UI 0.28.0: a visible action named whole (D179)

Evidence baseline: UI `f53a095` (0.27.0) on `feature/next` plus this change, made in a worktree on 2026-10-24 for the suite's D179 round. Token set 0.6.0 is unchanged. Implementation is not the owner's acceptance.

## Why

On 2026-10-24 the owner read Conduict's Repositories and took "Clone to a machine…" and "Choose a copy…" for labels cut by the layout; they were whole, ending in the desktop menus' "asks for more before it acts". The owner approved D179 for every product of the suite:

1. A visible action never ends with "…": it names the task whole, in English and Spanish alike.
2. Inside a menu the "…" stays, for an entry that opens a further step before it acts.
3. An action's label is never cut by the layout. A name a person wrote may be cut only while it is whole on hover, focus and in the opened menu (D44).
4. Waits, a busy button's `{label}…` and placeholders are unchanged.

## What this package drew against it

The package's own words were audited in both languages, DOM and React (React draws through the DOM classes):

- **Kept: menu entries.** `RefChooser`'s "Use a commit or another ref…" («Usar un commit u otra referencia…») as the `ChoiceMenu`'s action entry. `ProjectPicker`'s `actions` ("New project…", given by the product) are drawn only as `ChoiceMenu` entries.
- **Kept: waits.** `Button`'s and the composer's busy `{label}…`; "Loading…" and "Loading {name}…" (`loading`, `Collection`, `Picker`, `DataTable`, notifications, the branches); "Searching…" (sidebar, palette, composer suggestions); "Signing out…"; "Trying again…" (`AgainLine`, `Session`); "Transcribing…"; "Writing…"; "Sending your answer…"; "Checking what happened on {provider}…".
- **Kept: placeholders.** The palette's "Search or jump to…" («Busca o ve a…»).
- **Changed: one visible action.** The same escape is drawn as a link beside branches that can't be read or aren't there. It is now named whole, "Use a commit or another ref" («Usar un commit u otra referencia»), from the same `escape` label without its "…". A product's own `escape` label follows the same way.

The stylesheet's `text-overflow: ellipsis` rules were each traced to what they cut:

- **None is an action's label.**
- **Names and values whole elsewhere (D44):**
  - the compact header's title, through a tooltip;
  - an attachment's name, through a tooltip;
  - the family bar's organization and project, through a tooltip and the opened menu;
  - a lane's title and kind, through a tooltip;
  - a sidebar entry's title and a section's meta, through a tooltip;
  - a `CopyValue`, through a tooltip;
  - a composer chip's value in the fitted toolbar, through the chip's tooltip and the open menu;
  - the folded Options' summary, through the button's name and tooltip.
- **Secondary lines:**
  - a row's muted line, which wraps on a narrow row (L10);
  - a lane's kind, live line, time and facts;
  - a composer suggestion's detail.
- **The composer's placeholder.**

Two gaps were corrected:

- **A `ListRow`'s name was cut with nothing showing it whole.** It now shows whole in a tooltip on hover and keyboard focus, and none that fits. The tooltip is made on first need and hidden from assistive technology, since the name is the link's own name.
- **The command palette cut its options' label and detail.** The palette is an opened list, so a name in it has nowhere else to be whole. Its options now wrap, the detail going under the label when both do not share the line.

## What it adds

- **`Ellipses`** (DOM and React export, `src/dom/core/ellipses.js`), modeled on `Primaries`. In a development build it names, once per action, a shown action outside a menu whose visible words end in "…" (or "..."):
  - an action is a button, an element with the button role or a link styled as an action;
  - a menu, a listbox, an option, a menu item and the command palette keep their "…";
  - a disabled or busy action is a wait and is not checked;
  - words only for assistive technology do not count.

  A `Page` (DOM and React) starts one by itself while `Ellipses.enabled`; a product may start one over its own root. It never changes the page. Declarations are in `types/command.d.ts`.
- No token changes. No public API was removed.

## Executed checks

- **Unit suite:** `npm test`, 818 of 818. New and updated cases:
  - `ellipses.test.mjs`:
    - `Ellipses` warns once for a late action, and never for a menu entry, an option, a disabled or busy action, a hidden one or a visually hidden "…"; three dots count;
    - `RefChooser`'s escape keeps its "…" in the menu and is named whole as the link;
    - every ellipsis of the built stylesheet is one of the reviewed names, values and placeholder, and none is a button's, link button's, menu button's or menu entry's label;
  - `cut.test.mjs`: a `ListRow`'s cut name whole on hover and focus, none that fits, and no tooltip left behind after a redraw or destroy; the palette's label and detail among the opened lists that wrap;
  - `chooser.test.mjs`: the visible escape's Spanish words.
- **Declarations:** `npm run types` compiles, with `tests/fixtures/types/ellipses.ts`.
- **Browser acceptance:** `npm run acceptance`, 365 of 365 in each of Chrome 155.0.8059.85, Firefox 155.0 and WebKit 26.6, installed from the packed 0.28.0 archive into the `dom`, `react19` and `react18` consumers. It holds that nothing drawn before changed under the palette's wrapping, the row's tooltip and the escape's words. No browser check was added for them: the row's tooltip and the palette's wrapping are measured in happy-dom only.

## Limits

This is package evidence only: no product has re-vendored 0.28.0, and nothing here is a product browser result, screen-reader output or hosted behavior. `Ellipses` sees only what a page draws while it is developed: a product's labels in closed menus are not checked, since a menu's entries keep their "…". It also cannot tell an action that opens a menu from one that acts at once, so a menu entry that acts at once and wrongly ends in "…" is the product's own review.

## Family reference synchronization

No reference impact from this repository's side: the family reference (Beyond Suite's `branding/`) records D179 and its writing guidance in the suite's own stream. The visible escape's words and `Ellipses` are package behavior the reference's catalog may name when it next syncs its `RefChooser` and development-warning entries.

## Artifact

- Archive: `dist-pack/beyond-ui-0.28.0.tgz`, packed by `npm run pack:consumers` from the release commit with no consumer named, so nothing was copied into another repository.
- SHA-256: `2deca7ab255e2b623d38843cd9bf1319af3dc9b0eb4e265d8a5e1bd79ed90bbb`.
- Integrity: `sha512-QO5RUD1jewswj/tp5bOLX5mRxw3+8gwd7IOjEI6ZATb0O4Klfdf4luN/08qx0U4cxH+NRXqEROu3dpSIkCbEqg==`, the same as the archive the browser acceptance packed.
