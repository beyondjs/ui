# Release 0.7.2 — 4 October 2026

A patch release of `@beyond-js/ui` over [0.7.1](release-0.7.1.md), asked for by the suite's coordinating session; every change is additive. The token set is unchanged (0.3.0). Nothing is published; consumers vendor the tarball.

## What changed

| Request | Change | Where |
| --- | --- | --- |
| `FocusedForm`'s failure line in Spanish | `FocusedForm.labels.en` / `.es`: «No funcionó. Vuelve a intentarlo.»; React `FocusedForm.labels` | `src/dom/form.js`, `src/react/dialog.js` |
| Two consequence keys for `confirm` (D17), replacing Conduict's local `parts/consequence.js` | `consequence: { affected, costing }` beside `lost`, `kept`, `recovery`, in Conduict's order (affected, lost, kept, costing, recovery): "Work it affects" / «Trabajo afectado», "What keeps costing" / «Qué sigue costando», the terms Conduict's vocabulary uses. The list is the public builder `consequence(parts, labels)` (with `consequence.order` and `consequence.labels`), which `confirm` uses and a product's own dialog draws; React `<Consequence parts labels />` renders the same markup. Same markup and classes as Conduict's copy (`bui-consequence`, `bui-consequence-<key>`) | `src/dom/consequence.js`, `src/dom/questions.js`, `src/react/dialog.js` |
| Any other English-only copy a Spanish page can show | See the next table | |

## Copy that was English only, now in English and Spanish

| Component | Before | Now |
| --- | --- | --- |
| `FamilyBar` (every signed-in product) | English defaults; a Spanish set existed only as an example in the component catalog | `FamilyBar.labels.es`, the catalog's set completed with `preferences` «Idioma y apariencia» and the `member` role (React `FamilyBar.labels`) |
| `NotificationEntry`, `NotificationInbox` | English only | `NotificationEntry.labels` and `NotificationInbox.labels` (one set, `{ en, es }`) |
| `Header` | English only | `Header.labels` |
| `Help` | English only | `Help.labels`: «Ayuda: {topic}», «Cerrar la ayuda» |
| `Sidebar` | English only | `Sidebar.labels`: «Secciones de {product}», «Cerrar» |
| `ProductNav`, `Tabs` | English only | `ProductNav.labels`, `Tabs.labels` |
| `PageHeader` | English only (the crumbs' name) | `PageHeader.labels`: «Ruta de navegación» |
| `loading()`, React `Loading` | "Loading…" by default | `loading.labels` / `Loading.labels`: «Cargando…» |
| `availability` | English `label`; Spanish only in the catalog's table | each entry's `labels: { en, es }` |
| React `Field`, `Collection` | The DOM classes had sets; the React components did not expose them | `Field.labels`, `Collection.labels` on the React components |

Left as they are, on purpose: `Button`'s busy form `{label}…` (the same in both languages); the lockup's alternative text "Beyond" and the products' names (never translated); relative times in notifications (already from `Intl` in the given `locale`).

## Checks

| Check | Result |
| --- | --- |
| `npm test` (new `spanish.test.mjs`: the new keys in order in both languages, the earlier keys unchanged, the builder's empty and custom cases, `FocusedForm`'s Spanish failure, every component's `en` and `es` sets with the same keys; `react-choose.test.mjs`: the React `Consequence` markup and the sets on the React components, also on React 18.3.1) | 290 of 290 |
| `npm run types` | No diagnostics |
| `npm run acceptance` in Chrome 154 (a new `choose:` check: a danger confirmation with the work affected and what keeps costing in the page's language, starting on Cancel, at 390 px) | 163 of 163, on the released content |
| Firefox 155 and WebKit 26.6 | 163 of 163 each, before only the documentation changed |

Tarball: `beyond-ui-0.7.2.tgz`, `sha512-OikczdI4Zuw5nvSrLfWKJyWuk1dnT7IiNkSGLkpYltRsLIKxjuKyz00LewM6P1QPl8zh+pwSK6AtvPyUWUtPgg==`.

## What stays open

- Conduict replaces `frontend/src/app/parts/consequence.js` with `consequence(parts, consequence.labels.es)` (or its vocabulary's terms as `labels`) when it vendors 0.7.2; the markup is the same.
- Products drop their own Spanish copies of the family bar, notifications and the rest in their own assignments.

## Family reference synchronization

Synchronized in the suite's family reference: the vendored tarball and the component catalog (`questions` with `affected` and `costing`, and the Spanish sets), recorded with the suite commit of this release.
