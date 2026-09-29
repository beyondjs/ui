# Component catalog

Every component of `@beyond-js/ui` 0.2.1: what it is for, its variants and main options, the states it states in words, and its consumers. DOM names come from `@beyond-js/ui` (or `/dom`); React names from `@beyond-js/ui/react`. Every component takes `labels` for its copy (strings with `{placeholders}` or functions of the values) and every DOM class has `mount(parent)` and `destroy()`. Type declarations in `types/` list every option.

**Consumers** (each product vendors the tarball in its own `tools/` and records its adoption, residual copies and evidence in its own repository; the family reference catalogs them component by component in `branding/src/family/components/consumers.js`): on 0.1.7 or later since 2026-09-28 (the Collection consumers, Delegate, Conduict and Branding, on 0.1.8): the Beyond desktop (plain DOM), the Delegate application (React, the whole application), Branding (plain DOM), the Conduict interface and its Desktop surface (plain DOM), the Projects interface (plain DOM served by its service), the Snapshots and Accounts frontends and the Workspace client (React), and the CDN administration and backoffice (React, through the package's `Dialog`). Every product that names itself beside the wordmark uses `Lockup`.

## Foundations

**Tokens** (`@beyond-js/ui/tokens`, `@beyond-js/ui/tokens.css`). Token set 0.1.0 (unchanged in packages 0.1.1 to 0.2.1: the package version and the token set version are independent, and `tokens.version` stays `0.1.0`), `status: 'proposed'`, canonical here with provenance from the family reference. Components read semantic roles only (`--color-<role>`), never primitives. The theme follows `data-beyond-mode` (`light` or `dark`), falling back to the system preference. Density follows `data-density="compact"` on the root; coarse pointers always get 44 px targets. Consumer: Branding (tokens only).

**Motion.** 150 ms and 200 ms with one easing, for entering panels and dialogs and for control color changes. Under `prefers-reduced-motion: reduce` nothing animates or transitions; spinners stop and state stays in words.

## Actions

**Button** (`Button`; React `Button`, `useBusy`). Variants `primary` (one per view), `secondary`, `quiet`, `danger`; `small`; `glyph`; `href` renders a link styled as a button. `busy` keeps focus and place, marks `aria-disabled`, shows a spinner and says it is working; `run(work)` and React `useBusy()` wrap an asynchronous action so a second press is ignored.

**ActionMenu** (`ActionMenu`). A menu button of actions (ARIA menu pattern) for secondary actions on a record. Items: `label`, `run` (React `onSelect`) or `href`, `disabled` with `reason`, `tone: 'danger'`. ArrowDown/ArrowUp open on the first/last item, arrows, Home and End move, Escape closes and returns focus, Tab closes, a press outside closes. A disabled item stays reachable and reads its reason. The list stays inside the viewport (since 0.1.4): `placement: 'auto'` (default) opens below the button, or above it when there is no room below and more above; `'below'` and `'above'` fix the side; it is shifted sideways when an edge would cut it and capped to the room on its side, where it scrolls. Focus moves into it, within it and back to the button without scrolling the page or any scroll container around it. Use links in navigation, not this menu.

**Disclosure** (`Disclosure`). A button that shows and hides a panel (account menu, header panels). Escape and the button close and return focus; a press outside closes. It traps nothing. Closing hides the panel at once; since 0.1.5 an inert picture of a floating panel (`.bui-disclosure-leaving`: no identifiers, hidden from assistive technology) eases out where it was and removes itself. A panel in the page's flow (help) closes with no picture, which would hold its place, and with reduced motion there is none. A product that restyles the panel styles the picture with it.

## Forms

**Field** (`Field`). Label, hint, control and error wired with `aria-describedby` and `aria-invalid`. DOM `check()` uses the browser's constraints plus `validate(value)` and shows the consumer's `messages.<failure>`; after an error the field rechecks while typing. React `Field` wraps one control child and takes `hint`, `error`, `optional`.

**Choices** (`Choices`). Checkboxes (value is an array) or radios (value is a string) in a fieldset with legend, hint and error; options may be disabled with a visible `reason`.

**Select** (`Select`). A styled native select for short finite lists; keeps native keyboard and touch pickers. Use `Picker` for searchable or large entity collections.

**Picker** (`Picker`). Searchable single or multiple entity picker over an asynchronous paged `source({ query, filters, cursor, limit, signal })` returning `{ items, next, total }`. Options: `label`, `multiple`, `selected` (initial, may carry `state: 'stale' | 'ineligible' | 'unavailable'` and `reason`), `filters` (finite selects), `name` (hidden inputs for forms), `hint`, `limit`, `delay`, `all` (multiple only: a "Select all shown" action that adds, in one change, every result shown that can be chosen; offered while one is left, focus returning to the search field when it leaves; since 0.1.3). States: loading, results count (`12 of 45 shown`), no matches for the query or filters, nothing to choose, failure with retry, "Load more". Choices are kept by id across queries, filters and pages, counted ("3 selected · 1 needs attention") and listed as removable chips; removing a chip keeps focus. Disabled results show their reason and are never chosen. Keyboard: arrows and Page Up/Down move the active option (`aria-activedescendant`), Enter chooses without submitting a form, Escape clears the query. A late answer of an older query never replaces a newer one. The product revalidates on commit and reports findings with `mark(id, { state, reason })`; authorization stays in the product.

**FocusedForm** (`FocusedForm`). Submission behavior for a dedicated create or edit form: validates fields (or the browser's constraints), runs `submit` once, marks the form busy and ignores double clicks and repeated Enter, shows a failure as an alert with `explain(error)` and keeps every value. React `FocusedForm` renders a function of `busy`.

## Dialogs and questions

**Dialog** (`Dialog`; React `Dialog` with `open`, `onClose`, `actions`). Modal on native `<dialog>`, named by its title, described by its description. Focus moves to `[data-autofocus]`, the first field or the first action; Tab wraps; closing restores focus to the opener (the focused element, or, where a click does not focus a button as in Safari, the element last pressed; since 0.2.1) or `restore`, never to the page's body. Escape and the close button dismiss unless `escape: false`; the backdrop dismisses only with `backdrop: true`. While `busy` nothing dismisses it, including repeated Escape. Sizes `small`, `medium`, `large`. The dialog never grows past the viewport: when the content is taller, the body scrolls on its own while the title, description and footer actions stay in view (at 320 px and 200 % zoom too); only on viewports shorter than 20 rem does the whole dialog scroll. Use it for short focused tasks; long create and edit flows deserve their own navigable screen. The React `Dialog` calls `onClose` only when the person dismisses the dialog it holds or `close(value)` runs inside it: closing it through `open`, a replacement when a shaping prop (`size`, `description`, `escape`, `backdrop`, the close label) changes, unmounting it and React's development double mount report nothing, and a destroyed dialog is never opened.

**confirm, prompt, alert** (DOM functions; React `useConfirm(labels)`). Promise-returning in-app questions: `confirm` resolves true or false, `prompt` the value or null, `alert` once acknowledged. `tone: 'danger'` focuses the safe choice; `focus: 'cancel' | 'accept'` sets the starting button independently of the tone (since 0.1.3), so a consequential but not destructive step such as a publication starts on Cancel without the danger styling. With `work`, accepting runs the operation busy and non-dismissible; a failure stays in the dialog (`explain`) for retry or cancel. Intended for guards such as Delegate's unsaved-drafts question; they do not replace the browser's own `beforeunload`.

**Consequence first** (decision D17; since 0.2.0). A destructive or irreversible confirmation states its consequence: `confirm({ …, consequence: { lost, kept, recovery } })` shows a short list under the message, each part only when given (text, a node or a list of them), labelled "What is lost", "What is kept" and "How to undo" (`labels.lost`, `labels.kept`, `labels.recovery`). The accept button is always the action's own verb (`accept: 'Delete project'`): "OK" and "Confirm" are wrong for a named action, and the default "Confirm" remains only for compatibility.

```js
await confirm({
	title: 'Delete Storefront?',
	message: 'The project is deleted for everyone in Northwind.',
	accept: 'Delete project',
	tone: 'danger',
	consequence: { lost: ['Its entries in each product', 'Its repositories'], kept: 'Each product’s own records', recovery: 'Deletion cannot be undone.' }
});
```

## Help

**Help** (`Help`). Essential help behind a toggle button next to what it explains, named "Help: <topic>". Opens with click, tap, Enter or Space; Escape closes and returns focus; the explanation flows in the layout at any width.

**Tooltip** (`Tooltip`). A supplementary description on hover, keyboard focus and a touch press; hoverable, Escape hides it, positioned inside the viewport. Never the only copy of essential information.

## Collections and feedback

**Collection** (`Collection`; React columns may `render` React content). Compact list with search, finite filters, a table whose primary cell links to the detail (`link(row)`, `onopen` for applications that route themselves) and paging by `total` or `more`. States: loading (skeleton), failure with retry, empty with its first action, no matches with "Clear search and filters". `state` (`query`, `filters`, `page`) and `onstate` keep list context in the address across back, forward and reload. A page change moves focus to the new rows. Rows stack with their column labels below 640 px.

**Status, Badge, Callout, Loading, Skeleton.** `status(label, tone)` is a state with a dot and words; `badge` a short tag; `callout({ tone, title, body, actions, live })` a message block (`live` announces, assertively for danger); `loading(label)` an announced spinner; `skeleton(lines)` hidden placeholders. Tones: `neutral`, `success`, `warning`, `danger`, `info` (and `progress` for status).

**availability** (DOM and React `availability`; since 0.2.0). The family's one availability vocabulary (decision D20), in order, each with its tone: Available (`success`), Closed access (`warning`), In preparation (`info`), Planned (`neutral`), Retired (`neutral`). Entries are frozen `{ key, label, tone }` with the keys `available`, `closed`, `preparation`, `planned` and `retired`; products show these words and no others, in sentence case, passing their own language by `key`:

| `key` | English | Spanish |
| --- | --- | --- |
| `available` | Available | Disponible |
| `closed` | Closed access | Acceso cerrado |
| `preparation` | In preparation | En preparación |
| `planned` | Planned | Planificado |
| `retired` | Retired | Retirado |

```js
const spanish = { available: 'Disponible', closed: 'Acceso cerrado', preparation: 'En preparación', planned: 'Planificado', retired: 'Retirado' };
for (const state of availability) row.append(badge(spanish[state.key], state.tone)); // DOM
availability.map(state => <Badge key={state.key} label={spanish[state.key]} tone={state.tone} />); // React
```

**Unavailable** (DOM `Unavailable`, React `Unavailable`; since 0.2.0). "Not available here" (decision D06): a missing permission, admission, association or capability explained in place instead of a refusal card, a raw error envelope or a hidden button. Options: `title` (what is unavailable), `reason` (why), `owner` (who can change it, after "Who can change this: ", `labels.owner`), `action` and `secondary` (nodes in the DOM, React content in React), `kind` (`access` with a lock, `association` with a plug, `capability` with an information mark), `code` (the refusal's code as a neutral tag) and `level` (the heading, 2 to 6, default 2). Its tones are warning, information and neutral, never danger: it must not look like a failure of the product. It decides nothing: the product states the refusal it received.

**Toaster** (`Toaster`; React `useToaster`). Transient outcome messages, one region per page: successes and information announced politely and removed after `duration`; failures assertive and kept until dismissed. A toast says what just happened on this screen; it is never stored and is not a notification. An outcome repeats the action's verb in the past tense with its object ("Project deleted", "Proyecto borrado"); the package offers no helper for it, because past tenses are the product's language. Since 0.1.6 the toaster sits `--bui-toaster-bottom` above the viewport's bottom edge (default `--space-4`), so a surface with a bottom bar of its own, such as the Desktop's dock, raises it there.

## Header and notifications

**Lockup** (DOM `lockup`, React `Lockup`; since 0.1.6). The family treatment of the product name: the Beyond wordmark with the product name beside it, set apart by a divider, the same in every product. The consumer passes the wordmark asset it carries (`src`; the package ships no brand asset), `name` and, when needed, `alt` (default `Beyond`). The name is sized to the wordmark's cap height and aligned to its letters, not to its image box, whose lower part holds the drips of the O; `--bui-lockup-height` (default 21px) scales both. In the family header, pass `brand.lockup: { src, name }` (since 0.1.7). The owner rejected proposal R06 on 2026-09-29: the product name stays beside the wordmark, through this one lockup. Since 0.2.0 the name's box is trimmed to its cap height (`text-box: trim-both cap alphabetic`) where the browser supports it, so its cap top and baseline meet the letters' within 0.02 px at every height from 18 to 40 px in Chrome and WebKit and within 0.1 px in Firefox; without that support the earlier placement applies (up to 1.7 px off, measured by forcing it in those engines).

**FamilyBar** (DOM `FamilyBar`, React `FamilyBar`; since 0.2.0). The one bar every signed-in product renders (decisions D01 and D04), built on `Header`: navy in both themes, `--layout-family` tall, sticky at the top (`position: sticky; top: 0`, `z-index: var(--bui-family-layer, 45)`, below dialogs and toasts), one row from 1440 to 320 px. It renders the `beyond-family/1` descriptor the product relays from Beyond Projects (`GET /v1/family`).

- **Brand.** The wordmark (`brand.src`, the product's own asset) is a link home, named "Beyond home": `descriptor.links.home`, or `brand.href` without a descriptor. The product name follows as the family lockup (same size, place and divider) and is the product switcher, named "Product: Delegate. Change product".
- **Product menu.** `descriptor.products` in order: the name (from `products`, never translated), a one-line summary ("This project in Workspace" inside a project, "Project overview" for Projects; `labels.area({ product })` outside one, such as "Applications") and, when unavailable, the reason as a tag ("Not set up here", "Not open to you yet", "Project archived"; any other code reads "Not available"). An unavailable entry is a link only when it has a `url` and its reason is advisory (`advisory`, default `['NOT_ADMITTED']`); otherwise it is text the arrow keys still reach. The current product has `aria-current="page"`.
- **Location.** The organization menu (the person's organizations with their role; choosing one goes to `links.home?organization=`), then `/` and the project menu (the organization's projects, then "All projects"; choosing one goes to the current product's entry for that project when it is open, else to the project in Projects). No project menu outside a project. Below 720 px both become one location menu whose button shows the project (or organization) name with an ellipsis and whose panel lists both sections.
- **End.** A Docs link (`links.docs`; below 480 px it moves into the account menu), the `notifications` node, and the account menu: initials, name and email, "Your account" (`links.account`), "Members of this organization" (`links.members`), the product's `account.items`, then Sign out (`account.signout`: a callback or `{ href }`; `account.label` rewords it).
- **Degraded states.** Never an error in the bar. `descriptor: null` is loading: the lockup and product name show, the location shows the `fallback` names or a placeholder, without menus. `{ unavailable: true }` (or a failed fetch) shows `fallback: { person, organization, project }` as text, and the product menu holds one Projects link to `brand.href`. Sign out is always offered. `state` reads `loading`, `unavailable` or `ready`.
- **Updates.** The `descriptor` and `fallback` setters redraw (React props); focus on a part of the bar stays on that part. `onnavigate(item, event)` (React `onNavigate`) takes over plain clicks on the bar's own same-origin links (`item`: `{ href, url, label }`). `toggle` passes through to `Header` for a product's own sidebar.
- **Keyboard.** Every menu is a disclosure of links (not the ARIA menu role): Enter or Space opens it on its first entry, arrows, Home and End move, Escape closes and returns focus, a press outside closes. Focus rings use `--color-family-marker`.
- **No product navigation.** The bar is identical in every product; a product's navigation lives in its sidebar or in `ProductNav`.

Labels and their English defaults: `home` "Beyond home", `product` "Product: {name}. Change product", `products` "Products", `entries` "This project in each product", `overview` "Project overview", `entry` "This project in {product}", `area({ product })` (Projects "Projects of this organization", Workspace "Development environments", Delegate "Delegated projects", CDN "Applications", Snapshots "Captures", Conduict "Environments and conversations", Accounts "Members and invitations"), `back` "Your organizations and projects", `UNCONFIGURED` "Not set up here", `NOT_ADMITTED` "Not open to you yet", `ARCHIVED` "Project archived", `unavailable` "Not available", `organization` "Organization: {name}. Change organization", `organizations` "Organizations", `role({ role })` (Owner, Administrator, Developer, Viewer), `project` "Project: {name}. Change project", `projects` "Projects of {organization}", `all` "All projects", `location` "Location: {place}. Change organization or project", `loading` "Loading where you are", `docs` "Docs", `account` "Account: {name}", `anonymous` "Account", `yours` "Your account", `members` "Members of this organization", `signout` "Sign out", and `header`, `context`, `open`, `close` for the underlying header.

```js
const bar = new FamilyBar({
	product: 'delegate',
	brand: { src: '/brand/wordmark.svg', href: 'https://projects.example/' },
	descriptor: null, // loading; then bar.descriptor = await relay() or { unavailable: true }
	fallback: { person: 'Ana Pérez', organization: 'Northwind' },
	notifications: entry.element,
	account: { signout: () => session.end() },
	onnavigate: item => router.go(item.url),
	labels: es // below
}).mount(document.body);
```

Spanish, as a product passes it (the acceptance's React page uses this set):

```js
const es = {
	home: 'Inicio de Beyond', product: 'Producto: {name}. Cambiar de producto', products: 'Productos',
	entries: 'Este proyecto en cada producto', overview: 'Resumen del proyecto', entry: 'Este proyecto en {product}',
	area: ({ product }) => ({ projects: 'Proyectos de esta organización', workspace: 'Entornos de desarrollo', delegate: 'Proyectos delegados', cdn: 'Aplicaciones', snapshots: 'Capturas', conduict: 'Entornos y conversaciones', accounts: 'Miembros e invitaciones' })[product] ?? '',
	back: 'Tus organizaciones y proyectos', UNCONFIGURED: 'No configurado aquí', NOT_ADMITTED: 'Aún no está abierto para ti', ARCHIVED: 'Proyecto archivado', unavailable: 'No disponible',
	organization: 'Organización: {name}. Cambiar de organización', organizations: 'Organizaciones',
	role: ({ role }) => ({ owner: 'Propietario', admin: 'Administración', developer: 'Desarrollo', viewer: 'Lectura' })[role] ?? role,
	project: 'Proyecto: {name}. Cambiar de proyecto', projects: 'Proyectos de {organization}', all: 'Todos los proyectos',
	location: 'Ubicación: {place}. Cambiar de organización o proyecto', loading: 'Cargando dónde estás', docs: 'Documentación',
	account: 'Cuenta: {name}', anonymous: 'Cuenta', yours: 'Tu cuenta', members: 'Miembros de esta organización', signout: 'Cerrar sesión',
	context: 'Dónde estás', open: 'Abrir navegación', close: 'Cerrar navegación'
};
```

React: `<FamilyBar product brand descriptor fallback products notifications={<NotificationEntry … />} account={{ signout, items: [{ label, href | onSelect }], label }} toggle onNavigate advisory labels />`. Memoize `labels`; `descriptor` and `fallback` are applied when they change.

**ProductNav** (DOM `ProductNav`, React `ProductNav`; since 0.2.0). A product's own navigation as a light row of tabs under the family bar: `items` (`{ label, href, current }`), `label` (the navigation's name, default `labels.nav` "Product"), `onnavigate` (React `onNavigate`) for plain clicks, `sticky` to stay under the bar (not sticky by default). The row scrolls sideways when narrow and keeps the current tab (`aria-current="page"`) in view, whole pixels inside its padding (WebKit keeps only whole pixels of a scroll position); focus rings are drawn inside the tabs.

**Header** (`Header`). The shared header primitive (signed-in products render `FamilyBar`, which is built on it): `brand` (link home: text, the family lockup with `lockup`, a `logo` node or an `image`; with a picture, `label` is the link's one accessible name and the picture is not read, since 0.1.7), `context` (breadcrumb entries), `nav` (product links), `notifications` and `account` slots, `onnavigate` for routed applications. Below 768 px the navigation collapses behind a toggle; with `toggle: { controls, expanded, onchange }` the same button opens a product's own sidebar instead. It places content and decides nothing about access.

**NotificationEntry** (`NotificationEntry`). The header bell with the unread count and a panel of recent items. Options: `adapter`, `href` (the full inbox), `onopen(destination)`, `onview`, `products` (display names), `locale`, `limit`, `interval`. The count is hidden while unknown, after a failure and while unavailable. A summary with `more: true` counted up to its bound, so the count reads "N+" for any N ("12+") and the bell's name says "12 or more unread"; without `more`, a count past 99 reads "99+". The panel states loading, empty, failure with retry, unavailable (for example a product running without Projects) and partial results naming the unreachable products by their display names from `products` (the id only when no name is given); it offers "Mark as read", "Mark all as read" (bounded by when the list loaded) and "View all". "View all" (a plain primary click) closes the panel and returns focus to the bell, then either follows `href` or, with `onview`, hands over to the product; a click with a modifier key opens elsewhere and leaves the panel. Opening an item asks the adapter, which rechecks access; an item that is gone is removed with a message. Item text is forgotten when the panel closes. Closing it from code (`close()`) returns focus to the bell when focus was inside the panel. Read-only `count`, `more` (the count stopped at the bound) and `missing` (product ids the last summary named as unreachable, which also sets `data-state="partial"`).

React `NotificationEntry` takes `onOpen`, `onView` and the same options as props. Its ref (`NotificationEntryHandle`) exposes `refresh()`, `open()`, `close()` and the read-only `count`, `more` and `expanded`, so a product closes the panel itself, for example on a route change.

**NotificationInbox** (`NotificationInbox`). The full inbox: unread or all, product filter, items grouped by `group` with their earlier updates behind a toggle, "Load more" by cursor, mark read and unread, mark all read for the filter shown, open. States as the entry. `state` and `onstate` keep the filter in the address.

**Adapter.** Both take `{ summary(), list({ state, product, cursor, limit }), read(ids | { before, product }), unread(ids), open(id) }`, shaped after `beyond-notifications/1` as the product's relay answers: `summary` → `{ unread, more?, sources?, unavailable?, available? }`; `list` → `{ items, next, sources?, unavailable?, available? }` with items `{ id, product, title, summary?, occurred, read, group? }`; `open` → `{ destination }` or a rejection with `code: 'NOT_FOUND'`. `available: false` means the aggregation is absent or unreachable. Beyond Projects answers `{ unread (0–99), more, sources: [{ product, state }] }`: `more: true` means its count stopped at the scan bound, and a source with `state: 'unavailable'` is a product whose items are hidden because it did not answer (the partial signal, in a summary and in a list page alike). A product relay may instead name those products in `unavailable` (ids); both shapes are read, together if both are present. Marking read never performs a business action.

**Notification copy.** Both take `labels` (EN defaults; products pass ES or any language). Entries added or changed in 0.1.1: `button({ count, more })`, the bell's accessible name (`more` is true for a bounded count); `badge({ count, more })`, the visible count (default "N+" with `more`, "99+" past 99 without it); `partial({ products })`, where `products` is now the display names joined by ", ".
