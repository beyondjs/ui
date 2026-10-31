# Local UI 0.46.0: framed choices

Evidence baseline: UI `ce16336` (0.45.1) on `feature/next` plus this change, made on 2026-10-31 on the branch `claude/permissions-20261031` for the suite's request `family-ai-app-permissions-20261031`.

## Why

Beyond Accounts' consent for an AI app's permissions asks a person to choose several permissions, each with a title, one sentence on what it gives and a short state ("Read only", "Can incur costs"). Its design draws them as framed rows: one bordered box with divided rows, the chosen row on the selection's surface and the whole row its checkbox's target. `Choices` drew a plain list, with an option's state inline after its label, and a product may not restyle a shared component. The form is generic: any product that asks a person to choose several described options with a consequence draws it the same way.

## What changed

- **`Choices`' `framed`** (a DOM option, a React prop; false by default). The options are one framed box of rows, drawn as `ul.bui-rows[data-framed]`: the border and the dividers in `--color-border-strong`, the dividers on the rows' inset, `--radius-base`, the surface behind the rows.
  - **A row:** the checkbox or radio first, then the option's `label` as the row's title (body size, weight 500, the text's colour), centred on the control, with the `hint` or a disabled option's `reason` under it, muted and small at the reading measure.
  - **The tag:** the option's `status` (`[label, tone]`) is a tag at the row's end, `Status`' badge (its mark and its words in a pill). On a row narrower than 30rem it goes under the hint, as a list row's end does. The badge now draws `warning` and `danger` in their tones' surfaces, as `attention` and `failure`.
  - **The whole row is the control's:** the title is a label whose target covers the row, with nothing interactive nested, so a press on the hint or the tag toggles the control. The pointer's row is lifted (`--overlay-lift`); a press darkens it and moves nothing.
  - **The chosen row** sits on `--color-surface-selected`, drawn from the input's own `checked` (`:has(> input:checked)`), so a form's reset or a product's own change of the input stays right.
  - **A disabled option** stays visible with its reason and never toggles.
  - **Described:** the control is described by its hint and its tag (`aria-describedby`); the title alone names it.
  - **Focus (D187):** the control the keyboard reaches takes the family's ring; the row draws none. Nothing animates.
  - **One inset (D184):** `--bui-choices-inset`, 16 px, named on the group. The control's edges hold the top and the start, the tag's edge the end; a hint that ends the row takes off its own half-leading below its baseline, and the hint's line height is the small text's.
- **Hints as content:** a hint or a reason may be a node in the DOM, in both forms (a string draws the same text node as before). In React, `ReactChoiceOption` declares `label`, `hint` and `reason` as React content, which the adapter already rendered.
- **Unchanged:** an unframed group keeps its markup. Its DOM output was compared with 0.45.1's for a checkbox group with a hint, a state, a disabled option and an error, a required radio group and a stated radio: identical. A radio group with one option is still stated, framed or not.
- **Not needed:** the legend is not a heading, so `Hierarchy` never checks it and it takes no `data-bui-label`. No new words: the copy is the product's.

## Executed checks

Through the machine's test queue, on 2026-10-31, from the worktree of `claude/permissions-20261031`.

RESULTS

## Limits

- **Package evidence only.** No product vendors 0.46.0 yet. The tarball is copied into the Accounts worktree of the same request for its executor to adopt; Accounts' own tests and its reference synchronization belong to that adoption.
- **Not published.** The package is a local release, vendored as a tarball.

## Family reference synchronization

No reference impact from the package alone: no product draws framed choices yet, and the family reference models products. The surface that adopts it (Accounts' AI app permissions, in the same request) carries its own synchronization.
