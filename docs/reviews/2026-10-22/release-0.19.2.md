# Local UI 0.19.2: informational sheet dismissal

Source: `feature/next` at `19c2531` plus uncommitted changes, 2026-10-22. No publication or hosted acceptance.

`SideSheet` gains optional `backdrop: true` in DOM and React. Default false preserves task sheets.
A primary pointer gesture must start and end outside the sheet. Padding, child input, drags across
the boundary and cancelled gestures do not dismiss. `Backdrop` owns only the sheet's listeners and
releases them on destroy; opening/closing clears gesture state. Dismissal uses the existing close
lifecycle, including busy guards, focus restoration, scroll unlocking and animation. Dialog and
Session are unchanged.

Validation executed locally:

- `npm test`: 687 tests passed, including the informational-sheet regression and Session suites.
- `npm run types`: passed.
- `node acceptance/run.mjs 'sheet: informational'`, also with `BEYOND_UI_BROWSER=firefox` and
  `BEYOND_UI_BROWSER=webkit`: 3/3 installed consumers per engine (DOM, React 19.3.0, React 18.3.1),
  each in both themes, mouse and emulated touch, normal/reduced motion. Covers padding, both drag
  directions, busy guards, one close notification, focus, repeated opening and scroll restoration.
- Existing `choose: side sheet` checks passed in all three engines (4 checks per engine), including
  task backdrop refusal, keyboard focus, 320/390 px, and busy behavior. Initial broader runs failed
  only the new test's attempt to use Playwright's normal click on an aria-disabled Close; the test
  now deliberately forces that press. Corrected informational checks passed independently.

Packed with `npm run pack:consumers`, then installed locally by Conduict's frontend and the family
reference. Archive integrity:
`sha512-FhK4IqP37vm586I4SuGtjFF7um+SbymlN426pm+gl0NgCzaShscZwmt2JOZi+drwGIbeiwfH8awpHa2nctIJ9Q==`.
Other products retain their existing dependency versions and policies.

Family reference synchronization: **synchronized**, reference 0.39.1, tokens 0.6.0. The canonical
experience specification is Beyond Suite's `branding/docs/drawers.md`; its dated record is
`branding/docs/reviews/2026-10-22/drawer-dismissal.md`. The scoped machine information panel adopts
the option, the catalog documents it, and M705/M981 and `conduict-machine` are rechecked. This is
no blanket approval for other drawers and never changes Session's non-dismissible contract.

## Pending native exit and global default

The owner’s later direction on 2026-10-22 requires global SideSheet outside dismissal, including
Add repository, while preserving explicit meaningful dirty/busy safeguards and mandatory Session.
The installed archive above is the earlier behavior; no new version/archive/lock is written here.

Current DOM/React source defaults `backdrop` to true, with synchronous `guard(reason)` for
backdrop/escape/close. Exact true permits dismissal; otherwise the consumer explains or confirms
and calls `close(value)` after approved discard. React reads the latest guard without remounting.
SideSheet uses the unchanged `Motion` helper and keeps the native modal/backdrop through exit before
focus restoration, scroll cleanup, callback and promise settlement. Reversal starts from the painted
transform/opacity, with the same opening promise. Reduced motion is immediate; missing completion
has the helper’s 400 ms bound. Generic Dialog changes are independently owned.

Thirteen targeted tests pass in `sheet.test.mjs`, `sheet-motion.test.mjs` and
`react-sheet-motion.test.mjs` (under one second locally). They prove lifecycle contracts, guards and
React updates, not rendered animation. The product frame test’s build was cancelled before browser
launch after the owner required serialized heavy validation. Package integration and rendered
motion in Chrome/Firefox/WebKit remain pending with the shared-package coordinator.

Family synchronization is **blocked** on the coordinated archive and browser/consumer evidence for
SideSheet, Conduict M705/M981 and the machine journey. Beyond Suite’s `branding/docs/drawers.md`,
`docs/status.md` and `methodology/pendings/ui-informational-drawer-dismissal.md` record current scope
and obligations. Earlier first-round passes above do not close these gates.
