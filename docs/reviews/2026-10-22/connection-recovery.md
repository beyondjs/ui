# Connection recovery source evidence

2026-10-22. Isolated patch against UI `19c25312bc81c32431392f67c5486da4872059ee` with existing uncommitted work preserved in the base. Not applied to the shared checkout, packed, installed or browser accepted.

The patch adds `RetryAction` and `Recovery`, adopts the action in DOM/React `Unavailable` and notifications, and aligns TechnicalDetails' surface and technical text widths. Source inspection found `.bui-details-body` uncapped while `.bui-details-text` alone inherited the reading measure from the final prose stylesheet. It also found the notification panel's retry icon absent in the inbox's unavailable path and both default `Unavailable` actions.

Focused isolated results: Recovery/React activation passed 8/8; Again/notifications passed 18/18; selected TechnicalDetails DOM/React behavior passed 3/3. Focused declaration checking passed. Coverage includes stable keyed disclosures, focus after partial/final recovery, shared-callback deduplication and stale copy feedback. The geometry check is registered in the acceptance runner but unexecuted. No browser, full suite, build or consumer installation ran.

Family synchronization is blocked on authorized integration, coordinated package distribution, product adoption and the root-scheduled rendered checks. The maintained recovery guide defines the intended behavior; it is not evidence of installed adoption or owner acceptance. The family reference's `conduict-reconnect` journey and CON-06 require the consolidated update.

## StrictMode recovery correction

Source review identified `useBusy` leaving its mounted flag false after React StrictMode's setup/cleanup/setup replay. The isolated React 19.3.0 regression reproduced a failed retry leaving `aria-disabled=true`; a second regression reproduced a retained callback starting new work after its hook unmounted. Both failed against the earlier candidate.

The hook now marks itself active in each effect setup and refuses new work after cleanup. It retains single-flight state during effect replay; existing work still settles and rethrows to its caller, but cannot update an unmounted component. Four directed React tests pass: existing duplicate activation, two consecutive rejected retries with busy returning to idle and latest props/focus retained, old hook settlement/retained calls after remount, and a rejected RetryAction after unmount with its replacement usable. The existing FocusedForm busy/duplicate-submission check also passes. These are isolated DOM tests, not consumer or browser acceptance. React 18 is not exercised by this correction.
