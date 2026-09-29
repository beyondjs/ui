import { Component } from '../core/component.js';
import { el } from '../core/element.js';
import { icon } from '../core/icons.js';
import { NavigationMenu, entry } from './menu.js';

/**
 * The account menu at the end of the family bar: the person's initials, their name and email as the
 * heading, "Your account" and "Members of this organization" (addresses from the descriptor), the
 * product's own entries, the Docs link on narrow screens, then Sign out.
 *
 * Sign out is always offered, also while the descriptor loads or is unavailable, so the bar never
 * keeps a person in. The product owns what signing out does: `signout` is a callback or `{ href }`,
 * and `label` replaces its wording for a product that asks how to leave.
 */
export class AccountMenu extends Component {
	#menu;

	/**
	 * @param {object} options
	 * @param {{name?: string, email?: string}|null} options.person
	 * @param {{account?: string, members?: string, docs?: string}} options.links
	 * @param {boolean} options.organization whether an organization is in view (members link)
	 * @param {{signout?: (() => void)|{href: string}|null, items?: Array<{label: string, href?: string, run?: () => void}>, label?: string|null}} options.account
	 * @param {import('../core/labels.js').Labels} options.labels
	 */
	constructor({ person, links, organization, account, labels }) {
		super();
		const name = person?.name ?? null;
		const { signout = null, items = [], label = null } = account;
		this.#menu = new NavigationMenu({
			label: AccountMenu.#avatar(name),
			name: name ? labels.text('account', { name }) : labels.text('anonymous'),
			align: 'end',
			part: 'account',
			class: 'bui-family-account',
			sections: [
				{
					heading: person ? el('span', { class: 'bui-family-person' }, [el('span', { class: 'bui-family-name', text: name ?? '' }), person.email ? el('span', { class: 'bui-family-email', text: person.email }) : null]) : null,
					items: [
						links.account ? entry({ label: labels.text('yours'), href: links.account }) : null,
						links.members && organization ? entry({ label: labels.text('members'), href: links.members }) : null,
						...items.filter(Boolean).map(item => entry({ label: item.label, href: item.href ?? null, run: item.href ? null : (item.run ?? null) })),
						links.docs ? entry({ label: labels.text('docs'), href: links.docs, class: 'bui-family-docs-item' }) : null,
						signout ? AccountMenu.#signout(signout, label ?? labels.text('signout')) : null
					]
				}
			]
		});
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
		return el('span', { class: 'bui-family-avatar', 'aria-hidden': 'true' }, [initials || icon('user')]);
	}
}
