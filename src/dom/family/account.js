import { Component } from '../core/component.js';
import { el } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { NavigationMenu, entry } from './menu.js';

/**
 * The profile menu at the end of the family bar: a disclosure of links in groups.
 *
 * 1. The person: name and email, a heading.
 * 2. The account: "Account and sign-in" and "Your organizations" ("Create an organization" for a
 *    person with none), at Accounts.
 * 3. The organization in view, headed "{organization} · {role}": "Members and invitations" and, when
 *    Accounts gives it (owners and administrators), "Organization settings".
 * 4. The product's own entries (`account.items`), headed by the product's name.
 * 5. Docs, on narrow screens, and Sign out, set apart.
 *
 * Accounts' addresses (`links.manage`) are completed with the product and the way back each time the
 * menu opens (`Manage`). Without them the menu offers the earlier "Your account" and "Members of
 * this organization" (`links.account`, `links.members`). Sign out is always offered, also while the
 * descriptor loads or is unavailable, so the bar never keeps a person in; the product owns what it
 * does (`signout` is a callback or `{ href }`, and `label` rewords it).
 */
export class AccountMenu extends Component {
	#menu;
	#manage;

	/**
	 * @param {object} options
	 * @param {{name?: string, email?: string}|null} options.person
	 * @param {{account?: string, members?: string, docs?: string}} options.links
	 * @param {import('./manage.js').Manage} options.manage
	 * @param {{name: string, role?: string|null}|null} options.organization the organization in view
	 * @param {boolean} options.any whether the person has any organization
	 * @param {string} options.product the product's display name
	 * @param {{signout?: (() => void)|{href: string}|null, items?: Array<{label: string, href?: string, run?: () => void}>, label?: string|null}} options.account
	 * @param {import('../core/labels.js').Labels} options.labels
	 */
	constructor({ person, links, manage, organization, any, product, account, labels }) {
		super();
		this.#manage = manage;
		const name = person?.name ?? null;
		const { signout = null, items = [], label = null } = account;
		const own = items.filter(Boolean).map(item => entry({ label: item.label, href: item.href ?? null, run: item.href ? null : (item.run ?? null) }));
		const heading = person ? el('span', { class: 'bui-family-person' }, [el('span', { class: 'bui-family-name', text: name ?? '' }), person.email ? el('span', { class: 'bui-family-email', text: person.email }) : null]) : null;
		const groups = manage.present ? this.#groups({ organization, any, labels }) : AccountMenu.#earlier({ links, organization, labels });
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
				signout ? { items: [AccountMenu.#signout(signout, label ?? labels.text('signout'))], class: 'bui-family-group bui-family-leave' } : null
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

	destroy() {
		this.#menu.destroy();
		super.destroy();
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

	static #signout(signout, label) {
		if (typeof signout === 'function') return entry({ label, run: () => signout(), class: 'bui-family-signout' });
		return entry({ label, href: signout.href, class: 'bui-family-signout' });
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
