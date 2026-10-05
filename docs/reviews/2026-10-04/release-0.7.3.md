# Release 0.7.3 — 4 October 2026

A patch release of `@beyond-js/ui` over [0.7.2](release-0.7.2.md), asked for by the suite's coordinating session after six products adopted 0.7.2's shared sets. Both changes are copy only. The token set is unchanged (0.3.0). Nothing is published; consumers vendor the tarball.

## What changed

| Request | Change | Where |
| --- | --- | --- |
| The family bar's Spanish role names were the outlier | `FamilyBar.labels.es` names the roles as Beyond Accounts, which owns them, and Projects do: «Desarrollador» and «Lector» instead of «Desarrollo» and «Lectura», person nouns like «Propietario», «Administrador» and «Miembro». The English set already matched Accounts' (Owner, Administrator, Developer, Viewer) and is unchanged | `src/dom/family/labels.js`, the component catalog's Spanish set in `docs/components.md`, the React acceptance fixture's own Spanish set |
| `NotificationEntry.labels.en.updates` had no singular | "1 update", "2 updates"; Spanish already said «1 novedad». A group always holds two or more notices, so "1 updates" could not be seen; the label is correct for any count now | `src/dom/notifications/labels.js` |

The other English count labels were read for the same gap and have none: `Collection`'s `columns`, `Picker`'s `attention` and `shown` choose the singular, `Picker`'s "{count} selected", `NotificationEntry`'s button ("Notifications, 1 unread") and the unit abbreviations of the long-operation components ("1 min") read the same for one.

## Checks

| Check | Result |
| --- | --- |
| `npm test` (`spanish.test.mjs` adds the roles in both languages and `updates` for 1, 2 and 12 in both) | 291 of 291 |
| `npm run types` | No diagnostics |
| `npm run acceptance` | 163 of 163 in Chrome 154, Firefox 155 and WebKit 26.6 each |

Tarball: `beyond-ui-0.7.3.tgz`, `sha512-4LmsAUZIR03+6Ko5JToE9mN0fRGL5YH860HBHFreSF0Ugeu5QHknqTFRyW94RBp3i7AXjGgBIEUactUoolXRIg==`.

## Consumers

A product that passes `FamilyBar.labels.es` shows the new role names with no change of its own. Accounts' and Projects' own screens already use them.

## Family reference synchronization

Synchronized in the suite's family reference with the vendored 0.7.3 tarball and the component catalog's Spanish role names, recorded with the suite commit that vendors it.
