# Local UI 0.35.0: where a press puts the person, a focus asked for while covered, and one inset in the boxes no fixture drew

Evidence baseline: UI `b397dc4` (0.34.0) on `feature/next` plus this branch (`claude/settled-close-20261025`), made in a worktree on 2026-10-25 for the suite's round `landed` on 0.32.1 and rebased onto 0.33.0 and then 0.34.0, keeping both sides. The commits made before another session took 0.34.0 still name it in their subjects; what they carry is released as 0.35.0. Token set 0.8.0 is unchanged by this release. Implementation is not the owner's acceptance. [The round's record](landed-pendings.md) says what changed by pending, with the decisions and what each finding measured.

## Why

The round `settled` (0.32.0, 0.32.1) left the package pendings that its products found while adopting it: a choice that waits for an earlier one could only be natively disabled, out of reach; a press on a held Send went nowhere; a focus a product asked for while the opening covered it was lost; React's `Form` had no way to say the browser's own message for a wrong value; and several boxes had never been drawn by a fixture, so D184's one inset was not measured there, nor at compact density or on a touch screen. Adopting the candidates, Beyond Home found a command's `CopyMessage` holder drawn in the code's face, Conduict needed its start branch chip (a `RefChooser`) to wait, and the Packages interface found a `Button`'s own wait freed by its form and a React `DataTable` cell that rendered nothing kept in the narrow line.

## What changed

- **A choice that waits (D183).** `ChoiceMenu`, `ChoiceChip` and `RefChooser` take `waiting` and `place` (DOM options and setters, React props): quiet (`aria-disabled`) and reachable, a press (a click, Enter or Space, ArrowDown or ArrowUp) opening nothing and only putting the person at `place()`. A composer's held Send takes `disabled.place`, its other ways to send quiet with it and its reason said once beside it; an `ActionMenu` item takes `waiting`.
- **A button's own wait.** A package `Button` and a choice mark their own `waiting` with `data-bui-waiting` (DOM and React), and React's busy link says `data-busy` as the DOM's does; `Required` and `Quiet` never free a control that carries either (`Required.held`) and read it again when either ends, a named button outside the form included.
- **The browser's own message.** React's `Form` takes `report` (off by default): a wrong value that comes first says the browser's message and takes the focus, and `onSubmit` does not run (`Required.report`).
- **The opening.** A focus a product asks for while the opening covers it lands when it shows (`OpeningFocus`), never over a focus already in the product, and a focus that throws never keeps the cover. The document carries `data-bui-opened` once the opening no longer covers the product, the one public mark for tests and tools to wait for; without the opening's markup it is set before the product runs, so a test waits for the product's own content there.
- **What goes with a message.** `ComposerChip` (DOM and React) is a chip that acts, in the chips' geometry, its face its accessible name and its `description` read after it; the tray's chips say their whole face in the family tooltip.
- **Faces and empty cells.** A command's `CopyMessage` keeps its holder in the interface's face, its code box alone in the code's. One rule (`CellContent`) reads a `DataTable` cell's emptiness in the DOM and React (spaces and a childless span are nothing; a field or an image is content), so a React cell that renders nothing leaves the narrow line without its label and separator.
- **One inset (D184)** in an editable `CommandCard`'s field, in `Recovery`'s wide form when its words wrap beside Try again and in its offline line, in single-line controls at compact density and on a touch screen (`--bui-line-inset`), and in a touch screen's menus, an action menu's and every choice's, whose entries centre their words in their 44 px targets. A notification row on a touch screen is measured for the record until a design decision (`family-touch-notification-rows`).
- **One name for the compact search**, decided and documented: its button and its field name one thing in two states.

Two independent reviews read the candidates; every finding is corrected in this release (the round's record lists them): among them a named submit button outside its form now heard by `Required`, a choice's menu on a touch screen, the guarded hand-over, and one rule for a table cell's emptiness in the DOM and React.

## Executed checks

Every run went through the machine's test queue, one at a time and bounded.

- **Unit suite:** `node --test "tests/*.test.mjs"` after the build, 956 of 956 on the first archive's commit (`4b69b6a`) and 956 of 956 on the release archive's (`f344d33`). New: `own-wait.test.mjs`, `table-narrow.test.mjs` and `opening-arrived.test.mjs`, besides the suites the round's record names. Each new test of a review's finding fails with its fix taken out.
- **Declarations:** `npm run types` compiles on both commits.
- **Browser acceptance** from the packed archive (`BEYOND_UI_TARBALL`), in the `dom`, `react19` and `react18` consumers, the whole run, then the opening's checks (`acceptance/opening.mjs`, which reads the package's opening module from the tree at the archive's commit). Engines: Chrome 155.0.8059.85, Firefox 155.0 and WebKit 26.6.
  - **The first archive** (`4b69b6a`), Chrome: 426 of 430, and 28 of 28 opening checks. All four failures were one box: `Recovery`'s offline line in its wide form held its capitals 17.9 px from its top against 16 px, on a page whose body keeps the browser's 16 px and normal line height, in the comfortable (`dom`, `react19`), compact and touch checks. The words took off their half-leading by the page's metrics instead of the title's; `f344d33` gives them the title's size and line height there, measured again at 15.9 px. The archive was replaced before Firefox and WebKit ran.
  - **The release archive** (`f344d33`):
    - Chrome: 430 of 430, and 28 of 28 opening checks.
    - Firefox: 429 of 430, and 28 of 28 opening checks. The failure was the check's: with a coarse pointer it opened a tooltip by hovering, and Firefox's touch emulation never hovers, where the tooltip shows on focus or a press by design. The check now focuses what it points at on a touch screen (`b9eaa27`, acceptance only). Run again from the same archive, the three touch-screen inset checks passed 3 of 3 in Firefox and 3 of 3 in Chrome.
    - WebKit, with that check: 426 of 430, and 28 of 28 opening checks. The four failures were the pressing check's: WebKit's Tab skips buttons, as Safari's does, so "Tab reaches it" and the tray chip's keyboard steps failed. The check presses Option+Tab there (`4d2f5ec`, acceptance only), as the focus checks do. Run again from the same archive, the pressing checks passed 8 of 8 in WebKit.

  Neither check fix changes the archive: the acceptance is not packed.

## Limits

This is package evidence only. Each product vendors 0.35.0 in its own repository in the same round. Nothing here is screen-reader output or hosted behavior. The notification row's inset on a touch screen waits for a design decision.

## Family reference synchronization

The family reference (Beyond Suite's `branding/`) and the Docs Site quote the words above. Main records the synchronization in the suite.

## Artifact

- Archive: `dist-pack/beyond-ui-0.35.0.tgz`, packed by `npm run pack:consumers` from `f344d33`, with no consumer named. Every later commit changes only the acceptance and the guides, this record included, which the archive does not hold.
- SHA-256: `b159c143399374177af77b1241ad0de23fe1e52d3881930402ee3b9f2223f3d3`.
- Integrity: `sha512-gAMVepaMXaZJa/dw+lpC3JxSrW6RC9Azqsw3biDF3VHeD0Gdxiiu0NUZYwoEOk4V0V2BBW6FNb6MkSCUwMYsBA==`. This is byte for byte the archive the browser acceptance installed.
- Replaced: the first archive, from `4b69b6a` (SHA-256 `bfa4857dd7be011de608bddcca8038d5c03ad37522dc4da3d30076230c156083`, integrity `sha512-A2LzM8CdLBdkjTIkcDZFOxJxPVVQagp1ZThuMAMjXrHIDYnKM2HDRgEDc+bvJHyU+oTR4CsTNECd7eIoepMuDQ==`), which products began to vendor: vendor the release archive above.
