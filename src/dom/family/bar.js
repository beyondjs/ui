import { Component } from '../core/component.js';
import { el } from '../core/element.js';
import { icon } from '../core/icons.js';
import { Labels } from '../core/labels.js';
import { Header } from '../header.js';
import { defaults, names } from './labels.js';
import { Places } from './places.js';
import { ProductSwitcher } from './switcher.js';
import { Location } from './location.js';
import { AccountMenu } from './account.js';

/**
 * The family bar: the one bar every signed-in Beyond product renders (decisions D01 and D04).
 *
 * It is the shared `Header` with the family's content: the wordmark (a link home) and the product
 * name drawn as the family lockup, which is the product switcher; then the organization and project
 * menus; then Docs, the product's notification entry and the account menu. It renders the
 * `beyond-family/1` descriptor the product relays from Beyond Projects, and it is identical in
 * every product: a product's own navigation belongs in its sidebar or in `ProductNav`, never here.
 *
 * It never blocks a page: `descriptor: null` is still loading (the lockup and placeholders show,
 * without menus), and `{ unavailable: true }` shows the names the product passed as `fallback`
 * with a single Projects link in the product menu. It places links and decides nothing about access.
 */
export class FamilyBar extends Component {
	#header;
	#options;
	#labels;
	#names;
	#descriptor;
	#fallback;
	#start;
	#thread;
	#end;
	#parts = [];

	/**
	 * @param {object} options
	 * @param {string} options.product the current product id (`delegate`, `workspace`, …)
	 * @param {{src: string, href: string}} options.brand the wordmark asset the product carries and its own home address
	 * @param {object|null} [options.descriptor] the `beyond-family/1` descriptor, null while loading, `{ unavailable: true }` when it failed
	 * @param {{person?: string|{name: string, email?: string}, organization?: string, project?: string}} [options.fallback] names the product knows itself
	 * @param {Record<string, string>} [options.products] display names by product id, added to the family's
	 * @param {Node} [options.notifications] the notification entry
	 * @param {{signout?: (() => void)|{href: string}, items?: Array<{label: string, href?: string, run?: () => void}>, label?: string}} [options.account]
	 * @param {{controls: string, expanded: boolean, onchange: (expanded: boolean) => void}} [options.toggle] a sidebar of the product's own
	 * @param {(item: {href: string, url: string, label: string}, event: MouseEvent) => void} [options.onnavigate] takes over plain clicks on same-origin links
	 * @param {string[]} [options.advisory] reasons whose entries stay links when they have an address
	 */
	constructor({ product, brand, descriptor = null, fallback = {}, products = {}, notifications = null, account = {}, toggle = null, onnavigate = null, advisory = ['NOT_ADMITTED'], labels = {} }) {
		super();
		this.#options = { product, brand, notifications, account, onnavigate, advisory };
		this.#labels = new Labels(defaults, labels);
		this.#names = { ...names, ...products };
		this.#descriptor = descriptor;
		this.#fallback = fallback ?? {};
		this.#thread = el('div', { class: 'bui-family-thread' });
		this.#end = el('div', { class: 'bui-family-end' });
		const text = key => this.#labels.text(key);
		this.#header = new Header({
			brand: { label: text('home'), href: brand.href, logo: el('img', { class: 'bui-lockup-mark', src: brand.src, alt: '' }) },
			context: this.#thread,
			account: this.#end,
			toggle,
			labels: { header: text('header'), context: text('context'), open: text('open'), close: text('close') }
		});
		const bar = this.#header.element;
		bar.classList.add('bui-family');
		this.#start = bar.querySelector('.bui-header-start');
		this.#start.classList.add('bui-family-brand');
		bar.addEventListener('click', event => this.#navigate(event));
		this.#draw();
	}

	get element() {
		return this.#header.element;
	}

	/** `loading` (no descriptor yet), `unavailable` (the relay failed) or `ready`. */
	get state() {
		if (!this.#descriptor) return 'loading';
		return this.#descriptor.unavailable ? 'unavailable' : 'ready';
	}

	get descriptor() {
		return this.#descriptor;
	}

	/** Replaces the descriptor and redraws; focus on a part of the bar stays on that part. */
	set descriptor(value) {
		this.#descriptor = value ?? null;
		this.#draw();
	}

	/** Replaces the names shown while the descriptor is loading or unavailable. */
	set fallback(value) {
		this.#fallback = value ?? {};
		this.#draw();
	}

	get expanded() {
		return this.#header.expanded;
	}

	/** Opens or closes the product's own region named by `toggle`. */
	set expanded(value) {
		this.#header.expanded = value;
	}

	destroy() {
		for (const part of this.#parts) part.destroy();
		this.#parts = [];
		this.#header.destroy();
		super.destroy();
	}

	#draw() {
		const focused = this.#focused();
		for (const part of this.#parts) part.destroy();
		const state = this.state;
		const ready = state === 'ready' ? this.#descriptor : null;
		const { product, brand, notifications, account, advisory } = this.#options;
		const places = new Places({ descriptor: ready, brand, product, advisory });
		const labels = this.#labels;
		const person = ready?.person ?? FamilyBar.#person(this.#fallback.person);
		const switcher = new ProductSwitcher({ product, names: this.#names, descriptor: ready, places, labels });
		const location = new Location({ state, descriptor: ready, fallback: this.#fallback, places, labels });
		const menu = new AccountMenu({ person, links: places.links, organization: Boolean(ready?.organization), account, labels });
		this.#parts = [switcher, location, menu];
		this.#start.append(switcher.element);
		this.#start.querySelector('.bui-header-brand').setAttribute('href', places.home);
		this.#thread.replaceChildren(el('span', { class: 'bui-family-divider', 'aria-hidden': 'true' }), location.element);
		const docs = places.links.docs ? el('a', { class: 'bui-family-docs', href: places.links.docs, 'data-part': 'docs' }, [icon('book'), el('span', { text: labels.text('docs') })]) : null;
		this.#end.replaceChildren(...[docs, notifications, menu.element].filter(Boolean));
		this.element.dataset.state = state;
		this.#restore(focused);
	}

	/** The part of the bar holding focus, so a redraw can return focus to its replacement. */
	#focused() {
		const active = this.element.ownerDocument.activeElement;
		if (!active || !this.element.contains(active) || this.#options.notifications?.contains(active)) return null;
		const part = active.closest('[data-part]');
		return part && (part === active || part.querySelector('button') === active) ? part.dataset.part : null;
	}

	#restore(part) {
		if (!part) return;
		const view = this.element.ownerDocument.defaultView;
		const shown = node => view.getComputedStyle(node).display !== 'none' && view.getComputedStyle(node.parentElement).display !== 'none';
		const root = [...this.element.querySelectorAll(`[data-part="${part}"]`)].find(shown);
		(root?.matches('a, button') ? root : root?.querySelector('button'))?.focus({ preventScroll: true });
	}

	/** Plain primary clicks on the bar's own same-origin links go to `onnavigate`. */
	#navigate(event) {
		const handler = this.#options.onnavigate;
		if (!handler || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		const link = event.target.closest?.('a[href]');
		if (!link || this.#options.notifications?.contains(link) || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;
		const view = this.element.ownerDocument.defaultView;
		const url = new URL(link.getAttribute('href'), this.element.ownerDocument.baseURI);
		if (url.origin !== view.location.origin) return;
		event.preventDefault();
		handler({ href: link.getAttribute('href'), url: url.href, label: link.getAttribute('aria-label') ?? link.textContent.trim() }, event);
	}

	static #person(value) {
		if (!value) return null;
		return typeof value === 'string' ? { name: value } : value;
	}
}
