# Local UI 0.45.1: Tab kept inside a dialog in WebKit

Evidence baseline: UI `5adb264` (0.45.0) on `feature/next` plus this change, made on 2026-10-29. It resolves the package's part of the suite's pending `ui-dialog-webkit-tab-cycle`, found by Projects' Add repositories dialog in the organization catalog round.

## Why

A modal dialog keeps keyboard focus inside it until it ends. Until this release, `Dialog` answered Tab with `Focus.wrap`, which moves the focus only when it is on the first or last target, or outside the dialog. Elsewhere it left the move to the browser. WebKit's own Tab skips buttons, checkboxes and links unless the system's full keyboard access is on, as Safari's does. So from a field or a summary followed by such a target, WebKit's Tab found nothing more inside the dialog and left it for the page behind. The side sheet and the menus already moved the focus themselves (`Focus.cycle`, since 0.20.4).

The earlier browser check pressed Tab six times and only read where the focus ended. On the dialog fixture the sixth press landed on the field again, so the check passed in WebKit by chance.

## What changed

- **`Dialog`** answers every Tab and Shift+Tab with `Focus.cycle`, as `SideSheet` does. The focus goes to the next or previous target in document order and wraps. Every target counts: a button, a checkbox, a link, a disclosure's summary or a field.
- **`Focus.cycle`** treats a named radio group as one stop, its checked radio or else its first, as the browser's own Tab does. It now brings the target into view inside a scrolling body (`scrollIntoView` with `nearest`), as the browser's own Tab does; the focus itself still asks for no scroll. This also applies to `SideSheet`.
- **`Focus.wrap`** is removed. Nothing used it any more, and `Focus` is internal.
- **Tests:**
  - A unit test steps Tab and Shift+Tab through a field, a checkbox, a radio group, a link, a summary and an action, and requires every press to be answered by the dialog.
  - The browser check presses plain Tab two rounds. It requires every stop inside the dialog, each target once a round, and Shift+Tab one back.
- **Documentation:** README, AGENTS.md, the catalog (`Dialog`) and validation.

## Executed checks

Through the machine's test queue, on 2026-10-29.

- **The new browser check, before and after, in WebKit 26.6:**
  - **On 0.45.0** (Projects' vendored `beyond-ui-0.45.0.tgz`): it failed in the DOM, React 19 and React 18 consumers. The stops were outside, the dialog, the field, outside, and so on: the third Tab left the dialog.
  - **On this change** (packed from the working tree): it passed 3 of 3.
- **Unit:** `tests/dialog.test.mjs`, `tests/focusing.test.mjs` and the sheet tests passed 30 of 30. The whole suite and `npm run types` are recorded below.

## Limits

- **Package evidence only.** Products take 0.45.1 with their next vendoring. Projects' `adding.mjs` in WebKit is the suite pending's other half.
- **Not changed:** native Tab outside modal parts. A page's own Tab order in Safari keeps the system's setting.

## Family reference synchronization

There is no reference impact beyond the package version. In WebKit, Tab inside a dialog now reaches its buttons and stays inside, as it already did in Chrome and Firefox. The reference takes the version with its next vendoring.
