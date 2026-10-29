# Global navigation and contextual work

`Sidebar` owns the global hamburger, destination presentation, desktop preference
and mobile drawer. Products supply authorized groups, glyphs, current routes and
navigation callbacks. The component never grants access, changes a route on
collapse, or stores an organization, person, project or selected destination.

The implementation extends the existing Sidebar API. `navigation` is opt-in;
without it, existing labeled sidebars and `rail` callers retain their behavior.
The suite's coordinated adoption supplies it to applicable signed-in surfaces.

## DOM and React

```js
const sidebar = new Sidebar({
  product: 'Accounts',
  navigation: { key: 'accounts' },
  groups: [{ heading: 'Organization', items: [
    { key: 'team', label: 'Team', href: '/team', glyph: 'people', current: true }
  ] }],
  onnavigate: (item, event) => router.open(item.href)
});
```

React accepts the same `navigation` object, with `onChange` instead of `onchange`.
It reads the latest callback and does not require a memoized object. Omit
`collapsed` for an uncontrolled preference. Give it only when the product controls
that state and updates it from `onChange`. DOM callers can inspect or set
`sidebar.collapsed` and replace `sidebar.navigation` without rebuilding routes.

Use stable, untranslated keys such as `accounts`, `projects` or `conduict`.
The optional storage adapter has `getItem(key)` and `setItem(key, value)`;
`storage: null` keeps memory only. The default is this origin's `localStorage`.
The versioned key is `bui-sidebar-navigation:v1:<key>`, with `expanded` or
`collapsed` as its only value. First visit, absent or corrupt data means expanded.
A blocked store keeps the choice in the current Sidebar. No cross-origin or
cross-device synchronization is implied. The mobile drawer never writes this
preference. The existing object-group fold preferences keep their own keys.

## Complete navigation in one pane

With `navigation` and no explicit `rail`, the expanded view keeps the complete
original navigation: context, top action, search, section groups, object groups,
folds, counts, waiting states and more links. Section icons accompany full labels.
Collapse exposes direct section links with accessible names and shared hints.
An object's named control expands the original pane, retaining its content.
No second contextual column is invented for products such as Beyond Home.

Selection remains `aria-current="page"`, separate from hover and keyboard focus.
The expanded inline pane is the only named global navigation landmark. Its rail
destinations use native hidden state; collapsing exposes those destinations and
makes the rail the global landmark. A separate context keeps its object's name.
Collapse changes presentation only. Keyed updates preserve links and focus.
Products still own Back/Forward, route/query state and permission filtering;
never give the Sidebar a destination or resource name the person may not see.

## A separate conversation context

Existing callers with `rail: { panel, open, onchange, order, foot }` retain that
context contract. Adding `navigation` gives the global destinations their own
expanded/collapsed presentation. The contextual panel's `open` state is independent
from `collapsed`; its close control does not collapse global navigation, and the
global hamburger does not close context, leave a thread or discard a draft.

The selected object group stays in the contextual panel rather than appearing a
second time in global navigation. Its destination or toggle keeps its existing
semantics. `rail.foot` still opens the product's own object details. Domain callers
remain responsible for choosing the contextual group and retaining its visibility
appropriately across routes. The mobile drawer contains the full authorized
navigation and object content once; there is no second global rail on mobile.

## Keyboard, touch and resizing

The desktop hamburger exposes `aria-controls`, `aria-expanded` and a localized
name. It retains focus while switching presentation. Collapsed controls expose
names on keyboard focus, hover and touch through `Hint` and `Floating`.
Below the family cut, `sidebar.merge(bar)` retains the one family-bar button.
The existing native modal drawer traps Tab, makes the page inert, locks scroll
and returns focus on Escape or outside dismissal. A chosen destination closes it
without restoring the trigger; the product's navigation callback focuses the new
page. Resize closes an open drawer and moves focus to the visible destination.
A desktop-to-mobile resize moves sidebar focus to the visible opening control.
The existing reduced-motion and interrupted contextual-motion behavior remains.

## Verification

- `tests/sidebar-navigation.test.mjs`: defaults and persistence, exact storage
  scope, blocked/corrupt storage, independent context, inline objects, icons and
  mobile choice preservation.
- `tests/react-sidebar-rail.test.mjs`: StrictMode, stable controls, latest handlers,
  controlled and uncontrolled global state alongside the legacy contextual rail.
- `acceptance/checks/sidebar-navigation.mjs`, included by the `sidebar` checks:
  installed DOM, React 19 and React 18 consumers, inline and contextual layouts,
  both themes, 1440/1024/1023/768/390/320 px, keyed updates, selection versus hover,
  focus hints, reload, mobile focus trapping/return and destination focus. Run
  `node acceptance/run.mjs 'global navigation:'` in each supported engine, through
  the suite's test queue when working in the suite.

These component harnesses verify the package contract. Each product must separately
verify its installed artifact, routes, permissions, context and work continuity.
They do not establish provider operations, product integration or owner acceptance.
