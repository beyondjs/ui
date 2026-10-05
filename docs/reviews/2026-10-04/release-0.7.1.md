# Release 0.7.1 — 4 October 2026

A patch release of `@beyond-js/ui` over [0.7.0](release-0.7.0.md), asked for by the suite's coordinating session after the first adoptions; every change is additive. The token set is unchanged (0.3.0). Nothing is published; consumers vendor the tarball.

## What changed

| Request | Change | Where |
| --- | --- | --- |
| A statement drops the option's hint: Conduict had to pass `statement: false` for a lone AI engine whose hint carries the engine's state | A stated option keeps everything it said: its `hint` (or `detail`, `description`) on its own line, describing the statement through `aria-describedby`, and its `status` (`[label, tone]`). `Choices` options take `status`, also drawn beside each option's label in a group; `Select` options may carry `hint` and `status`, shown only when stated; `ChoiceMenu`'s statement keeps its `detail` | `src/dom/core/statement.js`, `choices.js`, `select.js`, `choice/face.js`, `src/react/fields.js` |
| Phase 2 Spanish labels (the review's section 11) | `Dialog.labels`, `Question.labels` (also on `confirm`, `prompt` and `alert`; a prompt's field takes "(opcional)" and "Revisa este valor." from them), `Unavailable.labels` and `Toaster.labels`, each `{ en, es }`; React: `Dialog.labels`, `useConfirm.labels`, `Unavailable.labels`, `useToaster.labels` | `src/dom/dialog.js`, `questions.js`, `unavailable.js`, `toaster.js`, the React adapter |
| A one-line `Awaited` for rows (design S5: "Cloning · 40 s so far · usually about 1 min") | `AwaitedLine` (DOM and React): the time so far and the usual time, "Taking longer than usual" strictly past the 90th percentile with Check again (single flight), a reason in place of the time, "Done · took …" or "Did not finish" once; announcements as `Awaited`'s; no guess without an expected time; English and Spanish | `src/dom/operations/line.js`, `src/react/operations.js`, `src/styles/rows.css` |

## Checks

| Check | Result |
| --- | --- |
| `npm test` (new `followup.test.mjs`; `react-choose.test.mjs` also on React 18.3.1) | 285 of 285 |
| `npm run types` | No diagnostics |
| `npm run acceptance` in Chrome 154 (a new `choose:` check: a statement's hint on its own line and a one-line wait inside the page at 320 and 1440 px in both themes) | 161 of 161, on the released content |
| `BEYOND_UI_BROWSER=firefox npm run acceptance`, Firefox 155 | 161 of 161, before only the documentation changed |
| `BEYOND_UI_BROWSER=webkit npm run acceptance`, WebKit 26.6 | 161 of 161, before only the documentation changed |

Tarball: `beyond-ui-0.7.1.tgz`, `sha512-0yhmh2zziR4CVde3ncQjahHxBGtGJO4xc+HJSbtmYNHUdOw/ELIT/CkZuw4FJ0S6uG/Wi28t9/kJ4TMGDim1JA==`.

Not established: a screen reader's reading of a statement's description and of the line's announcements; product adoption.

## What stays open

- Products adopt in their own assignments (the coordinating session batches the vendoring). Conduict can drop `statement: false` for its lone AI engine.
- Spanish for the components that still carry English only (`Header`, `FamilyBar`'s fallback words are product-given; `FocusedForm`'s failure line).

## Family reference synchronization

Synchronized in the suite's family reference: the vendored tarball and the component catalog (`AwaitedLine`, and the revised statements and Spanish copy), recorded with the suite commit of this release.
