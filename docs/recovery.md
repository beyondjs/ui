# Connection recovery

UI owns recovery presentation. Products own the dependency identity, context, request bounds and permission decisions. Since 0.24.0 the presentation follows the family's decision D163: an outage is said once, in one line, and what it affects says so in its own place.

## One outage, one line

`Recovery` (DOM `Recovery`; React `Recovery` and `useRecovery`) is one notice for one explicitly identified dependency and context: who did not answer (`title`, from the family's catalog of causes, such as "Beyond Accounts did not answer"), when it last tried and one **Try again**, on one line in the warning tone with the outage's globe mark, on the column's edge. It lists nothing. The reads it affects are its entries, and each one says it is unavailable in its own place on the page. Their evidence is one **Technical details** with a row per read: what it is, its request and its time, with the source's words once when every read said the same. On a narrow region Try again goes under the words, on their edge. Create independent instances for independent failures. Never group by matching error text, the word "connection", HTTP status alone or timing alone. An API transport loss and its live stream can share the active product or project's reachability scope; a named upstream, machine connection, access refusal or session loss cannot be inferred to share it.

Register each affected read with `set(key, { title, details, run })`. `title` names what the read is ("Machines"), shown only in Technical details; `details` is `{ request, time, text }`. A read that answers returns anything except `false`; a missing answer returns `false` or rejects. Use a distinct stable key for each independent read. Reuse one callback when several symptoms are answered by the same read; it runs once per attempt. An answer removes only that entry. `delete(key)` removes an entry confirmed by its owner or no longer relevant. Replacing an entry invalidates its earlier pending answer. Supply `focus: () => heading` for focus after the final symptom ends. Destroy the notice when its context leaves. The disclosure keeps its expansion and a focused Copy while reads come and go; identical evidence keeps a copy's result, and changed evidence clears it.

## Offline

Since 0.33.0, while the browser is offline (`navigator.onLine === false`) a line names no product. Nothing could have answered, so blaming one would say something the page does not know.

- **What it says.** "You're offline" («Estás sin conexión») in place of who did not answer. Its line under it reads "Last tried 12:04 · trying again as soon as you're back online" («Último intento 12:04 · se vuelve a intentar en cuanto vuelvas a tener conexión»), as the document's opening says it.
- **What it offers.** No Try again, since nothing can work then; the opening offers no Reload offline for the same reason. What was read stays under its "Last updated", and each region keeps its "Not available right now".
- **When it tries.** `Again` lets a try that falls due wait while offline (its `offline` getter and `moments.offline`), and tries at once on the window's `online` event. Back online, the line names its cause again and shows Try again until the read answers.
- **Said once.** Offline is one cause for the whole page, so only the first notice in the page's order that waits for an answer says it; the page's other notices wait hidden until the browser is online (`OfflineVoice`).
- **A dependency on this computer.** A notice for one, such as a development service on loopback, sets `local: true` (DOM option, `useRecovery` and React `Recovery`), and keeps naming it offline with its Try again.

Products need no change to get this: any notice whose reads failed while the browser is offline says it. `Unavailable`'s outage with `again` does the same, its reason saying "You're offline" and its own Try again hidden. `Recovery.labels.en` / `.es` carry `offline` with Try again's and the line's words.

Automatic reads use `Again`: one running attempt, backoff, online and visibility recovery, and `AgainLine`'s last-attempt wording. Each callback must bound its own network call. Transports that already reconnect register `automatic: false`; they retain their transport backoff and join the shared manual action. They return `false` until their actual ready event removes the entry. A transport's last successful observation is distinct from its last attempt. Do not invent either timestamp.

## What the outage affects, in its own place

Each region whose read did not answer says so where its content would be, with no cause and no action of its own:

- `EmptyState` with `kind: 'outage'`: "Not available right now" («No disponible en este momento») with the outage's mark, as one quiet line with no box (since 0.24.1, and in React since 0.25.1; `frame: true` asks for one). It takes no action and no `clear`: who did not answer and Try again are the notice's. A failed read is unavailable, never empty.
- `Section`'s `unavailable` (option, method and React prop) keeps the heading and actions and puts that state in the body.
- Content kept from an earlier read stays, with `LastUpdate` above it: "Last updated 12:04" («Última actualización: 12:04»), the day with the time on another day, or "May be out of date" («Puede no estar al día») when the time is not known, which is never invented. `Section`'s `updated` draws it.
- A `Collection` joins the notice with `recovery` (the notice), `outage(error)` (which failures are that cause's outage) and `details(error)` (their evidence): the list says "Not available right now" in place, the notice reads it again, and it leaves the notice when it answers or goes away. Any other failure keeps the collection's own answer.
- A `Picker` joins the same way since 0.33.0 (`recovery`, `outage`, `details`, DOM options and React props). The line under its list says "Not available right now" («No disponible en este momento») with the outage's mark, as `EmptyState`'s inline form, with no Try again of its own. The page's line searches again until it answers, and a gate shown in place of the list takes its symptom with it. Any other failure keeps the picker's own words and Try again.
- A table's cell, or a row's value, says it with `EmptyState`'s `inline` (since 0.33.0; React `inline`, hosted in a `span`). It is phrasing content: the mark beside the words on one muted line of the cell's size. A `DataTable` column's `render` returns it for the cells whose read did not answer, so no product keeps a cell outage of its own.
- In React, a `Collection` or `Picker` whose first read fails before `useRecovery`'s notice exists keeps its symptom until the notice arrives (0.33.0). Its outage is never said as its own failure only because the page had not drawn yet.

## Nothing to show

When nothing on the page could be read, the page's body is the outage itself: set `whole` and draw no empty regions. The notice then takes `Unavailable`'s form and geometry, its title a heading (`level`, 2 by default). A single read that fails on a page holding nothing else uses `Unavailable` with `kind: 'outage'` and `again`; both look and behave the same.

`NotificationInbox` draws its relay's outage this way since 0.33.0, whether Beyond Projects or Beyond Accounts did not answer (`projects_unavailable`, `accounts_unavailable`, or no reason) or a read failed while the browser is offline. Its body is the page form: who did not answer, when it last tried and one Try again. The read's evidence (the relay's `request` and reason, or the adapter's error) is the line's Technical details. Its filters, Mark all as read and Load more wait hidden, since they cannot work. It reads again by itself and gives the page back once the relay answers, keeping the page form while its own tries run. `locale` (`es…`) picks its words. Missing setup and refused access keep their own answers.

## React

`useRecovery({ title, labels, locale, again, level, focus })` makes the DOM notice once for a page; null until mounted. `<Recovery notice={notice} />` draws it, and `<Collection recovery={notice} outage details />` joins it. `<Recovery title reads whole />` makes its own notice from props: `reads` are the reads that did not answer now, `{ key, title, details, run, automatic }`, and a read leaves the notice when it leaves `reads`, since only the product knows that it answered; `run` is read from the latest props and is that read again. `Section` takes `unavailable` and `updated`; `EmptyState` takes `kind="outage"`; `LastUpdate` takes `time`, `locale` and `labels`.

## Placement

A product's root connection failure belongs once in its active context's notice region, on the H1's edge. A section-specific failure that no other read shares belongs in that section. A modal notification panel may keep its own actionable failure when its relay or upstream differs; a shared visual position alone does not establish a shared incident. A future application-wide owner requires context-aware lifecycle and explicit dependency identities; do not move all warnings into the family bar.

Keep useful content and drafts. A recovered stream is not proof that every resource read recovered. Remove each symptom only on its own answer. Only the product decides which actions remain safe. Session loss stays under `Session`; a lost transport checks the session first. Never register a write, destructive command or unknown outcome for automatic replay.

Use `RetryAction` for a safe read or transport reconnect outside a notice: the refresh glyph, visible **Try again** label (Spanish **Reintentar**), secondary style and busy state. DOM takes `run`; React takes `onClick`. The callback must report its failure in its owning state. React activation releases busy state after rejection, including StrictMode effect replay; an unmounted hook cannot start new work or update its departed component.

## A change that did not get its answer (D186)

A change keeps its own answer, said at the operation, and is never tried again by itself. Since 0.33.0, `ChangeOutcome` (DOM and React) says the two outages of a change in the warning tone, in a polite live region, never as an alert:

- **Answered unavailable** (`{ outcome: 'unavailable', cause, again? }`, for a 503 `UNAVAILABLE` on a write): who did not answer, then "Nothing was changed." («No se cambió nada.»). With `again` (a function or `{ run }`; React `onAgain`) it offers the person's own Try again («Reintentar»): the shared `RetryAction`, secondary, busy while it runs and one activation at a time. It is never tried by itself. Without `again`, the person's own action, such as the form's submit, is the way to try again.
- **No answer** (`{ outcome: 'unknown', cause?, check?, details? }`, for a timeout or a dropped connection): "The change may have been made." («Puede que el cambio se haya hecho.»), then who did not answer when known and "Check before trying again." («Compruébalo antes de volver a intentarlo.»). It offers the way to check (`check`, a node or `{ label, href }` / `{ label, run }`; React `{ label, href }` / `{ label, onSelect }`), and its request goes under Technical details. It never offers Try again, even when `again` is given: the person checks first.

`FocusedForm`, `confirm` and `prompt` draw what their `explain(error)` returns through `ChangeOutcome.answer`. An outcome is drawn as above, `{ text, tone: 'warning' }` gives a product's own words in the warning tone politely, and a string stays in the danger tone as an alert, for refusals' errors and failures that are not outages. React's `FocusedForm`, `Form` and `useConfirm` pass `explain` through unchanged. `ChangeOutcome.labels.en` / `.es` (`unchanged`, `maybe`, `check`, `retry`) are the family's words; products take them from here rather than keeping copies.

## A session that ended while a service did not answer

`Session`'s unavailable dialog names who did not answer since 0.33.0. Its words are "{product} did not answer" («{product} no respondió»), where it used to say "Beyond Accounts is not answering" whatever did not answer. The cause comes from the session's own reads:

- **The hidden renewal frame** reaches Beyond Accounts, so its failure names Beyond Accounts.
- **The product's `read()`** names who it reaches. An answer `{ state: 'unavailable', source }` names it, and so does a rejection whose error carries `source`. Otherwise the session's `source` option names it, a product id such as `projects` or a name. Without one, it is Beyond Accounts, as before.

Names follow the family's catalog of causes through `CauseName.of(id)`, which products use too. Beyond Accounts, Beyond Projects, Beyond CDN, Beyond Snapshots and Beyond Delegate take "Beyond" before their name. Every other product is named as the family bar names it (Conduict, Beyond Home), and a name that is no product id is said as given. A host's `delegate` request carries the same `source`. Offline the dialog says "You're offline" with "Your session is renewed as soon as you're back online. Your work stays here.", offers nothing, and tries again at once on `online`.

## Diagnostics

Show `TechnicalDetails` when there is useful support evidence: request and time, source diagnostics, transport observations or a specific known cause. `entries` holds the reads one incident affected, copied as one block per read. Missing HTTP information from an event stream is itself an explicit limit, never a fabricated server reason. Ordinary labels name tasks and objects, not identifiers.

The disclosure and its surface share a bounded form width. Technical output uses that surface's available width; it is not capped again as prose. It uses regular monospace at the shared small size with explicit body leading, wraps long identifiers, scrolls long output inside the region, and remains copyable. Ordinary explanatory prose retains the reading measure. The entire panel, not only its text, shrinks on narrow screens.

## Validation and adoption

Since 0.33.0, `tests/offline.test.mjs` covers the offline line and the session's cause, `tests/joined.test.mjs` the picker and the cell's place, `tests/outcome.test.mjs` a change's outcome, and `tests/notifications-outage.test.mjs` the inbox's page form. The browser check `checks/closing.mjs` measures them on the `closing.html` pages, offline included through the browser's own emulation. The source tests cover the one line, its evidence, the page form, grouped and independent scopes, partial recovery, stale answers, transport-owned backoff, one running activation, focus and copy across changes, the places (`EmptyState`'s outage, `Section`'s `unavailable` and `updated`, `LastUpdate`), a `Collection` joining and leaving a notice, the React forms under StrictMode and EN/ES words. The browser acceptance (`checks/recovering.mjs`) measures the line on the H1's edge, Try again at its end and under its words on a phone, the places, the evidence fitting at 320 px, the page form against `Unavailable` and the Spanish page, in both themes. Consumers' installed behavior remains a separate gate.

Consumers with custom action nodes must migrate those nodes to `RetryAction`; changing `Unavailable`'s default cannot replace an explicit action. No product's independent upstream failures are grouped automatically by UI.
