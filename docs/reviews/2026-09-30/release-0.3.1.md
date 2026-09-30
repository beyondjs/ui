# Release 0.3.1 — 30 September 2026

A correction release of `@beyond-js/ui` over 0.3.0. The token set is unchanged (0.2.0). It is vendored as `tools/beyond-ui-0.3.1.tgz` in each consumer; nothing is published.

| Change | Commit | Found by |
| --- | --- | --- |
| An empty `Collection` shows no range: the pager rendered "1–0 of 0" beside the empty state, which already says why | `403d747` | The family navigation audit (suite `docs/reviews/2026-09-30/family-navigation-remediation.md`, FAM-NAV-06): Delegate's list for a person without projects, the Desktop and Conduict lists |
| `Preferences.apply()` keeps a choice made in a product until the account's values change: the device copy remembers the account values it last applied (`account: {appearance, locale}`), and the account overrides the device choice only on a first arrival or after the person changed them at Accounts | `0abd8dd` | The decisions round (D07); `docs/reviews/2026-09-29/release-0.3.0.md` |

Consumers need no source change. Their tests that read the device copy or assumed the account's values win on every arrival did change: the copy is `{appearance, locale, account}`, and a reload with the account's values unchanged keeps the choice made in the product. The re-vendor commits of 2026-09-30 adjusted those tests in every consumer (accounts `5055f56`, projects `a7e51cb`, delegate `0e8d646`, workspace-2026 `38dba62`, cdn-v2 `f1c3dcc`, snapshots `f8bb56d`, desktop `c2770e7`); branding and Conduict vendor it in their own commits.

## Checks

| Check | Result |
| --- | --- |
| `npm test` | 155 of 155 |
| `npm run acceptance` | 104 of 104 in Chrome (the default), Firefox and WebKit (`BEYOND_UI_BROWSER=firefox`, `webkit`) |
| The new `collection.test.mjs` assertion on the base code | fails with `'1–0 of 0' !== ''`, as expected |
