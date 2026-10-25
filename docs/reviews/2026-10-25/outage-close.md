# The outage said once, closed in UI (round outage-close, 2026-10-25)

Evidence baseline: UI `7568947` (0.32.1) on `feature/next`, changed in a worktree for the suite's round `outage-close`. It is released as 0.33.0 ([the release record](release-0.33.0.md)). Implementation is not the owner's acceptance.

## What the round was asked

The suite's pendings named three shared pieces that still said an outage their own way (`ui-recovery-shared-gaps`). Beyond Home's pending asked whether `Session` can name who did not answer (`desktop-outage-followups`, item 1). Session beyond-suite-ba handed over the offline line. The owner's direction of 2026-10-25 (D186) set the tone of a change's outage.

## Claims checked against 0.32.1 before changing anything

These were read in the source, not run.

| Claim of 2026-10-23 | At 0.32.1 |
| --- | --- |
| `NotificationInbox` says its outage in a callout with a line and a Try again of its own | Held: a warning callout, "Notifications are unavailable: Beyond Projects did not answer.", with the `AgainLine` and its own `RetryAction` |
| `EmptyState`'s outage is a block, so a cell cannot hold it | Held: a `div` grid; Projects keeps `.cell-outage` |
| `Picker` cannot join a page's `Recovery` | Held: a failure was always its own words and Try again |
| `Session`'s dialog says "Beyond Accounts is not answering" whatever did not answer | Held: `words.unavailable` was fixed, and `Reader` dropped what failed |
| Shared components draw a change's outcome | `FocusedForm` and `confirm`/`prompt` drew every `explain` in the danger tone as an alert; the question's container was itself `role="alert"`. `ProviderWindow`'s unknown completion was already warning. The inbox's "That change could not be saved. Try again." (Mark all as read) is a status line with no tone and was left as it is. |

## What changed

The change is described in [the release record](release-0.33.0.md) and [connection recovery](../../recovery.md). In short:

- The inbox's outage is `Recovery`'s page form, with its read in Technical details.
- `EmptyState` has an `inline` place for a cell.
- `Picker` joins a notice with `recovery`, `outage` and `details`.
- A line names no product offline, with no Try again, once for the page.
- `ChangeOutcome` says a change's outage in the warning tone, and `explain` may return it or `{ text, tone }`.
- `Session` names who did not answer from `source`.

## For Beyond Home (the pending's item 1)

The fix belongs in UI and is in 0.33.0. Home's `DesktopSession.#read()` throws `new Error(answer.reason ?? 'Beyond Projects did not answer')` when Projects does not answer. To have the dialog say "Beyond Projects did not answer", Home passes `source: 'projects'` to `new Session({ … })`, or throws an error that carries `source: 'projects'`. A Projects answer that names Accounts as the cause can resolve `{ state: 'unavailable', source: 'accounts' }`. When the hidden renewal frame fails, the dialog names Beyond Accounts, which that frame reaches. Whether the tolerance band joins the page's line stays Home's decision, under D63.

## Not done here

- The products' adoption: Projects dropping `.cell-outage` and its picker's own words, Home passing `source`, and every product's change outcomes. Each product does it in its own repository.
- Screen-reader output and hosted behavior.
