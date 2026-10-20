# Notification outage recovery in UI 0.18.3

## Change

The open notification panel and full inbox distinguish an unavailable relay from missing setup or access. `projects_unavailable`, `accounts_unavailable` and a legacy unavailable answer without a reason use warning feedback, `Again` and its localized last-attempt line. Missing configuration, a non-platform session or rejected access retain their cause without automatic retries. Manual recovery stays available. Closing or destroying stops retry work and clears notification text; recovery removes its warning. The entry refreshes its unread count after an automatic read.

No public API or token change; both DOM and React consumers receive the behavior through the existing components. The archive is `dist-pack/beyond-ui-0.18.3.tgz`, integrity `sha512-KKAF7wrBdQD73TvnmRDt+ijIt9JdRpEuzmFKfFtNOG/svMsuU6kjOphL+kmh6Jb0N4L3hvMWxHu2eOCY/jj/+A==`.

## Executed local evidence

- `npm test`: 675 tests passed, including React 18 compatibility. `npm run types` passed.
- Notification-focused unit run: 24 tests passed, including automatic recovery, Spanish last-attempt copy and setup/access causes.
- `npm run acceptance -- 'notification outages warn'`: two packed-consumer checks passed in Chrome155, Firefox155 and WebKit26.6. Each uses the installed DOM and React19 package, controls the clock, checks warning/manual recovery, observes automatic recovery and confirms private text is removed on close.

These are isolated fixtures, not hosted services or product acceptance. The family reference and products record their own adoption.
