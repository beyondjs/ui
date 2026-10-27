import { Component } from '../core/component.js';
import { el, content, fill } from '../core/element.js';
import { Ids } from '../core/ids.js';
import { Labels } from '../core/labels.js';
import { Cut, NameTip } from '../core/cut.js';
import { PageCompact } from './compact.js';

const defaults = { crumbs: 'Breadcrumb' };
/** What a lead says (0.41.0): a node, a number or words; nothing, a boolean or empty words say nothing, as in React. */
const said = value => value !== null && value !== undefined && typeof value !== 'boolean' && value !== '';

/**
 * A page's one header (LR-05, D160): a breadcrumb only from the second level down that says where the
 * object in view lives, the H1 naming it as its list names it, its kind or variant beside it (`kind`:
 * "Checkout", or one control that chooses among its siblings), one status right after it (D42) that is
 * the H1 object's own, one muted facts line of that object's properties, the actions at the end of the
 * title's line (one primary, the rest under an `ActionMenu`) and the page's tabs below. Another
 * object's state (the machine a copy runs on) is never the header's status or one of its facts.
 *
 * Since 0.41.0 (D191) a page's lead sentence has its own place: `lead`, one sentence or a short paragraph
 * under the facts line, in the body's role, muted and held at the reading measure, so it never runs the
 * header's width. The facts line keeps only the object's properties (D160): a sentence goes in `lead`.
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
 *
 * Since 0.29.0 (D181) the compact line says where the person is: the page's title, or the part of the page
 * in view that the product names (`subject`, such as the message of the turn being read in a thread),
 * as written, on up to two lines, in place of the title. Pressing it goes to that part (`href`); like the
 * title it is hidden from assistive technology and out of the tab order, since the page says it in place.
 */
export class PageHeader extends Component {
	/** The copy in English and Spanish (0.7.2). */
	static labels = Object.freeze({ en: Object.freeze({ ...defaults }), es: Object.freeze({ crumbs: 'Ruta de navegación' }) });

	#element;
	#heading;
	#kind;
	#status;
	#facts;
	#lead;
	#given = null;
	#actions;
	#crumbs;
	#tabs;
	#labels;
	#bar = null;
	#line = null;
	#watch = null;
	#tip = null;
	#subject = null;

	/**
	 * @param {object} options
	 * @param {string|Node} options.title what is in view: the resource's name, never the organization when a project is in view
	 * @param {Array<{label: string, href?: string|null}>} [options.crumbs] the levels above, the last one being the current page's parent
	 * @param {string|Node|{element: Node}|null} [options.kind] the object's kind or variant beside the H1: words, or one control (0.19.1)
	 * @param {Node|null} [options.status] one status (`status()` of this package)
	 * @param {string|Node|Array<string|Node>|null} [options.facts] one muted line of the object's properties
	 * @param {string|Node|Array<string|Node>|null} [options.lead] the page's lead sentence, at the reading measure (0.41.0, D191)
	 * @param {Node[]} [options.actions] the title line's actions: one primary button, then an `ActionMenu`
	 * @param {Node|{element: Node}|null} [options.tabs] the page's `Tabs`
	 * @param {{crumbs?: string}} [options.labels]
	 * @param {boolean|{actions?: Array<Node|{element: Node}>}|null} [options.compact] the compact line on scroll (0.11.0)
	 */
	constructor({ title, crumbs = [], kind = null, status = null, facts = null, lead = null, actions = [], tabs = null, labels = {}, compact = null }) {
		super();
		this.#labels = new Labels(PageHeader.labels, labels);
		const id = Ids.next('bui-page-title');
		this.#heading = el('h1', { class: 'bui-page-heading', id, tabindex: '-1' });
		this.#kind = el('span', { class: 'bui-page-kind' });
		this.#status = el('span', { class: 'bui-page-status' });
		this.#actions = el('div', { class: 'bui-page-actions' });
		this.#facts = el('p', { class: 'bui-page-facts' });
		this.#lead = el('p', { class: 'bui-page-lead' });
		this.#crumbs = el('nav', { class: 'bui-crumbs', 'aria-label': this.#labels.text('crumbs') });
		this.#tabs = el('div', { class: 'bui-page-tabs' });
		const line = el('div', { class: 'bui-page-title' }, [this.#heading, this.#kind, this.#status, this.#actions]);
		// No name on the header: inside <main> it has the generic role, which takes none (ARIA 1.2), and the H1 already names the page
		this.#element = el('header', { class: 'bui-page-header' }, [this.#crumbs, line, this.#facts, this.#lead, this.#tabs]);
		if (compact) this.#compact(line, compact);
		this.title = title;
		this.crumbs = crumbs;
		this.kind = kind;
		this.status = status;
		this.facts = facts;
		this.lead = lead;
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

	/**
	 * The object's kind or variant beside the H1 (0.19.1, D160): words drawn as a quiet tag ("Checkout",
	 * "Worktree"), or one control that chooses among the object's siblings. None takes no room.
	 */
	set kind(kind) {
		const node = typeof kind === 'string' ? (kind ? el('span', { class: 'bui-page-tag', text: kind }) : null) : (kind?.element ?? kind ?? null);
		fill(this.#kind, [node]);
		this.#kind.hidden = !node;
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

	/** The page's lead sentence under the facts line (0.41.0, D191), as given; none takes no room. */
	get lead() {
		return this.#given;
	}

	set lead(lead) {
		this.#given = lead ?? null;
		fill(this.#lead, [].concat(lead ?? []).filter(said).map(content));
		this.#lead.hidden = !this.#lead.childNodes.length;
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

	/** What the compact line names in place of the title (0.29.0, D181): `{ text, href }`, or null for the title. */
	get subject() {
		return this.#subject;
	}

	set subject(value) {
		// As written, without the empty lines between paragraphs, which would take one of its two lines
		const text = typeof value?.text === 'string' ? value.text.trim().replace(/[ \t]*\n\s*/g, '\n') : '';
		this.#subject = text ? { text, href: value.href ?? null } : null;
		if (!this.#line) return;
		const { subject, title } = this.#line;
		subject.textContent = this.#subject?.text ?? '';
		if (this.#subject?.href) subject.setAttribute('href', this.#subject.href);
		else subject.removeAttribute('href');
		subject.hidden = !this.#subject;
		title.hidden = Boolean(this.#subject);
		this.#bar.toggleAttribute('data-subject', Boolean(this.#subject));
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
		// The part in view, a link out of the tab order: the page itself says it where it stands (D181)
		const subject = el('a', { class: 'bui-page-compact-subject', tabindex: '-1', hidden: true });
		const tools = el('div', { class: 'bui-page-compact-actions' }, (actions ?? []).map(action => action?.element ?? action));
		tools.hidden = !tools.childNodes.length;
		this.#line = { title, status, subject };
		this.#bar = el('div', { class: 'bui-page-compact' }, [el('div', { class: 'bui-page-compact-line' }, [el('div', { class: 'bui-page-compact-text', 'aria-hidden': 'true' }, [subject, title, status]), tools])]);
		this.#tip = new NameTip(title, { text: () => title.textContent, cut: () => Cut.text(title) });
		this.#watch = new PageCompact({ header: line, bar: this.#bar });
	}
}
