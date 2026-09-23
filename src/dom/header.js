import { Component } from './core/component.js';
import { el, fill, content } from './core/element.js';
import { icon } from './core/icons.js';
import { Ids } from './core/ids.js';
import { Labels } from './core/labels.js';

const defaults = { header: 'Beyond', context: 'Where you are', nav: 'Product', open: 'Open navigation', close: 'Close navigation' };

/**
 * The shared family header of a signed-in product surface.
 *
 * Slots, left to right: the brand (a link home), the context (a breadcrumb of organization, project
 * and so on), the product navigation, then the notification entry and the account menu. On narrow
 * screens the navigation collapses behind a toggle button; a product whose navigation is a sidebar
 * of its own passes `toggle` instead, and the same button opens and closes that region. Every slot
 * is data or a node the product provides: the header decides placement, never who may go where.
 */
export class Header extends Component {
	#element;
	#labels;
	#context;
	#nav;
	#end;
	#toggle;
	#expanded;
	#onchange;
	#controls;
	#onnavigate;

	/**
	 * @param {object} options
	 * @param {{label: string, href: string, logo?: Node, image?: {src: string, width?: number, height?: number}}} options.brand
	 * @param {Array<{label: string|Node, href?: string, current?: boolean}>|Node} [options.context]
	 * @param {Array<{label: string|Node, href: string, current?: boolean}>|Node} [options.nav]
	 * @param {Node} [options.notifications] usually a NotificationEntry element
	 * @param {Node} [options.account] the account menu
	 * @param {{controls: string, expanded: boolean, onchange: (expanded: boolean) => void}} [options.toggle] an external region the toggle opens
	 * @param {(item: object, event: MouseEvent) => void} [options.onnavigate] takes over plain clicks on context and navigation links
	 */
	constructor({ brand, context = null, nav = null, notifications = null, account = null, toggle = null, onnavigate = null, labels = {} }) {
		super();
		this.#onnavigate = onnavigate;
		this.#labels = new Labels(defaults, labels);
		const id = Ids.next('bui-header');
		this.#controls = toggle?.controls ?? `${id}-nav`;
		this.#expanded = toggle?.expanded ?? false;
		this.#onchange = toggle?.onchange ?? null;
		this.#toggle = el('button', { type: 'button', class: 'bui-header-toggle', 'aria-controls': this.#controls, onclick: () => (this.expanded = !this.#expanded) }, [icon('menu')]);
		this.#context = el('nav', { class: 'bui-header-context', 'aria-label': this.#labels.text('context') });
		this.#nav = el('nav', { id: `${id}-nav`, class: 'bui-header-nav', 'aria-label': this.#labels.text('nav') });
		this.#end = el('div', { class: 'bui-header-end' }, [notifications, account]);
		this.#element = el('header', { class: `bui-header${toggle ? ' bui-header-external' : ''}`, 'aria-label': this.#labels.text('header') }, [
			el('div', { class: 'bui-header-start' }, [
				this.#toggle,
				el('a', { class: 'bui-header-brand', href: brand.href }, [this.#logo(brand), el('span', { class: brand.logo || brand.image ? 'bui-hidden' : 'bui-header-name' }, [content(brand.label)])])
			]),
			this.#context,
			this.#nav,
			this.#end
		]);
		this.context = context;
		this.nav = nav;
		this.#draw();
	}

	get element() {
		return this.#element;
	}

	get expanded() {
		return this.#expanded;
	}

	/** Opens or closes the collapsible navigation (or the external region named by `toggle`). */
	set expanded(value) {
		this.#expanded = Boolean(value);
		this.#draw();
		this.#onchange?.(this.#expanded);
	}

	/** Replaces the context: breadcrumb entries or a node. */
	set context(value) {
		fill(this.#context, this.#trail(value));
		this.#context.hidden = !value || (Array.isArray(value) && !value.length);
	}

	/** Replaces the product navigation: entries or a node. */
	set nav(value) {
		fill(this.#nav, Array.isArray(value) ? [el('ul', { class: 'bui-header-links' }, value.map(item => el('li', {}, [this.#link(item)])))] : [value]);
		this.#nav.hidden = !value;
		this.#element.classList.toggle('bui-header-has-nav', Boolean(value));
	}

	/** Replaces the notification and account slots. */
	set end({ notifications = null, account = null }) {
		fill(this.#end, [notifications, account]);
	}

	#trail(value) {
		if (!Array.isArray(value)) return [value];
		return [el('ol', { class: 'bui-crumbs' }, value.map((item, index) => el('li', {}, [index ? el('span', { class: 'bui-crumb-separator', 'aria-hidden': 'true', text: '/' }) : null, this.#link(item)])))];
	}

	#link(item) {
		const { label, href = null, current = false } = item;
		if (!href) return el('span', { 'aria-current': current ? 'page' : null }, [content(label)]);
		return el('a', {
			href,
			'aria-current': current ? 'page' : null,
			onclick: event => {
				if (!this.#onnavigate || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
				event.preventDefault();
				this.#onnavigate(item, event);
			}
		}, [content(label)]);
	}

	#logo({ logo = null, image = null }) {
		if (logo) return logo;
		return image ? el('img', { src: image.src, alt: '', width: image.width ?? null, height: image.height ?? null }) : null;
	}

	#draw() {
		this.#toggle.setAttribute('aria-expanded', String(this.#expanded));
		this.#toggle.setAttribute('aria-label', this.#labels.text(this.#expanded ? 'close' : 'open'));
		this.#element.toggleAttribute('data-expanded', this.#expanded);
	}
}
