import { Component } from '../core/component.js';
import { el, content, fill } from '../core/element.js';
import { Ids } from '../core/ids.js';
import { Labels } from '../core/labels.js';
import { Cut, NameTip } from '../core/cut.js';
import { PageCompact } from './compact.js';

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
 *
 * With `compact` (0.11.0) a long page keeps its title and status in view: once the title's line has
 * scrolled out under the family bar, one sticky line shows the title and the one status (and the
 * product's own `compact.actions`, when given), out of the page's flow so nothing shifts, and without
 * motion under reduced motion. `bar` is that line's holder, which `Page` places right before the
 * header; a product that places the header itself places `bar` before it. The line repeats what the
 * header says, so its title and status are hidden from assistive technology.
 */
export class PageHeader extends Component {
	/** The copy in English and Spanish (0.7.2). */
	static labels = Object.freeze({ en: Object.freeze({ ...defaults }), es: Object.freeze({ crumbs: 'Ruta de navegación' }) });

	#element;
	#heading;
	#status;
	#facts;
	#actions;
	#crumbs;
	#tabs;
	#labels;
	#bar = null;
	#line = null;
	#watch = null;
	#tip = null;

	/**
	 * @param {object} options
	 * @param {string|Node} options.title what is in view: the resource's name, never the organization when a project is in view
	 * @param {Array<{label: string, href?: string|null}>} [options.crumbs] the levels above, the last one being the current page's parent
	 * @param {Node|null} [options.status] one status (`status()` of this package)
	 * @param {string|Node|Array<string|Node>|null} [options.facts] one muted line of facts
	 * @param {Node[]} [options.actions] the title line's actions: one primary button, then an `ActionMenu`
	 * @param {Node|{element: Node}|null} [options.tabs] the page's `Tabs`
	 * @param {{crumbs?: string}} [options.labels]
	 * @param {boolean|{actions?: Array<Node|{element: Node}>}|null} [options.compact] the compact line on scroll (0.11.0)
	 */
	constructor({ title, crumbs = [], status = null, facts = null, actions = [], tabs = null, labels = {}, compact = null }) {
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
		// No name on the header: inside <main> it has the generic role, which takes none (ARIA 1.2), and the H1 already names the page
		this.#element = el('header', { class: 'bui-page-header' }, [this.#crumbs, line, this.#facts, this.#tabs]);
		if (compact) this.#compact(line, compact);
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

	/** The compact line's holder, placed right before the header (0.11.0); null without `compact`. */
	get bar() {
		return this.#bar;
	}

	/** Whether the compact line is shown now. */
	get compacted() {
		return this.#watch?.shown ?? false;
	}

	set title(title) {
		fill(this.#heading, [content(title)]);
		if (this.#line) fill(this.#line.title, [this.#heading.textContent]);
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
		if (this.#line) fill(this.#line.status, [status?.cloneNode?.(true) ?? null]);
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

	/** Decides at once whether the compact line shows, as after a product placed the page itself. */
	measure() {
		this.#watch?.measure();
	}

	destroy() {
		this.#watch?.destroy();
		this.#tip?.destroy();
		this.#bar?.remove();
		super.destroy();
	}

	#compact(line, { actions = [] } = {}) {
		const title = el('span', { class: 'bui-page-compact-title' });
		const status = el('span', { class: 'bui-page-compact-status' });
		const tools = el('div', { class: 'bui-page-compact-actions' }, (actions ?? []).map(action => action?.element ?? action));
		tools.hidden = !tools.childNodes.length;
		this.#line = { title, status };
		this.#bar = el('div', { class: 'bui-page-compact' }, [el('div', { class: 'bui-page-compact-line' }, [el('div', { class: 'bui-page-compact-text', 'aria-hidden': 'true' }, [title, status]), tools])]);
		this.#tip = new NameTip(title, { text: () => title.textContent, cut: () => Cut.text(title) });
		this.#watch = new PageCompact({ header: line, bar: this.#bar });
	}
}
