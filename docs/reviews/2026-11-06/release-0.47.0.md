# Local UI 0.47.0: session reads, never in a loop

Evidence baseline: UI `8d26f30` on `feature/next` (0.46.0 and the work released after it) plus this change, made on 2026-11-06 on the branch `conduict/a-37-e2-conduict-s-pages-follow-changes-bca5` for Beyond Delegate's assignment A-37 (Supabase egress). It also releases the work recorded in [the unreleased pendings of 2026-10-31](../2026-10-31/unreleased-pendings.md), unchanged.

## Why

Beyond Suite's Supabase egress audit of 2026-11-06 saw one browser read Conduict's `GET /v1/session` 650 times between 12:30 and 12:31 and then 3 times a minute, and Delegate's `/api/session` 254 times in two minutes. Both products answer a session that ends with this package's `Session`, and both give it the session's expiry, from their own read and on creation.

## What the source did before 0.47.0

Source inspection of `8d26f30`:

- **The last minute of a session was read in a loop.** `Watch`'s `expires` setter (`src/dom/session/watch.js`, lines 39–46) scheduled the look before expiry at `max(0, at − now − 60 s)`, so within a session's last minute it fired at once. The look ran `check()`, whose `signed` answer set the same expiry again (`#known`, `src/dom/session/session.js` line 280), which scheduled the next look at once. Conduict and Delegate return a fixed expiry from their session reads, so every open tab read its session as fast as the network answered for the last minute of every session, until the read said `ended` and the renewal brought a new expiry. The new unit test reproduces it: 117 reads in about 150 ms. This matches a one-minute burst of 650 reads followed by the ordinary pace.
- **A request refused while the session read `signed` could loop.** `lost()` started a recovery whenever the state was `signed` (`session.js` line 117). The recovery read the session, found it signed, announced a renewal (`onrenewed`, the `beyond-session` channel) and resolved the held request true. A product that sends the request again and calls `lost()` on its next refusal therefore looped, with one session read and one `onrenewed` per turn. Delegate's API client does exactly this (`packages/app/src/api.ts` line 150, recursive `#routed`, read on Delegate's `feature/next` of 2026-11-06). Conduict sends a request again only once, so it does not loop, but it still pays one read and one `onrenewed` for every such refusal.
- **Looks were not single-flight.** `check()` read on every call (`session.js` line 129), so every live transport that dropped made its own read.
- **A hidden page kept trying.** `Retry` (Accounts not answering, a host not answering) ran every 60 s while hidden. `Watch`'s sleep detector and the `online` event looked while hidden. `NotificationEntry`'s `interval` refreshed the count forever (`src/dom/notifications/entry.js` line 157).
- **The sign-in window was read every 2 s with no end** while it stayed open (`src/dom/session/trip.js` line 88).
- **`Again` was already visibility-aware** (since 0.17.1, `src/dom/again/again.js` lines 46 and 169): a try due while the page is hidden waits and runs once when shown. It is unchanged.

The package itself makes no network request: products read through the functions they give it. The other timers it keeps (`Clock`'s one-second beat, the opening's watch, `ProviderWindow`'s reads, bounded to 15 minutes while its window is open) read nothing over the network.

## What changed

- **Single-flight reads** (`Reader`): a read asked for while one runs gets that read, unless the caller needs one started after a moment (after a renewal, the sign-in window or another tab's word). `check()` takes a `signed` answer younger than `fresh` (a new option, 15000 ms; `0` reads every time).
- **The look before expiry runs once per expiry** (`Watch`), and never sooner than its 15 s spacing after the last look. A hidden page does not look; shown again, it looks once.
- **A refusal soon after a renewal is doubted** (`Doubt`, new): within `pause` (60 s) of a renewal, `lost()` reads the session first, once for every refusal meanwhile. Ended, it recovers as before. Still `signed`, nothing is renewed, announced or sent again: `lost()` resolves false with `state` still `signed`, and each such read extends the pause. A `check()` that reads `ended` recovers at once.
- **No retries for a hidden page** (`Retry`): a try due while hidden runs once when the page is shown.
- **The sign-in window is read for at most 15 minutes** (`Trip`, `follow`), as `ProviderWindow`'s is. Then it is read when its landing speaks or once it closes.
- **`NotificationEntry`'s `interval`** refreshes nothing while the page is hidden, and refreshes once when it is shown.
- **What a product does:** when `lost()` resolves false while `session.state` is `signed`, the refusal was not the session's. The product says it in place as the request's refusal and never calls `lost()` again for that request.

## Executed checks

Through the machine's test queue, on 2026-11-06, from this repository.

- **New test file, light:** `node --test tests/session-reads.test.mjs` with the session, React session and notification files. The first run was 49 of 49. With the final tree, `sources.test.mjs` and `signout.test.mjs` were added: 62 of 62.
- **Negative control, light:** `tests/session-reads.test.mjs` copied onto a worktree of `8d26f30`. 7 of 8 failed there: 3 reads for three looks; 117 reads in the last minute; 50 sends of a refused request; a look while hidden; a second look within the spacing; a retry while hidden; and the notification refresh timed out while hidden. The one that passed guards a recovery that must stay.
- **The whole unit suite** (`npm test`, heavy): 1133 tests, 1133 passed, 0 failed. The first full run, before `Doubt` moved out of `Session`, failed one test only: `session.js` at 333 lines against the 300-line target.
- **Declarations** (`npm run types`): no error. The typed fixture compiles `fresh` and refuses a value that is not a number.
- **Browser, the session checks** (`BEYOND_UI_BROWSER=<engine> node acceptance/run.mjs 'session:'`, heavy): not run. No engine is installed on this machine: Google Chrome is missing at its channel path, and Playwright's Firefox and WebKit builds are missing from its cache. The change is in logic only: no markup, style or copy changed. The unit tests run it in happy-dom.

## Limits

- **No browser run.** The session checks of `acceptance/checks/session.mjs` still need a run in Chrome, Firefox and WebKit on a machine that has them.
- **Package evidence only.** No product vendors 0.47.0 yet. The audit's rates are hosted observations. The link to this cause comes from source inspection of the products and the package, and from the unit test that reproduces the loop. No hosted run was made after the change.
- **Not published.** The package is a local release, vendored as a tarball.

## Family reference synchronization

No reference impact. The dialog, its words, kinds and ways on are unchanged. What changes is how often the session is read. A request refused while the session still stands is now said by the product in place, where it used to be renewed again without anything shown, so no state the reference models changes.
