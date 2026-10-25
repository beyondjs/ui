# Local UI 0.34.0: focus says what the keys do there (D187)

Evidence baseline: UI `7568947` (0.32.1) on `feature/next` plus this change, made in a worktree on 2026-10-25 for the suite's round `lit` (branch `claude/lit-20261025`). It is numbered right after 0.33.0, the day.s other two rounds following it as 0.35.0 and 0.36.0, and rebased onto 0.33.0 before release. Token set 0.8.0. Implementation is not the owner's acceptance.

## Why

The owner looked at the composer's coral frame and asked for the best focus indicator: outstanding, and in the suite's direction (futuristic, modern, intuitive, subtle). Then, showing a coral ring around a side sheet's "Details" title, they said that indicator does not apply there at all, and that one indicator should not serve every case.

One ring for everything was wrong in two ways:

- **It ringed places that are not controls.** A product moves focus to a heading, a sheet's title or a list's region so a screen reader starts reading there. A ring there tells a sighted person something can be done where nothing can. The package drew it on a side sheet's title and on `Collection`'s region after a page change, from the keyboard.
- **It framed boxes in the error's colour.** The composer's box drew a 2 px coral border with a glow inside, and a field a coral ring 1 px outside its border. On a box, a coral border reads as its error: on navy the focus coral (`#ffa385`) sits beside the danger (`#ff8a80`), and on white a coral frame is the convention of an invalid field. In a thread the composer has the focus almost always, so its frame was the brightest thing on the screen beside Send, the region's one primary.

## What changed

Focus takes the form of what the keys do there (`styles/focus.css`, right after `base.css`):

- **The ring: a control the keyboard reached.** Coral, 2 px, 2 px outside the control's own shape, only on `:focus-visible`. It settles onto the control in `--motion-quick`, from 6 px out and clear, and appears at once under reduced motion. One rule at no specificity draws it for every element of the page, a product's own included, so products drop their own copies.
- **The edge: a box that takes typing or keys.** A field, a select, the searches, a `CommandCard`'s editable command and the composer's box light their own border in the new role `--color-focus-edge` (token set 0.8.0: the text's tone, navy on light, mist on navy) with `--bui-focus-halo`, a 3 px ring of that light at 14 %, from a pointer as from the keyboard. Nothing rings them. The caret is coral. A wrong value keeps its danger edge with `--bui-focus-halo-danger`. `bui-edge` gives a product's own box, or a field that is its own box, the same edge.
  - A `CommandCard` takes Enter and Escape while it has the focus, however it got it, so it lights on `:focus`, keeping its attention stripe.
  - A diff's lines, a region that scrolls by keys with no border of its own, light their edge inside them.
- **The cursor: the item the arrow keys are on.** Rows, menu entries, options, hunks, lanes and a turn's marks keep their inner ring, which moves at once (`animation: none`); a row also takes the pointer's light while it is the cursor. The selection's coral bar stays the selection's.
- **Nothing: a place reading starts.** An element focused with `tabindex="-1"` and no interactive role draws nothing, from the keyboard as from a pointer. A side sheet's title and `Collection`'s region no longer draw a ring.
- **Never covered.** `PageDock` measures the dock into `--bui-page-dock`, and the document's `scroll-padding-bottom` keeps what the keyboard reaches above the dock and its fade (WCAG 2.4.11).
- **A forced-colors theme** draws no shadows or fills, so every edge takes a 2 px `Highlight` outline there.
- **The composer.** Its box lights while its field has the focus and rests while one of its controls has it. A press in the box's empty room (its padding, the toolbar's gaps, the room under the words) puts the caret in the field without the focus leaving, so the edge never flickers. The live line runs 1 px inside the top edge: drawn over it, as before, it vanished into a lit edge in the light theme.

`--color-focus-edge` holds 3:1 on the canvas, the surface and the raised surface (WCAG 1.4.11). From `--color-border-control` it changes by 3.6:1 in light and 2.3:1 on navy, where the halo and the caret add to it; WCAG 2.4.13, a AAA criterion, is not met on navy.

## How the choice was made

Four forms of the composer's and a field's focus were drawn with the package's real components in both themes before choosing (the agent's prototype, not kept in the repository):

- **A (0.32.1):** the coral border with a glow inside;
- **B:** the box's own edge in the text's tone with a halo of the same light and a coral caret;
- **C:** a coral hairline with a coral halo;
- **D:** the text's edge with a coral halo.

A and C read as the error state beside a field with a wrong value, in both themes. D's warm haze around a navy line read as neither. B was calm and unmistakable in both. The row's cursor was also drawn with a coral bar at its start; that bar already means "where you are" (the sidebar's current item, the bar's menus, the palette's chosen option), so the cursor keeps its inner ring.

## Executed checks

- **Unit suite:** `npm test`, 881 of 881 (before the renumbering, then the touched files 30 of 30 after it). Updated: `tokens.test.mjs` (token set 0.8.0, `approval.focus`, the role's pairs), `edges.test.mjs` (the composer's lit edge, never the coral border, the coral caret), `foundations.test.mjs` (a focused box's halo is a mark, never elevation).
- **Browser acceptance:** `acceptance/checks/focusing.mjs` (`dom`, 7 checks on the new `focus` fixture) passes in Chrome 155. A full Chrome run outside the machine's queue (started before the queue existed) showed `family.mjs`'s keyboard check reading the ring's colour mid-settle; the check now reads it once the ring has settled. To be completed: the full run in Chrome, Firefox and WebKit through the queue, from the archive rebased onto 0.35.0.

## Limits

- The ring has no specificity, so a product's unlayered reset that styles focus outranks it: Tailwind 3's preflight (`:-moz-focusring { outline: auto; }`) makes Firefox draw its native ring once a product's own ring is gone, which the round found adopting Accounts. Such a product keeps one rule after its reset (catalog, "A product's reset").

Package evidence only. Each product vendors 0.34.0 in its own repository in the same round. Nothing here is screen-reader output or hosted behavior.

## Family reference synchronization

The family reference records D187 and vendors 0.34.0 in its round `lit`, after the day's earlier reference rounds.
