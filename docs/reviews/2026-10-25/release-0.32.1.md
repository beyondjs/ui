# Local UI 0.32.1: the review's corrections to the family's waits

Evidence baseline: UI `0e0a2d9` (0.32.0) on `feature/next` plus this change, made in a worktree on 2026-10-25 for the suite's round `settled`. Token set 0.7.0 is unchanged. Implementation is not the owner's acceptance.

## Why

0.32.0 gave every product one way to wait for what is still to give (D183): `Required`, `Quiet`, React's `Form` and a `Button`'s `waiting`. Before the products' branches were integrated, an independent review read the package's change and each product's use of it. It found the waits wrong in ways a person would feel:
- a form submitting while something waited;
- a product's own quiet state undone;
- text a number field cannot read sent as empty, so Delegate would have recorded a tariff price of 0;
- a press landing on a chosen item's Remove.

No rule changes; 0.32.1 makes the waits do what 0.32.0 says.

## What changed

- **A form with fields waits for its marked parts too.** `Required` with `fields` ignored the parts marked `data-missing`, so a `FocusedForm` with a filled title and a `Picker` still to choose submitted. It now reads both, in the page's order.
- **The form quiets and frees only what it quieted.** `Required` took over `aria-disabled` on every submit button and removed it from a button a product kept quiet itself, as Conduict's domain and outbound-host forms on `feature/next` do. It now keeps the buttons it quieted and frees only those. `FocusedForm`'s busy marking frees only what its work quieted, and `destroy()` leaves the rest as it was.
- **The form's controls are the browser's.** A required control outside the form that names it with `form`, such as a box in a dialog's footer, was no longer waited for, where 0.31.1's `checkValidity()` had waited for it. `Required` now reads the form's controls as the browser lists them: one inside the form that names another form is left out, and it hears a change from a control that names the form.
- **Text the browser could not read is never sent.** Letters typed into a number field, or a date typed half, read as an empty value, so a product could not see them, and `Required` let the submission through. `hold(event)` now stops it, whichever comes first, with the browser's own message (`reportValidity()`). `unread` is the first such control, `wrong` the first that fails its own constraints and `Required.before(a, b)` the page's order.
- **What changes without an event is read again.**
  - A value written by `Field` (a suggestion offered, followed or taken back) or by React's `Field` and `useSuggestion` tells the form with `Required.change`, a bubbling `bui-change` sent by `Required.tell(node)`.
  - `SecretField` tells its form that way too, never with an `input` event a product would read as typed.
  - `Required` reads the form again in the next frame after its structure changes: a field swapped for a choice by a React child, a control required or disabled, a part marked.
- **The caret goes where the step is taken.**
  - A marked part's control that says so (`data-bui-caret`) takes it; a `Picker`'s search carries it. With one request chosen, Delegate's batch picker had put the caret on that request's Remove, and a following Enter removed it.
  - A disabled control never takes it.
- **A link that waits does not navigate,** nor a busy one, in DOM and React.
- **Spaces in a password or a secret are characters,** so a password of spaces is no longer read as nothing.
- **A choice is the browser's to read.** A required choice whose chosen option has an empty value but is not its placeholder is a choice.
- **`Quiet` hears a press from its control's own root,** so it works in a closed shadow root too.
- **React keeps what was written.** A new `labels` object with the same words no longer rebuilds `SecretField`, and a change of the composer's `attach.words` keeps the box and its draft. `words` may be a function, read at each draw.
- **The Sidebar tells its change once both of its changes are drawn,** and a page's panel tells its change when it is destroyed.

## Executed checks

- **Unit suite:** `npm test`, 881 of 881. New: `waits.test.mjs` (9). Updated: `react-form.test.mjs` (5), `missing.test.mjs` (a secret's spaces) and `relayout.test.mjs`. `sources.test.mjs` holds every file at 300 lines or fewer.
- **Declarations:** `npm run types` compiles. It adds `Required.change`, `tell`, `before`, `wrong`, `unread`, a field's `element`, and `attach.words` as a function.
- **Browser acceptance:** `npm run acceptance`, 400 of 400 in each of Chrome 155.0.8059.85, Firefox 155.0 and WebKit 26.6, installed from the packed 0.32.1 archive below into the `dom`, `react19` and `react18` consumers. New:
  - **`missing.mjs`'s real-engine check** (`dom`) covers:
    - a choice of an empty value that is not the placeholder;
    - a footer box that names the form, heard from outside it;
    - letters in a number, never sent;
    - a link that waits;
    - a closed shadow root's quiet control.

    It fails on 0.32.0's archive.
  - **`insets.mjs`** now also fails a box in which anything scrolls by what an inset trimmed. Snapshots' review found its file viewer clipping its last line that way; the package's own boxes pass.

## Limits

This is package evidence only. Each product vendors 0.32.1 in its own repository in the same round, with the fixes its own review found (each product's record of 2026-10-24). Nothing here is screen-reader output or hosted behavior.

## Family reference synchronization

The family reference (Beyond Suite's `branding/`) vendors 0.32.1 in its round `settled`. No rule changes, so its register's D183 note records the corrections.

## Artifact

- Archive: `dist-pack/beyond-ui-0.32.1.tgz`, packed by `npm run pack:consumers` from the release commit with no consumer named.
- SHA-256: `4d42681b8039d9ca33d3cd08961a9a34812f4fd763e4f99e4af42d2d8f67da14`.
- Integrity: `sha512-/JZJQeyfBjRLC0LeAcv5WLib2vxThIr4M2C1H3j/qavZcMxGI6E4Ct6mnx9EZSYYXC7v9R1XZyrOfeIA2Er0sg==`, byte for byte the archive the browser acceptance installed and the products vendor.
