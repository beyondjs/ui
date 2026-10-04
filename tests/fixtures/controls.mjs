import { People } from './people.mjs';
import { Notices } from './notices.mjs';
import { inside, alone } from './family.mjs';

/**
 * Every package component that draws an icon-only control, mounted in the state that shows it: the
 * header's navigation toggle, an open dialog's close button, a toast's dismiss button, a picker's chip
 * remove buttons, help, the notification entry, an action menu shown as its glyph alone, an open side
 * sheet's close button, a status row's "More actions" (0.7.0), and the family bar for a named person, for one without an organization and while it loads (no name yet). `build(ui)` takes the DOM module;
 * `destroy()` releases everything.
 */
export class Scene {
	#ui;
	#parts = [];

	constructor(ui) {
		this.#ui = ui;
	}

	async build() {
		const ui = this.#ui;
		const keep = part => (this.#parts.push(part), part);
		const entry = keep(new ui.NotificationEntry({ adapter: new Notices().adapter, href: '/notifications' }));
		keep(new ui.Header({ brand: { label: 'Beyond', href: '/' }, nav: [{ label: 'Requests', href: '/requests' }], notifications: entry.element })).mount(document.body);
		const dialog = keep(new ui.Dialog({ title: 'Rename area' }));
		dialog.open();
		keep(new ui.Toaster()).mount(document.body).show('Saved');
		keep(new ui.Picker({ label: 'People', source: new People().source, selected: [{ id: 'p1', label: 'Ana Pérez' }, { id: 'gone', label: 'Former member', state: 'stale', reason: 'Left' }] })).mount(document.body);
		keep(new ui.Help({ topic: 'Identifier', text: 'The identifier never changes.' })).mount(document.body);
		keep(new ui.ActionMenu({ label: null, name: 'More actions', items: [{ label: 'Duplicate', run: () => {} }] })).mount(document.body);
		keep(new ui.SideSheet({ title: 'Add repositories' })).open();
		keep(new ui.StatusRow({ title: 'acme', state: { label: 'Active', tone: 'success' }, more: [{ label: 'Disconnect', run: () => {} }] })).mount(document.body);
		const brand = { src: '/brand/wordmark.svg', href: '/' };
		keep(new ui.FamilyBar({ product: 'delegate', brand, descriptor: inside, account: { signout: () => {} } })).mount(document.body);
		keep(new ui.FamilyBar({ product: 'cdn', brand, descriptor: alone, account: { signout: () => {} } })).mount(document.body);
		keep(new ui.FamilyBar({ product: 'projects', brand, descriptor: null, account: { signout: () => {} } })).mount(document.body);
		return this;
	}

	destroy() {
		for (const part of this.#parts.reverse()) part.destroy();
		this.#parts = [];
	}
}
