# Release 0.4.0 — 3 October 2026

A minor release of `@beyond-js/ui` over 0.3.2: the family navigation round of the suite's Delegate family navigation review of 2026-10-02 and the owner's answers of 2026-10-03 (Q22 option a, D03, Accounts in the profile menu, the header edge as a line), refined by the usability consultation of the same day and the shared contract the implementation agents worked to. The token set is unchanged (0.2.0). Every 0.3.x option keeps working, and a 0.3.x descriptor still draws today's links. Nothing is published, and no consumer was re-vendored here: each product adopts 0.4.0 in its own assignment.

| Change | Where |
| --- | --- |
| The project menu is each product's standard project chooser, also outside a project ("Choose a project"): heading, search past 8 rows (accent- and case-insensitive, "No projects match" with a link to the product's page), the product's `notice`, rows with the current first and then by collation, "Only in {product}", "Project overview" and "All projects of {organization}" at `fallback.links.projects` | `src/dom/family/projects.js`, `search.js`, `location.js` |
| Row states from `projects[i].here` (Projects' `mapped` and `url`; `state` written by the product: `used`, `unset`, `denied`, `only`), as text at the row's end and in its name | `projects.js`, `places.js` |
| Organizations: one is a name, several a menu with roles; a row goes to `organizations[i].url` (the product's arrival) or to Projects with "Opens in Beyond Projects"; `fallback.organizations` drives it without a descriptor | `organizations.js` |
| The switcher lists products only (never `projects` or `accounts`, except the bar's own product); `UNCONFIGURED` reads "Not offered here" | `switcher.js`, `labels.js` |
| The profile menu: the person, the account group, the organization group by role, the product's group, Docs, Sign out; `links.manage` completed with `product` and `return` (transient parameters removed, `returned=accounts` added) each time it opens; the earlier links without `manage` | `account.js`, `manage.js` |
| Menu rows: disabled, muted (4.5:1), focusable unavailable rows without hover; hover and pointer only on rows that go somewhere; focus painted only for the keyboard (a pointer opens on the panel); every menu closes when focus leaves it, also in engines that report no new target | `menu.js`, `navigation.css` |
| The edge: a 1 px border in `--color-border` under the bar; no token change | `family.css` |
| One optical axis (`--bui-family-axis`, the wordmark letters' centre) for the bar's texts and icons, boxes and targets unchanged; the product's divider stands before its button and both names start one button padding after their dividers | `family.css`, `family-narrow.css` |
| `Sidebar` (DOM and React): permanent above the product's cut, a sticky 44 px product row and a native modal drawer below it (inert page, scroll lock, scrim strip, focus on the current item cycling inside, Escape, scrim and Close returning focus, a destination leaving focus to the product, a 200 ms slide or none under reduced motion, closed at once when the cut is crossed, no history entry), laid out by `.bui-shell` | `src/dom/sidebar/`, `src/styles/sidebar.css`, `src/react/family.js` |
| The notification panel sets its own text roles; an empty inbox is one quiet line without "View all"; unavailable offers "Try again"; the loading indicator shows only after `NotificationEntry.delay` (250 ms) and never after the answer; `aria-busy` while loading; the height change is animated except under reduced motion; a late answer after Escape is discarded | `src/dom/notifications/entry.js`, `panel.js`, `header.css`, `notices.css` |

The delay of 250 ms: the review measured a one-frame indicator for an immediate answer and a 900 ms wait; the fixture relay answers in about 80 ms, so a quick answer never shows it. The real inbox read's p50 and p95 in the selector's composition were not measured here; a product that finds them close to the delay can set `NotificationEntry.delay`.

## Checks

| Check | Result |
| --- | --- |
| `npm test` (with `family-projects`, `family-profile`, `sidebar` and `notifications-panel`: the descriptor with and without the new fields, an older descriptor, fallback organizations, states, the search threshold at exactly 8 and 9 rows, return completion with transient parameters stripped, the disclosure closing on focus out, the drawer's focus trap, inert, Escape, scrim and resize, the reduced-motion rule, and the panel's empty, unavailable, slow and late states; on React 19 and 18) | 188 of 188 |
| `npm run types` (`Sidebar`, `notice`, `transient`, `FamilyHere`, `FamilyManage` and `fallback.organizations` in both typed consumers) | No diagnostics |
| `npm run acceptance` (with `checks/navigation.mjs`, `checks/sidebar.mjs`, the notification panel check, the bar at 360 px, and the ink measurement of `support/ink.mjs`: texts and icons within 0.75 px of the letters' axis and equal divider-to-text distances at 1440, 1024, 390, 360 and 320 px in both themes) | 123 of 123 in Chrome 154, Firefox 155 and WebKit 26.6, run one after another |

WebKit, like Safari by default, tabs only to fields, so the profile check tabs out with Option+Tab there, and the drawer cycles focus itself rather than relying on the engine's Tab order. A pass is package evidence only: no product has adopted 0.4.0, and the selector's composition was not run.

## Family reference synchronization

Pending in the suite's branding round of 2026-10-03: the reference's bar (project menu outside a project, row states, organizations in the product, products-only switcher, grouped profile menu, edge line), the shared `Sidebar` with its product row and drawer, and the notification panel's states, with the component catalog's consumers once products adopt 0.4.0.
