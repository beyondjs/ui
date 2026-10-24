# Local UI 0.29.0: a thread read by turns (D180 to D184)

Evidence baseline: UI `938aff7` (0.28.0) on `feature/next` plus this change, made in a worktree on 2026-10-24 for the suite's round `turned`. Token set 0.7.0. Implementation is not the owner's acceptance.

## Why

On 2026-10-24 the owner reviewed Conduict's conversation page with three references beside it: Conduict itself, Claude Code's own panel and Codex's index of earlier messages. Their review asked for five things:

- the conversation's messages across the screen, with the message box keeping its width;
- the person's message in view while its answer is read ("además sticky");
- Codex's small marks to move between earlier messages;
- no "Write a message first." warning, which adds nothing;
- even margins inside the message box ("el inferior es menor que el superior").

They then directed the refined proposal to be implemented to the highest standard, every word considered, and its insights taken into the family's guidance. The package carries the family's part:

1. **D180, a thread reads by turns.** The turns take the region's width up to 80rem, centred; the composer keeps a 48rem lane on the same axis. The cap keeps a line of prose near 170 characters on a wide screen instead of 300. Until 0.28.0 (D96) the message, prose and composer shared one 54ch lane.
2. **D181, the compact line says where you are.** It names the page's title, or the part in view the product names, such as the message of the turn being read once it has gone under the line. What a page pins replaces what was pinned there, never stacks.
3. **D182, a long thread has an index of its turns.** It has one mark per turn in the thread's gutter, a preview, and Option/Alt with the arrows.
4. **D183, no false alarm.** An empty field or a step not yet taken is never said as a failure.
5. **D184, one inset.** A box keeps one inset on every side, measured from the font's capitals and the controls' edges.

## What changed

- **Tokens (0.7.0).** `--layout-thread` is 80rem (52rem before); `--layout-lane` is 48rem, the composer's lane (the reading measure after the rail's indent before). `tokens.approval.turns` records D180, amending D96 and D67. The reading measure stays 54ch.
- **The thread template.** Rail items, activity rows' heads and tails and `LiveText` no longer stop at the lane; they take the turn's width. A centred thread's dock stands under the middle of its turns. A panel kept in view comes next to the turns and takes what they leave. From a 1024 px region the thread's gutter is 48 px, which holds the index; the dock keeps one 32 px gutter under it. The taller editor (Expand) takes the composer's lane.
- **`PageHeader`'s `subject`** (DOM; React `subject`). The compact line names the part in view in place of the title:
  - as written, on up to two lines, without the empty lines between paragraphs;
  - quoted with a 2 px edge;
  - a link to that part, out of the tab order and hidden from assistive technology like the title;
  - `data-subject` on the holder.

  While a thread has a compact line, or a line says a subject, the page's targets land below its taller form (`--bui-page-compact-tall`, 3.5rem), so a jump lands at one place on every turn.
- **`TurnIndex`** (DOM and React, `src/dom/turns/`):
  - **Marks.** One link per turn (a button without an address) in a list that hangs in the thread's gutter, sticky halfway down the window. The turn being read is current. A turn that runs, needs the person or failed carries its state's `Status` shape. The marks under the pointer lengthen, never under reduced motion. The index shows from two turns and a 1024 px region.
  - **Preview.** One card beside the index, placed by `Floating`, describing the mark it shows.
  - **Keyboard.** A roving tab stop. Option/Alt with ArrowUp and ArrowDown move from the page, never from a field, a dialog or a menu. Going back from inside a turn whose message is out of view goes to that message first, and a second press moves on from the first press's turn.
  - **`onview({ key, covered })`.** Which turn is under the page's sticky edge, and whether its opening message has gone above it.
- **The composer.**
  - With nothing to send, Send is quiet and `aria-disabled`, the split menu's entries are disabled, and a press only focuses the field. A step keeps Send able.
  - The `empty` copy ("Write a message first.") left the set.
  - A refused send is said in the state band, on a row of its own, with `role="alert"`.
  - One inset on every side: 12 px, and 8 px under 30rem of composer. The field's top is `calc(inset − (1lh − 1cap) / 2)`, measured from the font, with 8 px where `lh` and `cap` are unknown. The toolbar, the tray and the attachments sit on the same inset.
- **No public API was removed** but the `empty` label.

## Executed checks

- **Unit suite:** `npm test`, 829 of 829. New: `turns.test.mjs` (9), `alarm.test.mjs` (2), the compact line's subject in `thread.test.mjs`; updated: `composer.test.mjs`, `attach.test.mjs`, `composing.test.mjs`, `edges.test.mjs`, `foundations.test.mjs` (the preview overlaps, so it may take `--elevation-menu`) and `tokens.test.mjs` (token set 0.7.0).
- **Declarations:** `npm run types` compiles, with `tests/fixtures/types/turns.ts` and `turns.tsx`.
- **Browser acceptance:** `npm run acceptance` from the packed 0.29.0 archive into the `dom`, `react19` and `react18` consumers, in each engine:
  - Chrome: RESULT_CHROME;
  - Firefox: RESULT_FIREFOX;
  - WebKit: RESULT_WEBKIT.

  New checks (`turning.mjs`, on the new `turns.html` pages, the React page in Spanish):
  - the turns up to 80rem and the composer's lane on their axis, from 1024 to 2560 px in both themes;
  - the index in the gutter, its preview in the top layer, the marks lengthening, still under reduced motion and gone under a 1024 px region;
  - the compact line saying the message of the turn being read and going back to it, and Option/Alt with the arrows;
  - the quiet Send, and the inset measured from the font's own capitals: 13 px above them and 13 px under the controls from the box's outer edge (12 px and its border), the + and Send one inset from the sides.

  The D96 checks of `anchoring.mjs`, `thread.mjs` and `fitting.mjs` now measure D180.
- **Corrections the browser showed before release:**
  - **A phone's chips.** At 320 px the wider inset folded a phone's chips behind Options, so a composer under 30rem keeps an 8 px inset.
  - **The sticky edge.** It moved when the line changed form, so a thread keeps the taller form.
  - **A second Option/Alt press.** Pressed before the page had scrolled, it repeated the first turn; it now moves on from it.

## Limits

This is package evidence only. Conduict adopts 0.29.0 in the same round (its `docs/reviews/2026-10-24/turns.md`); no other product draws a thread. CDN and Beyond Home draw the shared composer and keep 0.25.x until they vendor 0.29.0 (the suite's pending `family-ui-0-28-adoption`). The index reads the turns' boxes and the document's `scroll-padding-top`. A product whose sticky chrome is not the family's sets that padding itself. The marks' 4 px pitch at a hundred turns is a pointer target only through its whole row; a turn is also reached by keyboard and by its heading. Nothing here is screen-reader output or hosted behavior.

## Family reference synchronization

The family reference (Beyond Suite's `branding/`) records D180 to D184 in its round `turned` and draws Conduict's conversation on this package.

## Artifact

Packed by `npm run pack:consumers` from the release commit: ARCHIVE_LINE.
