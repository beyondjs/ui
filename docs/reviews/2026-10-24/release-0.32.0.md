# Local UI 0.32.0: nothing still to write is a failure, one inset in every box and a composer settled in its frame

Evidence baseline: UI `6f4e55c` (0.31.1) on `feature/next` plus this change, made in a worktree on 2026-10-24 for the suite's round `settled`. Token set 0.7.0 is unchanged. Implementation is not the owner's acceptance.

## Why

The round `turned` (0.29.0) left three pendings in the package, recorded in the suite's register:

- **D183 in forms.** D183 (approved on the owner's direction of 2026-10-24) says an empty field or a step not yet taken is never said as a failure. 0.29.0 applied it to the composer only. A required `Field` left empty still said its `valueMissing` message ("Enter a name."), and a form without `Field` objects let the browser say "Please fill out this field".
- **D184 in every box.** D184 says a box's content keeps one inset on every side, measured optically. 0.29.0 measured the composer only; no other box was read.
- **The composer narrowing flash.** The family reference's browser checks once read the composer misplaced for under 150 ms right after the window narrowed, its + 40 px in or its box 44 px wide. The cause was not established.

## What changed

### Nothing still to write is a failure (D183)

- **`Field`'s `missing`.** A required field with nothing written is `missing`: blanks, an unchecked required box, a required choice with nothing chosen. `check()` answers false for it with no message, no `aria-invalid` and no call to `validate`, so `messages.valueMissing` is never shown. A wrong value is still said, and an emptied field's error goes with nothing in its place.
- **`FocusedForm`.** While a required field is empty, its submit buttons are quiet (`aria-disabled`, still reachable). A submission puts the caret in the first field that needs something, saying nothing when that field is empty. Without `Field` objects the form's own required controls are read the same way, and a wrong one says the browser's message. `settle()` draws the quiet state again after a redraw; the React adapter calls it after every render. `destroy()` leaves the buttons as they were.
- **`prompt`.** Confirm is quiet while its required field is empty, and Enter keeps the caret there.
- **`SecretField`'s `required`.** A required secret still to give is `missing`: nothing stored to keep and nothing pasted, blanks included. Given to a `FocusedForm`'s `fields`, it keeps the submit quiet, and a press opens its fold and puts the caret in its input, saying nothing. Replace and Keep tell the form at once. React's ref exposes `missing`, `check()` and `focus()` as well. Conduict asks for a secret's value behind such a fold and said "Enter a value." when Save was pressed without one.
- **The composer's `attach.words`** (DOM and React). It names what ready files wait for. With it, files alone are nothing to send: Send stays quiet, a press and Enter send nothing and put the caret in the field, and the field says those words in place of its placeholder until words are written. Without it, a ready file goes alone as before.
- **`Required`, `Quiet` and React's `Form`, one way for every product.** When the products adopted the rule, Accounts, CDN's administration and its backoffice each wrote a form of their own, and Projects wrote a quiet control twice. The copies already differed: one read a `Picker` marked as waiting, one a footer button that names its form, one text a number field could not read. The package now holds them once:
  - **`Required`** reads what a form waits for: a required control with nothing in it that the browser validates, or a part the product marks `data-missing`. Text the browser could not read is wrong, not missing. It keeps the submit buttons quiet, a dialog footer's that name the form with `form` included, and a busy one keeps its state. `hold(event)` stops a submission there, with the caret in the first part that waits. `Field.missing`, `FocusedForm` and `prompt` are built on it.
  - **`Quiet`** is one control that waits for a choice made elsewhere, such as Add while nothing is chosen. A press while it waits only puts the person at `place()`, and the control's own handler never runs.
  - **React's `Form`** is the family's form for a product that sends its own submission: the same quiet wait, then `onSubmit` once nothing waits. A form drawn inside its React tree, such as a dialog's, submits only itself.
  - **A `Button`'s `waiting` and `place`** (DOM and React) say the same for an action outside a form: quiet and still reachable, a press only putting the person at `place()`.
  - **A required `SecretField`** marks itself `data-missing` and answers `Required`'s `bui-focus` by opening its fold, so React's `Form` waits for it too. Delegate's "Connect with Supabase" sent an empty pasted token otherwise.

### One inset in every box (D184)

- **The boxes.** Every box of the package that holds text or controls inside a border or a fill keeps one inset on every side. Each names it as a custom property (`--bui-<box>-inset`), a step of the spacing scale equal to its earlier side padding, so no width changes. The catalog's "One inset (D184)" table names each box: callouts, `Unavailable`, `Recovery`, the framed empty state, `Checklist`, `CommandCard` and its code, choice cards, raised sections and the raised panel, help, `CopyMessage`, a textarea, Technical details, a confirmation's consequence, the awaited card, `Select`'s and `ChoiceMenu`'s chevrons, `Dialog` and its kin, `SideSheet`, toasts, menus, a notification row, a turn's preview and the palette.
- **How a side is measured.** Two late stylesheets hold the rules, `insets.css` for the page's boxes and `insets-floating.css` for the surfaces over the page:
  - Where a box's own text starts or ends it, its padding takes off the line's half-leading, `calc(inset − (1lh − 1cap) / 2)`, as the composer's does.
  - Where a heading, a label or code in another size or face leads or ends it, that line trims itself to its capitals and baseline (`text-box`).
  - A row of controls keeps the inset to its edges.
  - A borderless close glyph ends one inset from the end, its target hanging past it.

  Without `lh` and `cap`, or `text-box`, every box keeps its earlier padding.
- **What a person sees.** Boxes whose bottom was looser than their top get a little shorter, for example a toast by about 13 px and a dialog by about 5 px. A side sheet's actions stand one inset from its bottom and from their divider, 20 px where they were 12 px. `Select`'s and `ChoiceMenu`'s chevrons end one inset from the border, 12 px where they were 8 px.
- **A step's first line** sits in the middle of its 24 px mark at any line height, so an awaited card's last step ends it on its mark.
- **A `<code>` inside a code box** takes the box's monospace. The browser's own style had drawn it in its default face (Courier in Chrome).
- **Held otherwise.** The catalog says each exception's reason, and the `insets` checks measure them for the record:
  - a chip's words are centred in its target;
  - the family bar's menu panels keep rows that are controls;
  - an activity exchange keeps its Copy;
  - a choice menu keeps its check column;
  - a box ending in the product's own last row ends by that row.

  Not drawn by a fixture yet: the editable `CommandCard`, `Recovery`'s wide form, compact density and coarse pointers.

### A composer settled in the frame its width changes

- **The cause.** The toolbar's fit decided its level one frame late. Its `ResizeObserver` asked for the next frame, so the frame where a resize landed drew the level of the earlier width. At 390 px a running Codex turn's toolbar took four rows for that frame in Firefox and WebKit. In Chrome, a font load reported between the window's change of size and its `resize` event was measured on the earlier layout. Options then stood bare before the +, which put the + 40 px from the text's edge: the flash the reference saw.
- **The window's resize.** `ComposerFit` decides it in the frame it lands, from an animation frame requested by the `resize` event, after the Sidebar and a page's panel follow the new width. Fonts that finish loading are decided in a frame too.
- **`Relayout`, new.** A width can change without the window: the page's panel hidden or shown beside, its wide form, the Sidebar's panel. Hiding the panel at 1440 px drew one frame at 768 px with the 710 px toolbar. Those parts now tell it with a `bui-layout` event (`Relayout.hide` and `Relayout.mark`), sent once and only on a change, and the composer settles in that frame. `Relayout` is public, for a product that moves a column itself.
- **No style changed.**

## Executed checks

- **Unit suite:** `npm test`, 871 of 871. New: `missing.test.mjs` (6), `required.test.mjs` (8), `react-form.test.mjs` (4), `relayout.test.mjs` (2), `insets.test.mjs` (7) and a test in `react-choose.test.mjs`. Updated: `fit.test.mjs`, `panel.test.mjs`, `react.test.mjs`, `dialog.test.mjs` and `followup.test.mjs`. `sources.test.mjs` holds every source and test file at 300 lines or fewer.
- **Declarations:** `npm run types` compiles, with `tests/fixtures/types/forms.ts` and `forms.tsx`. They add `Required`, `Quiet` and React's `Form` (`types/forms.d.ts`), `Field.missing`, `FocusedForm.missing` and `settle()`, `SecretField`'s `required`, `missing`, `check()` and `focus()` (optional on React's ref, so an earlier ref type still compiles), `attach.words` and `Relayout`.
- **Browser acceptance:** `npm run acceptance`, 399 of 399 in each of Chrome 155.0.8059.85, Firefox 155.0 and WebKit 26.6, installed from the packed 0.32.0 archive below into the `dom`, `react19` and `react18` consumers (`BEYOND_UI_TARBALL`). An earlier full run, on an archive before the last corrections, failed five timing checks in Firefox and none in Chrome while the machine ran other agents' work at a load average near 80; each passed alone, and none failed in the full run of this archive. New checks:
  - `missing.mjs`: a focused form's quiet submit pressed where it rests, the caret in the empty title with nothing said, blanks counting as nothing; a required secret behind its closed fold, Save quiet and a press opening it with the caret in its input (`dom`; it fails on the archive without `required`); a `Quiet` Add that only goes to the search until a choice is made, also inside a shadow root (`dom`; the shadow root fails on the archive that read the press's target); React's `Form` whose footer names it, waiting for a marked choice and then a note (`react19`); a composer's files waiting for words.
  - `keyboard.mjs`'s prompt check: Enter on the empty field keeps the caret.
  - `settling.mjs`: every frame painted for 300 ms after the window narrows (1440 to 390, 1440 to 1100, 1024 to 700 and 600 to 440 px) and after the panel beside is hidden and shown at 1440 px. From the landing frame, each one is the settled frame within 1 px. Without the fix it fails in all three engines; without the composer's `bui-layout` listener its panel case fails.
  - `insets.mjs`: each box at 1440 and 390 px in both themes, from its inner border edges to its first line's capitals, its controls' edges and its content's start and end, within a pixel.

  The shared hierarchy check now reads a leading heading's line itself.
- **Corrections before release:**
  - **WebKit's press on a quiet submit.** A quiet control takes none of Playwright's actionability waits. The main page still moves while its inbox and picker load, so a forced click landed on whatever moved under the pointer. The check now presses the button once its box is still across frames, as a person does, and passes five runs of five in WebKit.
  - **The panel's change.** Found while proving the flash fix: a panel hidden beside still drew one frame late. `Relayout` answers it, and the check fails without it.
  - **The products' own copies.** Found in the products' adoption and folded into the package before release (above). The products replace their copies with it.
  - **What the copies still lacked.** Found when Delegate, Beyond Home and the Packages interface took the package's pieces: React's `Form` could not wait for a required `SecretField`, React had no quiet button, and `Quiet` read a press inside a shadow root by its retargeted target. The browser check of a shadow root fails on the archive before.
  - **A prompt's typed value.** Its quiet Accept now hears the form, where a typed value's input bubbles; the unit test had sent an input that did not bubble, which typing never does.
  - **Files sent without their words.** Found while preparing Conduict's adoption: with `attach.words`, Send looked quiet, but its press and Enter still sent the files alone, since the send path read only whether a file was ready. It now reads the same rule as Send's look. The unit test and the browser check press Send and Enter, and both fail on the earlier archive.
  - **A side sheet's actions and a code box's `<code>`.** Both were found by the inset measurement: the actions stood 12 px from the sheet's bottom against its 20 px sides, and the `<code>` was drawn in the browser's monospace.

## Limits

This is package evidence only. Each product adopts 0.32.0 in its own repository in the same round. There it removes the `valueMissing` messages 0.32.0 makes unreachable, applies D183 to its own validation and reads its own boxes for D184: see each product's record of 2026-10-24 and the suite's pendings. The inset measurement holds Inter at the body, small, label and title sizes in the three engines. A product that sets another face or size on a box measures it itself. Nothing here is screen-reader output or hosted behavior.

## Family reference synchronization

The family reference (Beyond Suite's `branding/`) vendors 0.32.0 in its round `settled` and records the application of D183 to forms and of D184 to every box there.

## Artifact

- Archive: `dist-pack/beyond-ui-0.32.0.tgz`, packed by `npm run pack:consumers` from the release commit with no consumer named, so nothing was copied into another repository.
- SHA-256: `cde593fbbc8b85e61bdab811efddc97b24b0ad7c35b19ff7decd148767797eb9`.
- Integrity: `sha512-OaH81T28rStglfnolsqwexmdKPxKzrC7TwtaI8y+u+2NrmoGsCGJil8bJQ1QFTd3iFpTdStUn+Cv41P/lWVk4w==`, byte for byte the archive the browser acceptance installed and the products vendor.
- Earlier archives of 0.32.0 went to the products while they adopted it and were replaced by this one in each: `1c12ee2` (`sha512-dpjE…IFawQ==`), `ec77ef5` (`sha512-TLHR…ukNRA==`) and `605546a` (`sha512-WicI…+xKr4Q==`).
