# Compose pages, messages and object lists

The shared implementation keeps the person's context, work and recovery together. Product code supplies records, permitted actions and navigation; UI owns their geometry and interaction. The 0.45.0 composition extends 0.44.0 without changing the token set (0.8.0).

## Page context

`Page` and `PageHeader` keep the existing region tiers and one content axis. A regular page without tabs ends its header with a quiet boundary before the work. Tabs supply that boundary when present. Tool and conversation templates keep their continuous surfaces and compact-header behavior. A header's facts remain structured facts; explanation belongs in `lead`.

Use existing `Section` and `DataTable.framed` where a table actually belongs to a bounded region. Do not frame every section or turn records compared by columns into cards. A confirmation still uses `Dialog` and its consequence; an inline notice does not acquire modal behavior by looking like a box.

## Messages and evidence

`callout` / React `Callout` is a reading block. Its maximum width is the reading measure plus its icon, gap, borders and one inset on each side. Its natural content may be narrower; actions remain next to the words and wrap within the region. The reading measure never expands to fill unused space. Actions do not widen the notice beyond that cap; their complete labels wrap when necessary.

Use the existing `details` option for a notice's `TechnicalDetails`. It occupies the notice's text column, inside the same box, rather than an unrelated form-width sibling. Optional body-only notices omit the title entirely. Independent technical records retain their own width tier. No CSS rule changes a message's tone, live-region meaning or retry behavior.

Products classify the cause and the responsible actor. An installation outage is a warning, not an instruction for the person to repair credentials. `Status`'s `unavailable` state says **Not available right now** / **No disponible ahora**, using the existing warning diamond; its state is distinct from `attention`. Only safe reads may retry on `Again`. A mutation with an unknown result must be reconciled before another attempt. A component never asserts delivery to an operator, current machine state, compensation or costs without the product's evidence.

## Object lists

Choose the pattern by the task: `ListRow` for opening and acting on objects, `DataTable` for comparing properties, an existing shared card composition for independent rich summaries. Navigation, event sequences, trees, form rows and pickers retain their patterns.

A collection with its own visible boundary uses `ul.bui-rows[data-framed]`, or `Collection` with `presentation: 'list', framed: true` (React: `framed`). The frame aligns to the page region, holds one shared inset, and contains the dividers, names and controls. Grouped collections frame each named group. Unframed lists retain their existing edge alignment and density; a nested list must not gain a second frame merely because its parent is framed. Table presentation ignores `Collection.framed`.

`ListRow.inline` places short metadata beside the name and wraps it when room runs out. Use it for a brief distinguishing role or type; keep causes, descriptions and multiple facts on the regular quiet line. A role may use `badge` / `Badge`. Never manufacture a role, count, description or logo. `OrganizationMark` uses the actual logo or name initial; within a framed object list the shared mark is 40 px. Attributes shared by every row remain omitted under L3.

The opening link, menu, selection and actions retain their existing independent targets. An inline update retains the focused name and menu instance. Framing does not add a second opening control, reset collection state or alter permissions. Long names remain available in the shared name hint.

## Navigation and adoption

The shared [Sidebar guide](sidebar.md) defines global expanded/collapsed navigation and the independent object context. Consumers select icons from UI's catalog and pass only permitted destinations. Public editorial navigation, native navigation and embedded product content require their own applicability assessment; they do not acquire a duplicate signed-in shell.

Installed package acceptance covers DOM and React 18/19. Product evidence must identify its installed archive, routes and fixture boundary. A shared check is not a product integration result. The suite's family reference owns criteria and adoption traceability; visual implementation is not owner acceptance.
