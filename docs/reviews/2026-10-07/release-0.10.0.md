# Release 0.10.0 — 7 October 2026

The conversation experience's component plan (Conduict's request "architecture and execution events",
its design sections 2.2 to 2.11 and component plan 4) asked the package for the pieces a conversation
with a coding agent is made of, generic enough for any product: a message box, text that arrives in
pieces, steps of work with their state, direct entries in the shared sidebar and a side panel kept in
view. The owner's questions Q-A (entries in the sidebar), Q-B (a thread width token) and Q-C (Enter
sends) are proposals: the components implement Q-A and Q-C as options a product chooses (Conduict
adopts both), and no token was added for Q-B.

## What changes

| Part | 0.10.0 |
| --- | --- |
| `Composer` (new) | A message box: an optional state line, a field of one line that grows to twelve and then scrolls, named by its label with no visible label, a toolbar with the product's tools at its start and its extras, the reason sending is unavailable (beside the action, D44), a stop action and the primary action with the other ways to send in a split menu. `submit: 'enter'` (default) or `'mod'`; an input method's Enter never sends; Escape is left to menus. One send at a time: the text leaves at once and comes back on a refusal with "Not sent. Your message is still here." (or the product's `explain`, or nothing) |
| `LiveText` (new) | Text that arrives in pieces, drawn at most once per animation frame through the product's renderer or as plain text, bounded, `aria-busy` with a live mark that is a word for assistive technology and still under reduced motion, never announced per piece; `settle()` and `abandon(note)` |
| `ActivityRow`, `ActivityGroup` (new) | A disclosure row per step of work: glyph, title, meta and state (`running`, `done`, `failed`, `denied`, `waiting`) in words, a duration on the clock, a live tail, a body built on first open from section records (12 lines, Show all, Copy); `update()` keeps open state and focus. A group folds consecutive rows under a title of their count and the state that matters most |
| `Sidebar` (changed) | Groups of `kind: 'entries'` (one line each, a mark in words, a `more` link), a top `action` link and a bounded `search` with its searching, no match and unavailable (Try again) states and a polite count; every update is patched by keys in both forms, so a live change never redraws the navigation or moves focus. Existing sections are unchanged |
| `Page` (changed) | `panel`: the aside as a `PagePanel` kept in view: beside and sticky from the region's `cut`, hideable there (`onchange` for the device to keep), a `SideSheet` below that `page.panel.open()` shows, `control(button)` joining a toggle whose `aria-expanded` follows; React `panelRef` and `PanelToggle`. Without `panel` the aside flows as before |
| `Steps` (changed) | `announce: false` leaves out its own live region, for a page that says changes through one region |
| Icon catalog | `file` and `terminal`, on the 24 px grid with the 1.8 stroke, always beside words (D11) |

No token changed: the token set stays 0.3.1.

## Deviations from the specification

- **The Sidebar keeps two copies.** The design spoke of one navigation shown in the drawer too; the
  package has always drawn it twice (the permanent panel and the drawer), and products' checks read
  `.bui-sidebar-panel nav` at every width. Both copies are patched from one model and draw one shared
  search, so "the drawer shows the same" holds without changing what consumers read.
- **A refused send's text comes back before what was typed meanwhile**, joined by a line break, so
  nothing the person wrote is lost; the specification said only that "the text stays".
- **Durations under one second are not shown** ("0 s" says nothing).
- **The panel's cut is measured by the class** (a `ResizeObserver` on the page's region and the
  window's resize), because a container query cannot take a per-instance value; `data-panel` carries
  the mode for the stylesheet.
- **React rows inside a group take section records** as their body (`rows` are values patched by
  key); a lone React `ActivityRow` may have React content as its body.
- **The Composer draws its placeholder** as one line laid over the empty field (`aria-hidden`), ending
  with an ellipsis; the textarea keeps its own placeholder for assistive technology. No engine cuts a
  textarea's placeholder with an ellipsis, and Firefox counts a wrapped one in the field's height.

## What ran

All on the final source, whose packed tarball is
`sha512-2Gx3CzKrAzaiX+pRvhG7E9cF1WfXLDLz9U2Cwubz5Jz3kOa65YrQd6W/fh8223s4+rX5AnU5M5tcbd8xKkuuPQ==`
(`dist-pack/beyond-ui-0.10.0.tgz`).

- `npm test`: 376 tests, 376 pass, 0 fail (332 before; new: `composer.test.mjs` 10, `live.test.mjs` 6,
  `activity.test.mjs` 7, `entries.test.mjs` 7, `panel.test.mjs` 6, `react-conversation.test.mjs` 6 and
  its run on React 18.3.1, and `Steps`' `announce: false` in `operations.test.mjs`).
- `npm run types`: clean, with the typed consumers `conversation.ts` and `conversation.tsx` and their
  expected errors.
- `npm run acceptance`, three consumers (plain DOM, React 19.3.0, React 18.3.1), 198 checks each run
  (173 before; 25 new on the `conversation.html` pages), each engine a full run on the final source:
  Chrome 154.0.8037.98 198 of 198, WebKit 26.6 (Playwright's build) 198 of 198, Firefox 155.0
  (Playwright's build) 198 of 198. An earlier Chrome run on the same source failed one existing check
  (a collection's click timed out after 30 s), which passed alone in both consumers and in the full
  run above.
- Fixed before that final run, from runs on earlier sources:
  - Firefox counts a wrapped placeholder in an empty textarea's height, which fitted the empty field to
    two lines at 320 px: an empty field keeps its first line and its placeholder is drawn as one line
    ending with an ellipsis. A check that measured React's state before its commit was corrected.
  - Conduict's conversation page in WebKit (its cross-engine run): focus did not return to the panel's
    toggle when its sheet closed after a click, since WebKit does not focus a clicked button, and the
    panel's measurement inside its own `ResizeObserver` callback raised a "ResizeObserver loop" error.
    `PagePanel` now returns focus to the toggle pressed (else its first toggle; `open(from)`,
    `toggle(from)`) and decides a change of the region's width in the next frame; `panel.test.mjs`
    covers the toggle that did not take focus.
  - Conduict's cross-engine run then measured its resting result card at two lines at 1280 px: a page
    made outside the document guesses from the window's width, and since the decision waited for the
    next frame, a product that places `page.element` itself (Conduict, the family reference) drew the
    panel beside for one frame where the window clears the cut and the region does not. The panel now
    also measures in the frame after it is made, before a page placed in the same task is first drawn
    (`mount()` already decided at once, React's adapter makes it in a layout effect). `panels.mjs`
    checks the first frame's mode for both placements at 1280 and 1440 px in each engine; it failed
    without the change ("its first frame drew it beside, not sheet").
- Under a load average above 40 on the machine, an earlier full Chrome run failed one existing check
  (0.5.1: a menu closed and opened again keeps one sign-out entry), which passed alone and in every later
  run; another Chrome run ended when its browser closed under a load average of 67 and counts as no
  evidence.

No screen reader and no real input method were run: an input method's Enter was dispatched as
synthetic events. A pass is package evidence only, not a product's adoption.
