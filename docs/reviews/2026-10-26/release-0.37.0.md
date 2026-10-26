# Local UI 0.37.0: a borderless control placed by what it draws (D188)

Evidence baseline: UI `8ca9fb6` (0.36.0) on `feature/next` plus this change, made in a worktree on 2026-10-25 and 2026-10-26 for the suite's round `edged` (branch `claude/edged-20261025`) on top of 0.34.0 and rebased onto 0.35.0 and 0.36.0 before release, the order the day's rounds agreed. Token set 0.8.0, unchanged: the two new custom properties are the package's own, not tokens. Implementation is not the owner's acceptance.

## Why

The owner pointed at Conduict's composer, where the quiet "Try waking it up again" under "Development Machine · Needs attention · Access refused" looked misaligned because it has no border, and said the same happens in several places across the suite.

Measured, the eye was right:

- **A quiet button is placed by a box nobody sees.** Its words stood 13 px inside that box (a small button's 12 px padding and its 1 px transparent border), 17 px for a regular one. Wherever it started a line, ended one or wrapped under another, its words missed the edge the rest of the column keeps.
- **A near miss reads as a mistake.** In the composer's band the wrapped action's words stood 13 px from the state mark's edge and the state's words 15 px (the 9 px mark and its 6 px gap): 2 px apart, on neither.
- **Products compensated by hand and drifted.** Conduict hung its answer line's first action 8 px on top of `ActionLine`'s own 8 px, which in a fixture put its Copy glyph 8 px left of the answer's text; Snapshots hung its file viewer's actions 12 px past the head's end.

The owner approved the recommendation on 2026-10-25 (D188): no border; the package hangs a quiet control's padding itself; products remove their own compensations and review their gaps; and a check fails on near misses.

## What changed

A control that draws neither a border nor a fill at rest is placed by what it draws: its words, or its glyph, sit on the edge and in the gaps, and its surface (hover, press, focus) hangs past them (`styles/controls.css`, `quiet.css`, `composer.css`, `diff.css`, `list.css`, `list-tools.css`, `attachments.css`; `base.css` names the properties).

- **A quiet button with words** (`bui-button-quiet`, not `bare`) hangs its padding by `--bui-quiet-hang` (8 px, `--space-2`): its padding is the hang less its 1 px border, and a negative margin of the hang puts its words where its box would be. A glyph alone keeps its own geometry.
- **Beside another control**, or after a sibling that holds one (a chip's holder, a `Field`), it keeps its padding on that side, so two surfaces never meet: Cancel after Save stands one gap and its padding away. **Inside a sentence** (a paragraph's own quiet button) it keeps it on both sides.
- **In the package's rows of actions** (a page's or section's, a callout's, an empty state's, an `Unavailable`'s, a dialog's, a side sheet's and the like) it hangs only at the row's ends.
- **Beside text** its container gives it twice the hang (16 px): a composer band's sentence and its action, a large file's line and Show, a `CopyValue` and its Copy, whose surface hangs only toward the value.
- **A box narrower than the hang allows narrows it**: a composer's box sets `--bui-quiet-hang` to its inset less 4 px, so a surface stays inside its border, and its band ends its action's words on the inset.
- **An `ActionLine`** hangs its actions once, by the same property, on every row it wraps to; a bordered action in it counts its border.
- **Toolbars of the package's own** keep their quiet controls' padding: the list's query summary and restrictions, an attachment's Retry, a diff head's Copy path.
- **On a touch screen** a quiet button keeps its 44 px target; a short word's box grows toward its end, so its words stay where they start.
- **`--bui-status-axis`** (15 px, `Status`' 9 px mark and 6 px gap) says where a state's words start after its mark, for a product line that hangs the mark so what wraps under it starts under the state's words.

## How the choice was made

- **A border was rejected.** It would make every quiet action a secondary one, adding weight to each line of ways on (D102 keeps them quiet), and it answers an optical problem with ornament: the words still would not sit on the edge.
- **Hanging the padding** is what Radix Themes does for its ghost buttons: the surface keeps its room for the pointer and the focus ring, and only the words take part in the layout's edges.
- **Hanging globally, with exceptions the package knows**, was chosen over a class products opt into. A read-only audit of the products found about 33 places where a quiet action stands beside text or another control; the exceptions above keep the package's own, and each product's own row beside text was given twice the hang in the same round.
- **Measured before choosing**, in scratch fixtures with the package's built styles in headless Chrome: a composer band's wrapped action stood on the state mark's edge, and on the state's words where the product's line hangs the mark (0 px from each, against 13 px past the mark's edge and 2 px short of the state's words before); every quiet control starting a column's line stood on its edge (0 px); and an `ActionLine`'s first action stood on the text (0 px, against 1 px before).

## Executed checks

- **Unit suite:** `npm test`, 975 of 975, and `npm run types` compiles, at `dae2384`. New: `tests/hanging.test.mjs` (8 tests). On 0.35.0 plus the round, the whole suite found the round's comments and rules taking `composer.css` and `list.css` past the 300-line target (963 of 964): the box's hang moved to `composing.css` and `CopyValue`'s end to `rows.css`, both later in the build's order, so the rules apply as before.
- **Browser acceptance, the candidate** (0.34.0 `b397dc4` plus this round), the whole run through the machine's test queue: 416 of 417 in Chrome 155, 417 of 417 in Firefox 155 and 417 of 417 in WebKit 26.6. Chrome's one failure was this round's: a quiet "Start" 38 px wide on a touch screen, now 44 px; it passed again with the `hanging` check (3 of 3).
- **On 0.35.0 plus the round,** through the queue: the insets (D184), hanging and pressing checks and the touch screen's settings chips, 23 of 23 in each of Chrome, Firefox and WebKit.
- **After the rebase onto 0.36.0,** through the queue, from the packed archive below (`BEYOND_UI_TARBALL`):
  - Chrome 155, the whole acceptance: 437 of 437.
  - Firefox 155 and WebKit 26.6, the 104 checks that name the boxes' insets (D184), the hanging page, the presses (0.35.0), the touch screen's settings chips, the current tab and the targets below the bar (0.36.0, `clear:`), the composer, callouts, Copy, action lines, empty states and dialogs: 104 of 104 in each.
  - The whole acceptance was not run again in Firefox and WebKit after the rebases; their whole runs are the candidate's on 0.34.0.
- **The archive:** `dist-pack/beyond-ui-0.37.0.tgz`, packed at `dae2384`, integrity `sha512-l443X4CIhzB42Raq/ILEgckN7vjLQeZ7So8pLdjInlWnqpRfuH1FELOMHmgNZaOGMHXOa8WonPKBou4t41sqUQ==`. The products vendor it in the same round.

## Limits

- **A product's own quiet control** that does not carry `bui-button-quiet` is not hung; it follows the rule by hand with `--bui-quiet-hang`, never with a number of its own.
- **"After a sibling that holds a control"** uses `:has()`. A browser without it hangs the quiet control into that gap, its surface still clear of the neighbour by the row's gap.
- **A box that clips its overflow** with a quiet control at its unpadded edge clips the control's surface, never its words, by up to the hang on hover. The package's boxes keep it inside (the composer narrows it); a product's own clipping box narrows `--bui-quiet-hang` as the composer does.

Package evidence only. Each product vendors 0.37.0 in its own repository in the same round. Nothing here is screen-reader output or hosted behavior.

## Family reference synchronization

Synchronization blocked on order: the family reference registers D188 at 0.60.0 in its round `edged` (the suite's branch `claude/edged-20261025`), after the reference rounds that hold 0.57.0 to 0.59.0, which are not on the suite's `feature/next` yet (it holds 0.56.0). The suite's pending `family-quiet-controls-on-the-edge.md` holds the steps.
