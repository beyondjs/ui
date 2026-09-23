# Component catalog

Every component of `@beyond-js/ui` 0.1.0: what it is for, its variants and main options, the states it states in words, and its consumers. DOM names come from `@beyond-js/ui` (or `/dom`); React names from `@beyond-js/ui/react`. Every component takes `labels` for its copy (strings with `{placeholders}` or functions of the values) and every DOM class has `mount(parent)` and `destroy()`. Type declarations in `types/` list every option.

**Consumers:** no product consumes the components yet. Branding consumes only the tokens. Each product's adoption assignment records itself here, with its revision and evidence.

## Foundations

**Tokens** (`@beyond-js/ui/tokens`, `@beyond-js/ui/tokens.css`). Token set 0.1.0, `status: 'proposed'`, canonical here with provenance from the family reference. Components read semantic roles only (`--color-<role>`), never primitives. The theme follows `data-beyond-mode` (`light` or `dark`), falling back to the system preference. Density follows `data-density="compact"` on the root; coarse pointers always get 44 px targets. Consumer: Branding (tokens only).

**Motion.** 150 ms and 200 ms with one easing, for entering panels and dialogs and for control color changes. Under `prefers-reduced-motion: reduce` nothing animates or transitions; spinners stop and state stays in words.

## Actions

**Button** (`Button`; React `Button`, `useBusy`). Variants `primary` (one per view), `secondary`, `quiet`, `danger`; `small`; `glyph`; `href` renders a link styled as a button. `busy` keeps focus and place, marks `aria-disabled`, shows a spinner and says it is working; `run(work)` and React `useBusy()` wrap an asynchronous action so a second press is ignored.

**ActionMenu** (`ActionMenu`). A menu button of actions (ARIA menu pattern) for secondary actions on a record. Items: `label`, `run` (React `onSelect`) or `href`, `disabled` with `reason`, `tone: 'danger'`. ArrowDown/ArrowUp open on the first/last item, arrows, Home and End move, Escape closes and returns focus, Tab closes, a press outside closes. A disabled item stays reachable and reads its reason. Use links in navigation, not this menu.

**Disclosure** (`Disclosure`). A button that shows and hides a panel (account menu, header panels). Escape and the button close and return focus; a press outside closes. It traps nothing.

## Forms

**Field** (`Field`). Label, hint, control and error wired with `aria-describedby` and `aria-invalid`. DOM `check()` uses the browser's constraints plus `validate(value)` and shows the consumer's `messages.<failure>`; after an error the field rechecks while typing. React `Field` wraps one control child and takes `hint`, `error`, `optional`.

**Choices** (`Choices`). Checkboxes (value is an array) or radios (value is a string) in a fieldset with legend, hint and error; options may be disabled with a visible `reason`.

**Select** (`Select`). A styled native select for short finite lists; keeps native keyboard and touch pickers. Use `Picker` for searchable or large entity collections.

**Picker** (`Picker`). Searchable single or multiple entity picker over an asynchronous paged `source({ query, filters, cursor, limit, signal })` returning `{ items, next, total }`. Options: `label`, `multiple`, `selected` (initial, may carry `state: 'stale' | 'ineligible' | 'unavailable'` and `reason`), `filters` (finite selects), `name` (hidden inputs for forms), `hint`, `limit`, `delay`. States: loading, results count (`12 of 45 shown`), no matches for the query or filters, nothing to choose, failure with retry, "Load more". Choices are kept by id across queries, filters and pages, counted ("3 selected · 1 needs attention") and listed as removable chips; removing a chip keeps focus. Disabled results show their reason and are never chosen. Keyboard: arrows and Page Up/Down move the active option (`aria-activedescendant`), Enter chooses without submitting a form, Escape clears the query. A late answer of an older query never replaces a newer one. The product revalidates on commit and reports findings with `mark(id, { state, reason })`; authorization stays in the product.

**FocusedForm** (`FocusedForm`). Submission behavior for a dedicated create or edit form: validates fields (or the browser's constraints), runs `submit` once, marks the form busy and ignores double clicks and repeated Enter, shows a failure as an alert with `explain(error)` and keeps every value. React `FocusedForm` renders a function of `busy`.

## Dialogs and questions

**Dialog** (`Dialog`; React `Dialog` with `open`, `onClose`, `actions`). Modal on native `<dialog>`, named by its title, described by its description. Focus moves to `[data-autofocus]`, the first field or the first action; Tab wraps; closing restores focus to the opener or `restore`. Escape and the close button dismiss unless `escape: false`; the backdrop dismisses only with `backdrop: true`. While `busy` nothing dismisses it, including repeated Escape. Sizes `small`, `medium`, `large`. Use it for short focused tasks; long create and edit flows deserve their own navigable screen.

**confirm, prompt, alert** (DOM functions; React `useConfirm(labels)`). Promise-returning in-app questions: `confirm` resolves true or false, `prompt` the value or null, `alert` once acknowledged. `tone: 'danger'` focuses the safe choice. With `work`, accepting runs the operation busy and non-dismissible; a failure stays in the dialog (`explain`) for retry or cancel. Intended for guards such as Delegate's unsaved-drafts question; they do not replace the browser's own `beforeunload`.

## Help

**Help** (`Help`). Essential help behind a toggle button next to what it explains, named "Help: <topic>". Opens with click, tap, Enter or Space; Escape closes and returns focus; the explanation flows in the layout at any width.

**Tooltip** (`Tooltip`). A supplementary description on hover, keyboard focus and a touch press; hoverable, Escape hides it, positioned inside the viewport. Never the only copy of essential information.

## Collections and feedback

**Collection** (`Collection`; React columns may `render` React content). Compact list with search, finite filters, a table whose primary cell links to the detail (`link(row)`, `onopen` for applications that route themselves) and paging by `total` or `more`. States: loading (skeleton), failure with retry, empty with its first action, no matches with "Clear search and filters". `state` (`query`, `filters`, `page`) and `onstate` keep list context in the address across back, forward and reload. A page change moves focus to the new rows. Rows stack with their column labels below 640 px.

**Status, Badge, Callout, Loading, Skeleton.** `status(label, tone)` is a state with a dot and words; `badge` a short tag; `callout({ tone, title, body, actions, live })` a message block (`live` announces, assertively for danger); `loading(label)` an announced spinner; `skeleton(lines)` hidden placeholders. Tones: `neutral`, `success`, `warning`, `danger`, `info` (and `progress` for status).

**Toaster** (`Toaster`; React `useToaster`). Transient outcome messages, one region per page: successes and information announced politely and removed after `duration`; failures assertive and kept until dismissed. A toast says what just happened on this screen; it is never stored and is not a notification.

## Header and notifications

**Header** (`Header`). The shared family header: `brand` (link home, text or image), `context` (breadcrumb entries), `nav` (product links), `notifications` and `account` slots, `onnavigate` for routed applications. Below 768 px the navigation collapses behind a toggle; with `toggle: { controls, expanded, onchange }` the same button opens a product's own sidebar instead. It places content and decides nothing about access.

**NotificationEntry** (`NotificationEntry`). The header bell with the unread count and a panel of recent items. Options: `adapter`, `href` (the full inbox), `onopen(destination)`, `onview`, `products` (display names), `locale`, `limit`, `interval`. The count is hidden while unknown, after a failure and while unavailable. The panel states loading, empty, failure with retry, unavailable (for example a product running without Projects) and partial results naming the unreachable products; it offers "Mark as read", "Mark all as read" (bounded by when the list loaded) and "View all". Opening asks the adapter, which rechecks access; an item that is gone is removed with a message. Item text is forgotten when the panel closes.

**NotificationInbox** (`NotificationInbox`). The full inbox: unread or all, product filter, items grouped by `group` with their earlier updates behind a toggle, "Load more" by cursor, mark read and unread, mark all read for the filter shown, open. States as the entry. `state` and `onstate` keep the filter in the address.

**Adapter.** Both take `{ summary(), list({ state, product, cursor, limit }), read(ids | { before, product }), unread(ids), open(id) }`, shaped after `beyond-notifications/1` as the product's relay answers: `summary` → `{ unread, unavailable?, available? }`; `list` → `{ items, next, unavailable?, available? }` with items `{ id, product, title, summary?, occurred, read, group? }`; `open` → `{ destination }` or a rejection with `code: 'NOT_FOUND'`. `available: false` means the aggregation is absent or unreachable. Marking read never performs a business action.
