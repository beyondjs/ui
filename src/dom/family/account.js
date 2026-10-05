import { Component } from '../core/component.js';
import { el } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { NavigationMenu, entry } from './menu.js';
import { Leave } from './leave.js';
import { PreferencesDialog } from '../preferences/dialog.js';

/**
 * The profile menu at the end of the family bar: a disclosure of links in groups.
 *
 * 1. The person: name and email, a heading.
 * 2. The account: "Account and sign-in" and "Your organizations" ("Create an organization" for a
 *    person with none), at Accounts.
 * 3. The organization in view, headed "{organization} · {role}": "Members and invitations" and, when
 *    Accounts gives it (owners and administrators), "Organization settings"; then "GitHub" for every
 *    member when the descriptor carries `links.github` (D51 amending D48, since 0.7.4): Projects'
 *    GitHub section of that organization, an absolute address followed as given.
 * 4. The product's own entries, headed by the product's name: "Language and appearance" first when
 *    the product passes `account.preferences` (D54: one `PreferencesDialog` with "Change for all of
 *    Beyond"), then `account.items`.
 * 5. Docs, on narrow screens, and Sign out, set apart.
 *
 * Accounts' addresses (`links.manage`) are completed with the product and the way back each time the
 * menu opens (`Manage`). Without them the menu offers the earlier "Your account" and "Members of
 * this organization" (`links.account`, `links.members`). Sign out is always offered, last and apart
 * (D48), also while the descriptor loads or is unavailable, so the bar never keeps a person in. Since
 * 0.5.0 it reads "Sign out of Beyond" (Q09) and its supported form is `signout: { end, before?,
 * after? }` (`Leave`): the product ends its own session and the bar goes to Accounts' `/leave`. The
 * earlier forms, a callback or `{ href }`, still work, and `label` rewords it.
 */
export class AccountMenu extends Component {
	#menu;
	#manage;
	#leave = null;
	#preferences = null;

	/**
	 * @param {object} options
	 * @param {{name?: string, email?: string}|null} options.person
	 * @param {{account?: string, members?: string, docs?: string}} options.links
	 * @param {import('./manage.js').Manage} options.manage
	 * @param {{name: string, role?: string|null}|null} options.organization the organization in view
	 * @param {boolean} options.any whether the person has any organization
	 * @param {string} options.product the product's display name
	 * @param {string} options.id the product's id, which Accounts' `/leave` receives
	 * @param {{signout?: (() => void)|{href: string}|{end?: () => unknown, before?: () => boolean|Promise<boolean>, after?: () => void, bound?: number}|null, items?: Array<{label: string, href?: string, run?: () => void}>, label?: string|null, preferences?: {preferences: import('../preferences/preferences.js').Preferences, everywhere?: string|null, locales?: string[]}|null}} options.account
	 * @param {import('../core/labels.js').Labels} options.labels
	 */
	constructor({ person, links, manage, organization, any, product, id, account, labels }) {
		super();
		this.#manage = manage;
		const name = person?.name ?? null;
		const { signout = null, items = [], label = null, preferences = null } = account;
		const own = items.filter(Boolean).map(item => entry({ label: item.label, href: item.href ?? null, run: item.href ? null : (item.run ?? null) }));
		if (preferences) {
			// "Change for all of Beyond" is the product's own address (a string, or a function asked at each
			// opening, for a product that routes itself); without one, Accounts' account page from the
			// descriptor, completed with the page in view as the account group's links are
			const given = preferences.everywhere;
			const everywhere = () => (typeof given === 'function' ? given() : given) ?? (manage.has('account') ? manage.address('account', this.#menu?.element.ownerDocument.defaultView?.location) : null);
			this.#preferences = new PreferencesDialog({ ...preferences, everywhere });
			own.unshift(entry({ label: labels.text('preferences'), run: () => this.#open(), class: 'bui-family-preferences' }));
		}
		const heading = person ? el('span', { class: 'bui-family-person' }, [el('span', { class: 'bui-family-name', text: name ?? '' }), person.email ? el('span', { class: 'bui-family-email', text: person.email }) : null]) : null;
		const groups = manage.present ? this.#groups({ organization, any, labels }) : AccountMenu.#earlier({ links, organization, labels });
		// Projects' GitHub section, for every member and only with an organization in view (PRJ-14)
		if (organization && links.github) groups.organization.push(entry({ label: labels.text('github'), href: links.github, class: 'bui-family-github' }));
		this.#menu = new NavigationMenu({
			label: AccountMenu.#avatar(name),
			name: name ? labels.text('account', { name }) : labels.text('anonymous'),
			align: 'end',
			part: 'account',
			// Without a name the avatar is a person glyph alone (D11).
			hint: !name,
			class: 'bui-family-account',
			onchange: open => open && this.#complete(),
			sections: [
				{ heading, items: groups.account, class: 'bui-family-group' },
				groups.organization.length ? { heading: AccountMenu.#title(organization, labels), items: groups.organization, class: 'bui-family-group' } : null,
				own.length ? { heading: product, items: own, class: 'bui-family-group' } : null,
				links.docs ? { items: [entry({ label: labels.text('docs'), href: links.docs, class: 'bui-family-docs-item' })], class: 'bui-family-group bui-family-docs-group' } : null,
				signout ? { items: [this.#signout(signout, { label: label ?? labels.text('signout'), address: links.leave ?? null, id, labels })], class: 'bui-family-group bui-family-leave' } : null
			]
		});
		this.#complete();
	}

	get element() {
		return this.#menu.element;
	}

	get menu() {
		return this.#menu;
	}

	/** The sign-out of Beyond (`Leave`) for the `{ end }` form, or null for the earlier forms. */
	get leave() {
		return this.#leave;
	}

	/** The "Language and appearance" dialog, when the product passed `account.preferences`. */
	get preferences() {
		return this.#preferences;
	}

	destroy() {
		// An open dialog outlives the menu (the bar drawn again when its labels change) until it closes
		this.#preferences?.leave();
		this.#menu.destroy();
		super.destroy();
	}

	/** Closes the menu and opens the dialog, which returns focus to the menu's button. */
	#open() {
		this.#menu.close(true);
		const document = this.#menu.element.ownerDocument;
		void this.#preferences.open({ restore: () => (this.#menu.button.isConnected ? this.#menu.button : document.querySelector('.bui-family-account > .bui-navmenu-button')) });
	}

	/** Accounts' entries, each completed with the product and the way back when the menu opens. */
	#groups({ organization, any, labels }) {
		const manage = this.#manage;
		const link = (key, text) => {
			if (!manage.has(key)) return null;
			const node = entry({ label: labels.text(text), href: manage.address(key) ?? '#' });
			node.dataset.manage = key;
			return node;
		};
		const create = !any && manage.has('create');
		return {
			account: [link('account', 'access'), create ? link('create', 'create') : link('organizations', 'mine')].filter(Boolean),
			organization: organization ? [link('members', 'team'), link('settings', 'settings')].filter(Boolean) : []
		};
	}

	/** Without `links.manage`: the earlier account and members links. */
	static #earlier({ links, organization, labels }) {
		return {
			account: [links.account ? entry({ label: labels.text('yours'), href: links.account }) : null].filter(Boolean),
			organization: [links.members && organization ? entry({ label: labels.text('members'), href: links.members }) : null].filter(Boolean)
		};
	}

	/** Sets each Accounts address for the page the person is on now. */
	#complete() {
		const view = this.#menu?.element.ownerDocument.defaultView ?? globalThis;
		for (const node of this.#menu?.panel.querySelectorAll('a[data-manage]') ?? []) {
			const address = this.#manage.address(node.dataset.manage, view.location);
			if (address) node.setAttribute('href', address);
		}
	}

	/** "{organization} · {role}", or the name alone when the role is unknown. */
	static #title(organization, labels) {
		if (!organization?.role) return organization?.name ?? null;
		return labels.text('group', { organization: organization.name, role: labels.text('role', { role: organization.role }) });
	}

	/** A callback, a link (`{ href }`), or the sign-out of Beyond (`{ end, before, after }`). */
	#signout(signout, { label, address, id, labels }) {
		if (typeof signout === 'function') return entry({ label, run: () => signout(), class: 'bui-family-signout' });
		if (typeof signout.href === 'string') return entry({ label, href: signout.href, class: 'bui-family-signout' });
		this.#leave = new Leave({ signout, address, manage: this.#manage, product: id, label, labels, onfinish: () => this.#menu?.close(true) });
		return this.#leave.element;
	}

	/** Initials of the name (up to two), or a person glyph when no name is known. */
	static #avatar(name) {
		const initials = (name ?? '')
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map(word => word[0].toUpperCase())
			.join('');
		return el('span', { class: 'bui-family-avatar', 'aria-hidden': 'true' }, [initials || glyph('user')]);
	}
}
