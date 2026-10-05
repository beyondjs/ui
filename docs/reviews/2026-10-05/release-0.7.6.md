# Release 0.7.6 — 5 October 2026

A patch release of `@beyond-js/ui` over [0.7.5](release-0.7.5.md), asked for by the suite's coordinating session after the owner asked again for every finding to be implemented. Conduict still kept its own wording in three places, because the package had no equivalent:
- why the inbox is unavailable, with its reason;
- the tabs' accessible names;
- the loading lines' names.

This release adds those words in English and Spanish so a product can drop its copies. Every change is additive: no existing key, default or markup changes, and the token set stays 0.3.0.

## What changed

| Change | Detail |
| --- | --- |
| Why the inbox is unavailable | A relay's `{ available: false, reason }` (the summary or a page of `beyond-notifications/1`) is kept by the feed. When `reason` is one of the codes the products' relays answer, the entry's panel and the full inbox say "Notifications are unavailable right now because {reason}. Everything else works." («… ahora porque {reason}. Todo lo demás funciona.»). New keys of `NotificationEntry.labels` and `NotificationInbox.labels`: `cause`, and one entry per code: `not_configured` ("this installation is not connected to Beyond Projects"), `not_platform_session`, `session_rejected`, `projects_unavailable` ("Beyond Projects did not answer") and `accounts_unavailable`. Any other reason, such as a message instead of a code, or none, keeps the plain `unavailable` sentence, which is unchanged. The reason goes once the aggregation answers again. `NoticeSummary` and `NoticePage` declare `reason` |
| Tabs named by what they belong to | `Tabs` (DOM and React) takes `name`. Without a `label`, the accessible name is "Sections of {name}" («Secciones de {name}», key `named`). A given `label` still wins, and the default stays "Sections of this page" |
| Loading lines that name what they wait for | `loading.text({ name, kind, language })` fills `loading.names`: `loading` "Loading {name}…", `opening` "Opening {name}…" and `reading` "Reading {name}…" («Cargando», «Abriendo», «Leyendo»). `name` is the thing as the product calls it, article included ("the conversation", «la conversación»). An unknown `kind` reads as `loading`. React `Loading.names` and `Loading.text` are the same objects, and React `Loading.labels` is now the DOM builder's own set |

## How Conduict drops its copies

| Conduict's own copy | Shared replacement |
| --- | --- |
| `gate.bar_unavailable`, `bar_unavailable_why`, `inbox_unavailable`, `inbox_unavailable_why` and the four `gate.reason_*` | `NotificationEntry.labels[language]` as given, with the relay's `reason` passed through as the adapter's answer. The override of `unavailable` in `Chrome.labels` goes |
| `manage.areas` "Areas of {environment}" | `new Tabs({ items, name: environment, labels: Tabs.labels[language] })` |
| `money.sections` "Costs sections" | `Tabs` with no `label`: "Sections of this page", or `name` |
| `chrome.opening` "Opening Conduict", `talk.loading` "Loading the conversation", `work.loading` "Reading the review…" and the like | `loading(loading.text({ name, kind, language }))` |

The wording moves to the shared sentences: "Everything else works." in place of Conduict's "Nothing is lost, and your work is not affected.", and "Sections of …" in place of "Areas of …".

## Checks

| Check | Result |
| --- | --- |
| `npm test` | 316 of 316, five cases more than 0.7.5 (`wording.test.mjs`): the inbox's sentence with known reasons, an unknown one and recovery; the entry's panel in Spanish and every code in both languages; `Tabs`' `name` with a given label winning and the default unchanged; the React `Tabs` passing `name`; the named loading lines in both languages. **Each fails without its fix:** with 0.7.5's sources and the new tests, all five fail |
| `npm run types` | No diagnostics, with the new options in the declaration fixtures |
| `npm run acceptance` | 168 of 168 in each engine: Chrome 154, Firefox 155 and WebKit 26.6. The markup of every existing state is unchanged, so no check was added; the new words are held by the unit tests |

Tarball: `beyond-ui-0.7.6.tgz`, `sha512-1b3iI0ecjfjsbxqIg3LShr1PbNqJhG22n8YSukVo32fZzndR+s60GrwNN9nNLny+sfd9zmv+LLzlL6U0UBmx9w==`.

## What stays open

- **A multi-leg window's hand-over is deferred on purpose.** The coordinating session decided this on 2026-10-05, recorded in [0.7.5](release-0.7.5.md#what-stays-open). In WebKit the page cannot send a window that has no opener to a second leg by its name. Projects solves this itself (projects `573f56b`). `ProviderWindow` gains a generic `next(href)` and a landing helper only when a second product needs a window with several legs.

## Family reference synchronization

There is no visible change of the reference's own. The suite's family reference records the vendored version with the products' move to it.
