# Release 0.12.0 — 9 October 2026

The owner compared Conduict's conversation page with Claude Code's own conversation view and asked for every improvement found to be implemented (Conduict's record `docs/reviews/2026-10-09/conversation-screen.md`). Two of them belong in the shared package: a turn's events read as one sequence on a line of marks, each colored by its state, and an opened command's input and output in one box. 0.12.0 adds them as generic pieces; the product keeps its words, kinds and arrangement.

## What changes

| Part | 0.12.0 |
| --- | --- |
| `Rail` (new) | One line down a column of marks. It adopts a product's container (`element`) or makes one, and is a named group only with `label`. `ActivityRow` and `ActivityGroup` sit on it unchanged |
| `RailItem` (new) | Any other event on the rail: the kind's glyph, a dot without one or a spinner while `progress`, colored by `tone`, with the product's content beside it; `update()` keeps focus inside the content |
| `RailMoment` (new) | A time of day at the line's far end, with its whole moment in `datetime` and `title` |
| `ActivityExchange` (new) | `{ exchange: [{ label, text }, …] }` in an opened row: one box, each part a row with its label beside its text and its own fold and Copy; a part without text is left out |
| `ActivityRow` marks | Colored by state beside its words: `running` info, `waiting` and `denied` warning (`failed` was already danger) |
| React | `Rail`, `RailItem` (driven by the DOM class, children through a portal) and `RailMoment` |

No token changes: the token set stays 0.4.1. No copy is added (the rail's words are the product's), so `tests/spanish.test.mjs` is unchanged.

## Choices and deviations

- **The line runs through the row's own mark.** The rail's line sits at the center of `ActivityRow`'s 18 px mark (`--space-2` + 9 px), and `RailItem` mirrors the row head's geometry, so rows need no option to join a rail and a product can mix rows and items in its own container.
- **Marks mask the line.** A mark takes the rail's surface (`--bui-rail-surface`, the canvas by default), so the line passes behind it; a hovered row's mark takes the hover surface. A product whose rail sits on another surface sets the custom property.
- **Color never alone.** Every mark is `aria-hidden`; a row says its state in words and an item's content says what happened. A done row stays quiet (muted), so a long turn does not turn green.
- **A time is the product's.** `RailMoment` draws what it is given; when to say a time (Conduict: two minutes or more since the event above) is the product's rule.

## Verification

| Check | Result |
| --- | --- |
| `npm test` (unit, happy-dom) | Passing, with `rail.test.mjs` (5) and `react-rail.test.mjs` (1) |
| `npm run types` | Passing, with `rail.ts` and `rail.tsx` (one expected error: an unknown tone) |
| `npm run acceptance` | 259 of 259 checks in Chrome 154, Firefox 155 and WebKit 26.6, each engine run whole on the packed 0.12.0; among them `railing.mjs`: every mark on the line within 1.5 px in both themes for the DOM and React 19 consumers, the colors of a failure and a wait, the exchange's labels beside their text, no sideways scroll at 320 px |

Not established: the rail on a touch device, and in a product other than Conduict.
