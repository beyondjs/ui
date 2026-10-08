# Release 0.11.2 — 8 October 2026

An independent usability review of Conduict's conversation round (on 0.11.1) found twelve majors, twenty
minors and six polish items. 0.11.2 takes every one whose fix belongs in the shared package: a viewer of
changes (M1), a composer toolbar that keeps one row at desktop widths (M3), a drop anywhere on the work
surface (M6), long values under their label (M10), wide screens used by the panel (M11), a refused file
that never holds a message back (M12), and minors 1, 2, 8, 9, 12, 13 (the lone dot), 16, 18 and 19.
Token set 0.4.1 raises the pending `--layout-aside-max` from 30rem to 40rem; D67's three layout lines
stay `pending`, proposals and not approved family rules.

## What changes

| Part | 0.11.2 |
| --- | --- |
| `Diff` (new; M1) | A change's files in a unified view: a unified patch (git's format or plain) or files already split; per file a region named by its path with its status in words, "+a −r", Copy path and a fold; old and new line numbers and a sign column; hunk headers; gaps between hunks said, never offered; only context the input carries folds; binary, rename-only, mode-only, empty, whitespace-only and unreadable parts said in words; a list of files from 4; keys between files and hunks; long lines scrolling inside their file; large patches bounded and drawn progressively; "Added line 12: …" read on demand; `Diff.parse`. No syntax highlighting |
| `Composer` (changed; M3) | The toolbar keeps one row by measured fit: every word, then chips by their value (label and calm state in the name and the family tooltip, values past 9rem cut while the tooltip and menu say them whole), then Options. Options folds only then (0.11.1 folded below 30rem). `summary` beside Options; `composer.toolbar.level`, `measure()` |
| `Composer` attachments (M6, M12, minor 9) | `attach.zone`: a drop anywhere on the product's work surface attaches, with one target over it, and the browser never opens the file. `state: 'refused'`: "Not attached · {reason}", no Retry, never sent, never holding the message back. A cut name whole on hover anywhere on its chip |
| Suggestions (minor 18) | Open at the "@" being typed, one line per option; the field keeps its textbox role without `aria-expanded` (`aria-haspopup="listbox"` instead) |
| `Facts` (M10) | A long value in words goes under its label, left-aligned (`long`, by default over 40 characters and not `mono`); wrapped values read from their start |
| `PagePanel` (changed; M11) | `--layout-aside-max` 40rem; the wide form takes every width the main column leaves, to the region's edge, the thread keeping its tier where it can and giving down to 22rem first |
| `PageHeader` compact line (minor 2) | The document's scroll padding keeps a scrolled-to target below the family bar, the sidebar's row and the compact line |
| `Disclosure` (minor 1) | A floating panel opens above when there is no room below; `placement: 'above'` always |
| `TechnicalDetails` (minor 12) | Its summary is the family's one disclosure affordance, `bui-summary`: a chevron that turns, the text color |
| `ChoiceMenu` (minor 13) | No dot alone on a closed menu: a calm state is in the name only |
| `CopyButton` (new; minor 19) | A copy confirmed in place, "Copied" with a check for 2 s, bounded, a refusal said and the shown text selected |
| `Bytes` (new; minor 8) | "300 B", "6.3 MB" in the locale, the same in the composer and a product's lines |
| `Hint` | `when` and `data-bui-tip`: a shortened control's whole words in the family tooltip |

## Choices and deviations

- **Measured, never a fixed width.** The review's family proposal asks for folding "by measured fit". The
  fit measures the toolbar's leaves (they must share one horizontal band) on width changes (a zero-height
  gauge across the composer, observed for its width, so a change of level never resizes what is observed
  and no observer loop is reported), on content changes and when fonts load. It never tries a level while
  Options is open or focused, so a focused control is never hidden by a trial.
- **The actions keep their words.** Only the closed list (D11) may stand as a glyph; Interrupt, Attach,
  Queue and the primary are not on it, so a running Codex turn in Spanish beside the panel (1024 and
  1440 px) folds its chips behind Options, which then shows the model (`summary`). That fold is truly
  needed: Attach, two chips at their value, "Interrumpir" and "Poner en cola" are wider than the composer.
  On a phone a running turn, folded, may still give its actions a second row.
- **A calm chip state leaves the face at `short`**, kept in the name and the tooltip, rather than as a dot:
  a dot never stands alone (the family rule). States that ask for attention keep their word.
- **The wide form fills the region** rather than stopping at a larger maximum, because a diff uses the
  width; the normal panel stops at 40rem, since label and value rows read poorly wider. At 2560 px the
  remainder past a normal panel still falls on the far side (LR-02).
- **Refused files are left out of `onsubmit`'s `attachments`**, not passed "as given": a refused file is not
  attached. `composer.attachments` stays the product's list as given.
- **No `aria-expanded` on the field.** A textbox does not take it; the list's presence is said by
  `aria-haspopup="listbox"`, `aria-controls` and the polite count. This changes 0.11.0's attributes.
- **No new color role for the dark message bubble** (minor 11): the approved token set has no role lighter
  than the canvas in dark that also differs in light; adding one is an owner decision. The contract tells
  Conduict to draw a `--color-border` boundary instead.
- **No syntax highlighting in `Diff`**: none ships in the package, and a highlighter is a dependency and a
  design decision of its own.

## What ran

On this checkout at `b14f445` (macOS, Node.js 22.21.1, `playwright-core` 1.63.0):

- `npm test`: 485 tests, 485 pass (Node's test runner with happy-dom), among them `fit.test.mjs` 7,
  `refuse.test.mjs` 7, `reading.test.mjs` 5, `react-fixes.test.mjs` 2 and `Diff`'s 25 (parser 8, view 8,
  keys and budget 4, update and destroy 3, React 2); `react18.test.mjs` runs the React suites, the new two
  included, on React 18.3.1. `npm run types` passes with the typed consumers `fixes.ts`, `fixes.tsx`,
  `diff.ts` and `diff.tsx`.
- `npm run acceptance` on the packed tarball `sha512-BOP7JBqCIWj2v4vbvicSEDOzozG6IEcc0e+BjofgYSiibS8+DPtV4wOwu6qb0iUsOYQm0COSEd5n4nip/A8wqw==`
  (the same integrity in every run and in the vendored `beyond-ui-0.11.2.tgz`), one clean full run per
  engine: Chrome 154 255 of 255, Firefox 155 255 of 255, WebKit 26.6 255 of 255 (three consumers: plain
  DOM, React 19.3.0, React 18.3.1).
- An earlier WebKit run on the commit before reported "ResizeObserver loop completed with undelivered
  notifications" on the thread page while the panel's wide form changed the composer's width: the fit
  decided its level inside the observer's callback. It now decides it in the next frame (`b14f445`), as
  the panel does; the thread checks then passed twice in WebKit and the full runs above are on that fix.
- Measured by `checks/fitting.mjs` (English, plain DOM, a dock with its state line): Claude Code's dock
  folds at 320 and 390 px and keeps every word from 768 to 2560 px, 129 px tall; a running Codex turn's
  folds at 320 and 390 px and shows its chips by their value from 768 to 2560 px. Spanish (React 19): a
  running Codex turn folds at 1024 and 1440 px beside the panel and shows its chips at 1280 px (the panel a
  sheet) and from 1920 px; the review measured 172 to 189 px docks wrapping on two or three rows at
  every width from 768 px.
- `checks/thread.mjs`: the panel at most 40rem beside the thread, and the wide form reaching the region's
  far edge at 1440, 1920 and 2560 px in both themes, the thread at its tier where the region holds it.

## Not established

- Screen reader output (the spoken prefixes and names are asserted in the DOM), touch devices beyond
  Playwright's emulation, Safari itself (WebKit is its engine), and adoption by Conduict: the package is
  vendored by the fix agents in their own round.
- The family reference is not synchronized here: `Diff`, the one-row composer, the drop surface and the
  wide panel are product-visible changes Conduict adopts; the proposals behind them (one toolbar row, a
  drop over the work surface, landing below sticky lines) are the review's, recorded as proposals, not
  approved family rules. Synchronization belongs to the adoption.
