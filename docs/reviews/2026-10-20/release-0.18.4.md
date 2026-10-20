# One progress mark that reads as a mark in UI 0.18.4

## Change

The owner's review of Conduict's Live card found a step that read "Machine c In progress". The "c" was `status()`'s progress mark: a 9 px open ring missing its inline-end quarter. Beside words, at text size, it read as a letter. It also gave the step a second mark, since the step's own mark already said "in progress" by its shape.

- **Work in progress is a half-filled circle.** `Status` (`busy`, `running`, `waking`) and `status(label, 'progress')` draw a 1.5 px ring with its inline-start half filled, in the info hue. It is one of the shapes D129 names, and it differs from the hollow circle of what rests and the filled circle of what is done. It pulses a few seconds as before.
- **A step says its state in words beside its one mark.** `Steps` writes "In progress", "Blocked" and "Failed" beside the step's name as plain words (`bui-step-state`): muted, or in the warning or danger hue. It draws no status mark of its own. "Done" and "Waiting" stay hidden words for assistive technology.

No public API or token change: the class names, options and labels are unchanged, and `bui-step-state` is the one new class. The archive is `dist-pack/beyond-ui-0.18.4.tgz`, integrity `sha512-4VpktzlFieNHol07bf/Py1JCqSKqnb1hsbqvfalhfIy7bmZM1NBOONmeLwpDlTNvlABtYncEZopHf7j5HvX9RA==`.

## Executed local evidence

- `npm test`: 675 tests passed, including `status.test.mjs`, which holds the half-filled circle in the built stylesheet, and `operations.test.mjs`, which holds a step's state as words with no status mark inside `Steps`.
- `npm run acceptance -- 'awaited card'`: the six checks of the awaited card and its steps passed against the packed DOM, React 19 and React 18 consumers in Chrome 155, Firefox and WebKit. `npm run acceptance -- composer` passed 25 checks in Chrome, including the conversation plan drawn with `Steps`.
- A rendered comparison of the old and new progress marks beside every other state's shape, and of a step list in each state, confirmed the half-filled circle reads as a mark, not a letter.

These are isolated fixtures, not hosted services or product acceptance. Every product and the family reference vendor 0.18.4 since 2026-10-20 and record their own adoption.
