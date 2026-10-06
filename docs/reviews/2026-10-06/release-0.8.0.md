# Releases 0.8.0 to 0.8.3 — 6 October 2026

`Session` answers a session that ends while the person works, the same way in every Beyond product. It
is the family rule the owner asked for on 2026-10-06 (Beyond Suite's `docs/session-renewal.md`, D63 in
the family reference), and it presents D26.

The owner's prompt was an expired Conduict session. It showed a yellow banner between the family bar
and the page, a full-width "Sign in again" button and a red "could not be read · Try again" card: three
statements of one fact, and a retry that could not work.

## What 0.8.0 adds

| Part | What it does |
| --- | --- |
| `Session` (`src/dom/session/session.js`) | The orchestrator a product creates once it knows who is signed in. `lost({ reason, replay })` holds a request that came back `UNAUTHENTICATED` and resolves with whether to send it again. `check()` looks before the person acts. `subscribe()`, `open()` and `text('unsent')` complete the interface |
| `Silent` | Renewal without the person: the product's hand-off in a hidden frame with `prompt=none`, ended by the landing's message (source checked) or by a bound (10 s) |
| `Trip` | The sign-in window. It opens blank, drops the opener, then navigates. The product's read follows it, the landing wakes it, and the landing closes the window itself |
| `SessionNotice` | The one dialog. **Expired**: the person's avatar, name and email, "What you were doing stays here.", **Continue as {name}** and "Use another account"; it can be closed. **Revoked**: an opaque backdrop, and it cannot be closed. **Suspended**: no sign-in, and a link to Beyond Accounts. **Unavailable**: **Try again**. A blocked window offers "Continue in this tab" |
| `Guard` | After the dialog is closed, the page stays readable. A press that would act opens the dialog again. The family bar, dialogs, sheets, disclosures, menus, tabs and `data-session="free"` are exempt |
| `Watch` | Looks at the session when the tab is shown, when the network returns, on `pageshow`, after the computer slept, and a minute before a known expiry, at most once per 15 s |
| `Held`, `Reader`, `Retry`, `Channel` | What waited, by replay class. The product's read, bounded (an outage is never a sign-out). Retries after 5, 15, 30 and then every 60 s. The `beyond-session` channel between tabs |
| `FamilyBar.signin` | "Sign in" in place of the account menu and the notifications while the person reads without a session |
| `@beyond-js/ui/session/landed` | The landing a product's hand-off ends on. It has no imports, tells the frame's parent and the channel, and closes the window. It carries only the outcome |
| React | `useSession(options)` returns `{ session, signin }`, and `FamilyBar` takes `signin` |

Copy ships in English and Spanish (`Session.labels`).

Replay classes:

- A read is sent again once the session is renewed.
- A write is sent again once the session is renewed while the write waited.
- `false` (destructive or irreversible) is never sent again.

A loop ends in the dialog: there is at most one silent attempt per `pause` (60 s). Signing in as
someone else drops what was held and calls `onchanged` (by default `location.assign('/')`).

## What 0.8.1 corrects

`package.json` listed only stylesheets as side effects. Bundlers (esbuild here; Vite and Rollup alike)
therefore dropped `import '@beyond-js/ui/session/landed'`, and a silent renewal ended only by its
timeout and a read. The browser acceptance found it: a revoked session showed the expired dialog,
because Accounts' reason never arrived. The landing is now a declared side effect, and the first
`session:` check fails unless the landing itself reported the renewal.

## What 0.8.2 adds

`signin`, the product's own sign-in behind **Continue as {name}**, resolving true once done. Workspace's
installed shell asked for it: its session lives in the shell's main process and only the system
browser can renew it, so no hidden frame or window can. With `signin` the shell shows the same family
dialog, and Continue starts its own sign-in. A new unit test holds it: the dialog, no window opened,
the held write sent again.

## What 0.8.3 corrects

Snapshots' adoption found it. `SessionNotice.hide()` forgot the dialog's kind, so a dialog built for
an expired session and hidden by a renewal was reused for a later revoked or suspended one. That
reused dialog kept Escape and the × button and lacked the opaque backdrop, so the page stayed visible
behind it. The dialog now keeps its own strictness, and a change of strictness always builds a new one.
The new unit test fails on 0.8.2.

## Checks

| Check | Result |
| --- | --- |
| `npm test` | 329 of 329 on 0.8.3 (328 on 0.8.2, 327 on 0.8.1). `session.test.mjs` (10) covers: a silent renewal with every replay class; the dialog and the window; read-only with the bar's Sign in and a free control; revoked and suspended; someone else; unavailable; the loop guard; a look before acting; Spanish; the landing's message. `react-session.test.mjs` (1) covers `useSession` with the bar under `StrictMode` |
| `npm run types` | No diagnostics |
| `npm run acceptance session:` | 4 of 4 in Chrome 154, Firefox and WebKit, against a stand-in product served by the acceptance server (`acceptance/support/product.mjs`): the silent renewal reported by the landing with nothing shown; the sign-in window signing in and closing itself; the opaque revoked dialog in both themes; the readable page at 1280 and 390 px |
| `npm run acceptance` (the full run) | 173 of 173 in Chrome 154 on 0.8.1. The full run in Firefox and WebKit is not repeated here: their `session:` checks pass, and nothing else changed outside the opt-in `FamilyBar.signin` and the new stylesheet |

Tarball: `beyond-ui-0.8.1.tgz`,
`sha512-LHdieILFy4SxeJ1rBkL3JDKtaAFKDprczgWTMSLN2ggNz4JIrLQkT7dOykOiVgypzV8+ga2u1DFPapkKfQoF9Q==`.

## Not established here

- A real Beyond Accounts and a real product: the acceptance's product is a stand-in. Each product's
  adoption is verified in its own repository, and the suite's `acceptance/family` `session` phase
  checks the running composition.
- A screen reader.
- A frame refused by a product's own headers. Each product checks its `frame-src` and frame
  headers.
