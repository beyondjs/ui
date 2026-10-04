import { Component } from '../core/component.js';
import { el, content, fill } from '../core/element.js';
import { Ids } from '../core/ids.js';
import { Labels } from '../core/labels.js';

const defaults = { crumbs: 'Breadcrumb' };

/**
 * A page's one header (LR-05): a breadcrumb only from the second level down, the H1 naming what is in
 * view, one status right after it (D42), one muted facts line, the actions at the end of the title's
 * line (one primary, the rest under an `ActionMenu`) and the page's tabs below.
 *
 * The H1 takes focus after a navigation (`focus()`; it has `tabindex="-1"`). Under a 640 px region the
 * status and the actions move under the title. Preferences, product switching, organization or
 * project selectors and return buttons never go in it: they belong to the profile menu, the family
 * bar and the arrival line.
 */
export class PageHeader extends Component {
	#element;
	#heading;
	#status;
	#facts;
	#actions;
	#crumbs;
	#tabs;
	#labels;

	/**
	 * @param {object} options
	 * @param {string|Node} options.title what is in view: the resource's name, never the organization when a project is in view
	 * @param {Array<{label: string, href?: string|null}>} [options.crumbs] the levels above, the last one being the current page's parent
	 * @param {Node|null} [options.status] one status (`status()` of this package)
	 * @param {string|Node|Array<string|Node>|null} [options.facts] one muted line of facts
	 * @param {Node[]} [options.actions] the title line's actions: one primary button, then an `ActionMenu`
	 * @param {Node|{element: Node}|null} [options.tabs] the page's `Tabs`
	 * @param {{crumbs?: string}} [options.labels]
	 */
	constructor({ title, crumbs = [], status = null, facts = null, actions = [], tabs = null, labels = {} }) {
		super();
		this.#labels = new Labels(defaults, labels);
		const id = Ids.next('bui-page-title');
		this.#heading = el('h1', { class: 'bui-page-heading', id, tabindex: '-1' });
		this.#status = el('span', { class: 'bui-page-status' });
		this.#actions = el('div', { class: 'bui-page-actions' });
		this.#facts = el('p', { class: 'bui-page-facts' });
		this.#crumbs = el('nav', { class: 'bui-crumbs', 'aria-label': this.#labels.text('crumbs') });
		this.#tabs = el('div', { class: 'bui-page-tabs' });
		const line = el('div', { class: 'bui-page-title' }, [this.#heading, this.#status, this.#actions]);
		this.#element = el('header', { class: 'bui-page-header', 'aria-labelledby': id }, [this.#crumbs, line, this.#facts, this.#tabs]);
		this.title = title;
		this.crumbs = crumbs;
		this.status = status;
		this.facts = facts;
		this.actions = actions;
		this.tabs = tabs;
	}

	get element() {
		return this.#element;
	}

	/** The H1, for focus after a navigation. */
	get heading() {
		return this.#heading;
	}

	set title(title) {
		fill(this.#heading, [content(title)]);
	}

	/** The levels above the page; none, or a single section root, shows no breadcrumb. */
	set crumbs(crumbs) {
		const levels = (crumbs ?? []).filter(Boolean);
		const items = levels.map(level => el('li', {}, [level.href ? el('a', { href: level.href, text: level.label }) : el('span', { text: level.label })]));
		fill(this.#crumbs, items.length ? [el('ol', {}, items)] : []);
		this.#crumbs.hidden = !items.length;
	}

	set status(status) {
		fill(this.#status, [status]);
		this.#status.hidden = !status;
	}

	set facts(facts) {
		fill(this.#facts, [].concat(facts ?? []).map(content));
		this.#facts.hidden = !this.#facts.childNodes.length;
	}

	set actions(actions) {
		fill(this.#actions, (actions ?? []).map(action => action?.element ?? action));
		this.#actions.hidden = !this.#actions.childNodes.length;
	}

	set tabs(tabs) {
		fill(this.#tabs, [tabs?.element ?? tabs]);
		this.#tabs.hidden = !tabs;
	}

	/** Moves focus to the H1 without scrolling, after a navigation. */
	focus() {
		this.#heading.focus({ preventScroll: true });
	}
}
