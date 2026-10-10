# Release 0.13.0 — 9 October 2026

The owner asked for the family bar, its notification panel and its profile menu to be improved until
"every detail counts": perfect symmetry, no visual flaw, functional, modern, minimalist and practical.
The analysis measured Conduict's bar in Chrome at 1512 and 390 px in both themes, with an independent
review by the family's usability role; the owner approved every finding and the four proposals it
needed, recorded in the family reference as D78–D81 (settled contract S28). 0.13.0 implements the
package's part.

## What the measurement found

| Finding | Measured in Conduict on 0.12.0 |
| --- | --- |
| The count against the avatar | "27" ended 2 px from the avatar's button at 1512 px and over the avatar at 390 px |
| Two oranges side by side (light theme) | The count in `--color-action` (#9e533e, about 2.9:1 on the navy bar, below 3:1 for a graphic), the avatar in `--color-family-marker` (#e46f4e) |
| Panels over the bar's edge | Both opened at y = 42 against the bar's edge at 44 |
| Two panel geometries | Notifications 384 px wide with 12 px padding, ending at the bell (1434); the profile menu 256 px with 8 px, ending at the avatar (1496); at 390 px one spanned the bar and the other did not |
| Two baselines | The organization's name (text) and "Choose a project" (a button) 0.57 px apart |
| Two "current" marks | The current product row on a brown surface (#2c1a17 in dark) unlike the sidebar's current section |
| Two formulas for one rule | The lockup's divider in `currentColor` at 45%, the location's in `--color-family-muted` at 0.5 opacity |
| No lift in dark | The menu elevation at 8% black cast nothing on the navy page |
| The notification rows | Every title in the link color, an underlined "Mark as read" under every row (about 76 px per item), one matter repeated three times, the third row cut by the body with no sign of more, no arrow keys |
| The profile menu's head | A handle in muted label type, no email, no avatar |

## What changes

| Part | 0.13.0 |
| --- | --- |
| The bar's end (D78) | Docs, the bell and the avatar 19 px apart from ink to ink at 1440 px; the bell and the avatar two round targets of one size; no chevron on the avatar, whose name ("Account: {name}") shows as a tooltip |
| The count (D78, D80) | On the bell's glyph (`.bui-bell`), in the family marker with the bar's color, ringed in the bar's color by an outline (a mark, not an elevation), tabular figures, its right edge inside the bell's target; at least 4 px clear of the avatar at every width |
| The end's panels (D78) | One width (`--bui-family-panel`, 22.5rem, or the viewport less the bar's padding on each side), ending at the bar's padding (`--bui-family-gutter`), 8 px padding; every panel of the bar opens 4 px below its edge and stops `2 × --space-4` above the viewport's end |
| The profile menu (D78, D81) | Its head: a 40 px avatar beside the name (body, 500) and the email (small, muted). The organization's heading: its name with the role quiet at its end, still read "{organization} · {role}". `Avatar` (internal) lays `person.avatar` (an `https:` or image `data:` address, no referrer) over the initials and removes it when it fails |
| The location | "Choose a project" muted and regular until pointed at or open; a name shown as text on the menu buttons' line box (one baseline); the location's divider drawn as the lockup's |
| Menus | The current row marked as the sidebar's current section (sunken surface, accent at the leading edge, link color); a product's unavailability as the row's quiet state, the advisory one in `--color-warning` |
| Notification rows (D79) | The title in the text color (500 while unread), the summary muted, "{product} · {age}" in `Age`'s short words with the full moment as the `<time>`'s title; the whole row opens the item (the title's button stretched over it); "Mark as read" quiet at the end of that line, shown on hover and focus-within and always where nothing hovers, a 24 px target on a pointer (the crumbs' technique) and the family target on touch; groups keyed by product and `group` |
| The panel (D79) | One row per matter (`grouped`, `limit` counting matters, read from three times as many items); "Today" and "Earlier" when both; "You are all caught up." with nothing unread; the head holds the title (body size) and "Mark all as read"; "View all notifications" is the last row; the body fades at its lower edge exactly while more is below, decided after its height eases; keyboard opening on the first row, arrows, Home and End |
| The inbox | The same rows, with "Today" and "Earlier" |
| Token set 0.4.2 | `--elevation-menu` has a dark value: `0 12px 28px -6px rgba(0, 0, 0, .5), 0 4px 10px 0 rgba(0, 0, 0, .32)` |
| Copy | `today` "Today" / «Hoy», `earlier` "Earlier" / «Anteriores»; `caught` is now drawn by the panel |
| Types | `person.avatar` in `FamilyDescriptor` and `FamilyFallback` |
| Stylesheets | The notification entry and panel moved from `header.css` to `notify.css` (after `header` in the build order), keeping each sheet under 300 lines; `moment.js` is gone (the rows use `Age`) |

A product changes nothing to adopt it: it re-vendors 0.13.0. The count's meaning (matters) is Beyond
Projects' answer since the same day; a product relay passes it unchanged.

## Choices and deviations

- **Mark as read keeps its words.** An icon-only row action would extend D11's closed list; the review recommended against it. It is quiet instead: hidden until the row is pointed at or holds focus, and always shown where nothing hovers.
- **The ring is an outline.** A box-shadow ring would read as elevation to `foundations.test.mjs` (D10); an outline in the bar's color is a mark.
- **Narrow widths keep their room.** Below 480 px on a pointer the avatar's target is the avatar itself (28 px) with 2 px before it, and the count sits 2 px further over the bell, so the end is as wide as in 0.12.0 and the phones' layout checks (320 px with a sidebar toggle and the family's longest names) still pass.
- **The picture is approved but not yet delivered.** Beyond Accounts does not disclose a picture and every product's content policy allows images from its own origin only, so `person.avatar` is drawn when given and otherwise the initials stand; D81's remaining work belongs to Accounts and Projects with the privacy guide.

## Verification

| Check | Result |
| --- | --- |
| `npm test` (unit, happy-dom) | 494 passing: the profile menu's head, role, missing chevron and picture (with its failure and refused addresses), the avatar's tooltip, the product menu's states, one row per matter, the keyboard path, "Today"/"Earlier", "Mark all as read" in the head and "You are all caught up."; the 0.4.2 token sheet |
| `npm run types` | Passing, with `person.avatar` |
| `npm run acceptance` | 262 of 262 checks in Chrome 154, Firefox 155 and WebKit 26.6, each engine run whole on the packed 0.13.0; `ending.mjs` (new) measures the end's gaps, the count's place and color and both panels' edge, width and gap at 1440 and 390 px in both themes, and the rows' color, whole-row target, quiet mark and fade |

Not established: the bar on a touch device (the coarse-pointer rules are measured in Chrome's
emulation only), and adoption in each product, which each product records in its own assignment.
