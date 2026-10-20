# Product navigation

`Sidebar` keeps one source of navigation for its desktop presentation and mobile drawer. The standard labeled sidebar remains the default. An adopting product may opt into the desktop rail introduced in UI 0.18.0.

## Desktop rail

```js
const sidebar = new Sidebar({
	product: 'Conduict',
	groups: [
		{ items: [{ key: 'home', label: 'Home', href: '/home', glyph: 'home' }] },
		{ kind: 'object', key: 'conversations', heading: 'Conversations', glyph: 'chat', groups: [] }
	],
	rail: { panel: 'conversations', open: false, order: ['home', 'conversations'], onchange: open => remember(open) }
});
```

The rail presents the existing section items. `glyph` selects a named icon from the shared catalog; the control keeps its accessible label and shared tooltip. A short `meta` is shown on the icon and included in its accessible name; a longer note uses a mark and keeps its words in that name and tooltip. Products decide which counts or states matter there. `settings` is the settings glyph; `more` remains the overflow action.

`rail.panel` selects one `kind: 'object'` group by its key. Without a group `href`, its rail button toggles the contextual panel with `aria-controls` and `aria-expanded`. With `href`, the object is a normal destination link; `current` sets its `aria-current`. The product owns route selection and panel visibility. Its heading and collapse control occupy the first row. The existing action and search occupy a second row, so the object name keeps its words. The panel omits the desktop context block and the main sections; the family bar already identifies the organization and project. A missing object produces no panel or toggle. The rail's optional `order` changes only the desktop order, using section item keys and the object key.

`open` defaults to true. The component updates it when the person toggles or collapses the panel, then calls `onchange(open)`. Setters, group updates and resizing never call that callback. A product decides whether visibility is route-owned or a persisted preference. Replacing `sidebar.rail` updates its options in place; null restores the standard sidebar. React uses the same `rail` prop with `onChange` instead of `onchange`, read from the latest props.

The default cut remains 1024 px. Below it, the full navigation uses the existing modal drawer, with all sections, object actions, search and context. `sidebar.merge(bar)` and React's `merge` keep one hamburger in the family bar. Desktop collapse does not hide the drawer's contents. Crossing the cut closes an open drawer and moves focus to the desktop navigation.

Collapsing returns focus to the object toggle or destination link. If that object disappears while its panel holds focus, focus returns to an existing current or first rail destination. Data updates patch rail controls by key. A keyboard search opens its contextual panel first. No motion is added to data updates or the layout.

Keep information needed independently of the contextual panel, such as a machine's state or spending estimate, in an always-visible work region. An optional conversation panel is not an appropriate sole location for that information.

## Header product choices

The family bar's product menu is headed **Products** (**Productos**). Inside a project, each row names its product without repeating the project already named in the bar. Outside a project, the short product-area descriptions remain. Availability, reasons, advisory links and project destinations are unchanged. A check marks the current product; a neutral selection replaces the leading accent stripe in this menu.

Product-menu text starts at the same inset as its heading. The panel has one outer gutter and each row one inner gutter. The heading has balanced space before the first choice. On wide bars the product and location controls keep space beside their separators; narrow controls retain their existing fit rules.

## Validation and scope

Unit and typed-consumer fixtures cover both DOM and React APIs. The installed-package `rail navigation` acceptance checks desktop keys, focus retention and recovery, the mobile merged drawer, project-menu content, text alignment and viewport fit in Chrome, Firefox and WebKit. These fixtures establish shared-package behavior only. Each product verifies its routes, context, domain states and adoption separately.

## Typography and recovery

The Products title, notification title and account identity use the body title role at medium weight. Menu rows use the small regular role; section labels use the muted label role. The profile email, membership role, unread notification mark and availability reasons retain their meaning. Shared inset spacing aligns titles and rows without repeating the context.

`Unavailable` uses a compact status icon beside its heading. Its reason, responsible person and actions align below the heading. The heading uses the second title role; the body uses the regular body role. Both retain the text contrast, while the owner label and technical details stay quieter. The heading level remains the caller's semantic choice. Consumers must scope their own heading styles rather than override shared heading classes through broad descendant selectors.

The installed `shared hierarchy` checks verify these roles and geometry in both themes at 1440, 390 and 320 px. Rail checks also verify Floating tooltips on hover and keyboard focus, English and Spanish contextual headings, and destination links.


## Notification relay outages

The notification panel and full inbox use the shared warning tone when Accounts or Projects does not answer. They show the last attempt and read again on `Again`'s schedule. Closing the panel or destroying the inbox stops its retries; late answers never restore private text. The manual retry remains available. A missing connection or rejected access keeps its stated cause and is not retried as an outage. Public DOM and React APIs and token set 0.6.0 are unchanged in 0.18.3.
