# Releases 0.9.0 to 0.9.2 — 7 October 2026

The owner amended the family rule D63 on 2026-10-07 (S27 in the family reference; Beyond Suite's
`docs/family/session-renewal.md`): **the session's dialog cannot be dismissed.**

## Why

Closing the expired dialog left a page without a session. In Conduict a page opened from there stayed
on "Loading the conversation…" for ever: its read came back `UNAUTHENTICATED`, `lost()` answered "do
not send again" because the page was in the `reading` state, and the view kept quiet because it
assumed the dialog was speaking, which the person had closed. Meanwhile a product's own "Live updates
paused" banner contradicted the dialog. A signed-in product holds nothing a person can use without a
session, so the dismissed state bought nothing and gave every page of every product a state to get
right.

## What changes

| Part | 0.9.0 |
| --- | --- |
| `SessionNotice` | Every kind is built with `escape: false`: no ×, Escape nor press outside (`closedby="none"`). A suspended account is also offered "Use another account" (`other`). The unavailable dialog says "This page tries again by itself". The `close` label is gone |
| `Session` | The states are `signed`, `renewing`, `asking` and `ended`; `reading`, `open()` and the `bar` option are gone, with `Guard`. A request made while the dialog asks is held and sent by its replay class once renewed. `check()` resolves with the state after looking, so a live transport speaks only while `signed` |
| `delegate` (the Desktop) | `false` means the window is closing: the session ends with nothing shown and nothing held is sent. A rejection (the host did not answer), or a yes the product's read does not confirm, is asked again by itself after 5, 15, 30 and then every 60 s |
| `FamilyBar` | `signin` is gone (DOM setter, React prop, label and style) |
| React | `useSession` returns `{ session }` |

Consumers drop `bar`, `signin`, `open()`, `data-session="free"` and any style on
`data-session="reading"`, and have their live transports ask `session.check()` before showing their own
"reconnecting" state.

## What ran

- `npm test`: 331 pass, 0 fail (`session.test.mjs`, the new `session-host.test.mjs`,
  `react-session.test.mjs`; the shared test product moved to `tests/support/session.mjs`).
- `npm run types`: clean, with fixtures that expect `FamilyBar.signin` to be gone and `check()` to
  resolve with the state.
- `npm run acceptance` (`session` checks) in Chrome: 7 of 7, including the new check that the dialog
  cannot be dismissed at 1280 and 390 px, the page behind is inert, and a read started meanwhile is
  sent after Continue.
- The same `session` checks in Firefox and WebKit (Playwright's builds): 7 of 7 in each.
- The whole acceptance in Chrome: 173 of 173 checks.
- Packed as `dist-pack/beyond-ui-0.9.0.tgz` (`sha512-w32v36DtS6a56Nb2/YKrZWN11PCOKijkjn1DihkO8VoeGrTx1C4dZa2abQIoDiMEPtNLCWozswBlHxbp4K9DGA==`) and copied into every consumer's `tools/`; each product's adoption is its own record.

## 0.9.1

Delegate's adoption found the last sentence about the session spoken by something other than the
dialog: the inbox's `session_rejected` reason, "… because Beyond Accounts did not accept your
session …". A product shows that reason when Beyond Projects refuses the person's credential while the
product's own session still reads `signed` (it asks `session.check()` first), for example before the
revocation feed ends it. The sentence now speaks of access: "Notifications are unavailable right now
because Beyond Projects could not confirm your access to them yet. Everything else works." («… porque
Beyond Projects aún no pudo confirmar tu acceso a ellas …»). If the session did end, the dialog says
so.

`npm test`: 331 pass, 0 fail, with `wording.test.mjs` asserting the new sentence and that it does not
mention the session; `npm run types` clean.

## 0.9.2

- **A frame never draws a dialog.** Inside a host (`delegate`, the Beyond Desktop), `Session` handed
  only an expired or revoked session to the host and still drew its own dialog in the frame for a
  suspended account and for Beyond Accounts not answering, under the Desktop's own dialog: two voices,
  against the rule's point 7. Every kind now goes to the host with its reason (`suspended`,
  `unavailable`), and the frame retries nothing of its own; the Desktop's dialog for the application
  answers it (Close {application} for a suspended account).
- **An alert dialog.** A dialog that asks for an answer and cannot be dismissed is announced as one:
  `role="alertdialog"`, named by its title and described by its sentence (`aria-describedby`).

`npm test`: 332 pass, 0 fail (`session-host.test.mjs` adds every kind handed to the host with nothing
drawn in the frame; `session.test.mjs` asserts the role and the description). `npm run types` clean.
The `session` browser checks, which now ask each engine for one alert dialog named by its title and
check its description, pass 7 of 7 in Chrome, Firefox and WebKit. A screen reader was not run; the
engines' accessibility trees were asked through Playwright's role queries.
