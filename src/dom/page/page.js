import { Component } from '../core/component.js';
import { el, fill } from '../core/element.js';
import { PagePanel } from './panel.js';
import { PageDock } from './dock.js';
import { Primaries } from '../core/primaries.js';
import { Hierarchy } from '../core/hierarchy.js';
import { Ellipses } from '../core/ellipses.js';

const templates = Object.freeze(['overview', 'list', 'detail', 'settings', 'task', 'tool', 'thread']);
const widths = Object.freeze(['fluid', 'standard', 'form', 'reading', 'thread']);

/**
 * The content region of a signed-in page: the family page system (decision D52, LR-01 to LR-04).
 *
 * It fills the region beside the product's `Sidebar` (inside `.bui-shell`) or under `ProductNav`,
 * edge to edge, and its content starts one gutter after the navigation, never centered: 16, 24 or
 * 32 px as the region is narrower than 640 px, up to 1023 px or wider (`--layout-gutter`, decided by
 * the region's own width through a container query). Unused width falls only on the far side.
 *
 * Its blocks take a width tier (`width`): `fluid` for collections and tools (up to
 * `--layout-fluid-max`), `standard` for a main column with its aside, `form` for inputs and tasks and
 * `reading` for prose (`--layout-measure`), and since 0.11.0 `thread` for a conversation's turns
 * (`--layout-thread`, 80rem since 0.29.0, D180), whose panel kept in view takes the width they leave.
 * The arrival line and the header come first; `aside` is a resource page's side panel, beside the main
 * column once the region holds a form-width column and the panel (68rem), and below it otherwise. `template` names the page's kind (overview, list,
 * detail, settings, task or tool) as `data-template`, for checks and for the tool template, which has
 * no gutter (D22's departures).
 *
 * With `panel` (0.10.0) the aside is a panel kept in view instead (`PagePanel`, `page.panel`): beside
 * the main column and sticky from the region's `cut`, hideable there, and a side sheet below it that
 * `page.panel.open()` shows. Without `panel` the aside flows as it always did.
 *
 * The `thread` template (0.14.0, D94 and D96) is a conversation's page: its width is `thread` unless
 * given, the frame keeps no padding under its content and fills the window under the chrome
 * (`--bui-page-chrome`, the family bar by default and the sidebar's row below its cut), the main column
 * is a column whose last block is the `dock` (`PageDock`): pushed to the column's end and sticky at
 * the window's bottom with one gutter and the safe area under it, at the same distance from the bottom
 * whatever the scroll and the content's length. The header ends at the thread's edge, so a toggle in it
 * never moves when the panel shows or hides; since 0.29.0 (D180, amending D96) a thread reads by turns:
 * the person's message, prose, the rail and the work take the thread (`--layout-thread`) and only the
 * dock's composer keeps its lane (`--layout-lane`), on the same axis; from a 1024 px region its gutter
 * holds the index of its turns (`TurnIndex`); a panel kept in view comes next to the turns and takes what
 * they leave up to its maximum, the rest falling on the far side.
 *
 * Since 0.15.0 (decision C2, amending D52 for this template; DQ-14) `lane: 'center'` centers the thread's
 * column, its header with it, in the region left beside a panel kept in view (or the whole region).
 */
export class Page extends Component {
	static templates = templates;
	static widths = widths;

	#element;
	#frame;
	#body;
	#main;
	#aside;
	#panel = null;
	#dock = null;
	#primaries = null;
	#hierarchy = null;
	#ellipses = null;

	/**
	 * @param {object} [options]
	 * @param {'overview'|'list'|'detail'|'settings'|'task'|'tool'} [options.template] the page's kind (default `detail`)
	 * @param {'fluid'|'standard'|'form'|'reading'|'thread'|null} [options.width] the main column's tier (default `standard`, `thread` in the thread template)
	 * @param {Node|{element: Node}|null} [options.arrival] the arrival line (`Arrival`), first in the region
	 * @param {Node|{element: Node}|null} [options.header] the page's header (`PageHeader`)
	 * @param {Node[]} [options.children] the main column
	 * @param {Node[]|null} [options.aside] the side panel's content; no panel without it
	 * @param {string} [options.label] the side panel's accessible name
	 * @param {{cut?: number|string, open?: boolean, onchange?: (shown: boolean) => void, title?: string|null, head?: boolean, wide?: boolean, labels?: {close?: string, hide?: string}}|null} [options.panel]
	 *   the aside as a panel kept in view (0.10.0): beside and sticky from `cut`, a side sheet below it;
	 *   since 0.11.0 with a head of its own (`head`) and a wide form (`wide`)
	 * @param {Node|{element: Node}|Array<Node|{element: Node}>|null} [options.dock] what the thread template docks at the window's bottom, such as its composer (0.14.0)
	 * @param {'start'|'center'} [options.lane] where the thread template's column sits (0.15.0)
	 */
	constructor({ template = 'detail', width = null, arrival = null, header = null, children = [], aside = null, label = null, panel = null, dock = null, lane = 'start' } = {}) {
		super();
		if (!templates.includes(template)) throw new TypeError(`A page's template is one of ${templates.join(', ')}`);
		width ??= template === 'thread' ? 'thread' : 'standard';
		if (dock && template !== 'thread') throw new TypeError("A page's dock belongs to the thread template");
		if (!widths.includes(width)) throw new TypeError(`A page's width is one of ${widths.join(', ')}`);
		this.#main = el('div', { class: 'bui-page-main' });
		this.#aside = el('aside', { class: 'bui-page-aside', 'aria-label': label });
		this.#body = el('div', { class: 'bui-page-body' }, [this.#main]);
		// A header's compact line (0.11.0) goes right before it in the frame, so it stays in view as the page scrolls
		this.#frame = el('div', { class: 'bui-page-frame' }, [Page.#node(arrival), header?.bar ?? null, Page.#node(header), this.#body]);
		this.#element = el('div', { class: 'bui-page', dataset: template === 'thread' && lane === 'center' ? { template, width, lane } : { template, width } }, [this.#frame]);
		if (panel) this.#panel = new PagePanel({ ...panel, page: this.#element, body: this.#body, label });
		if (template === 'thread') this.#dock = new PageDock();
		this.main = children;
		this.dock = dock;
		this.aside = aside;
		// One primary action per region, warned in a development build (0.16.0, DQ-09)
		if (Primaries.enabled) this.#primaries = new Primaries({ root: this.#element });
		// A heading outranks what it names, warned in a development build (0.19.0, D158)
		if (Hierarchy.enabled) this.#hierarchy = new Hierarchy({ root: this.#element });
		// A visible action is named whole, its "…" only inside a menu, warned in a development build (0.28.0, D179)
		if (Ellipses.enabled) this.#ellipses = new Ellipses({ root: this.#element });
	}

	/** The panel kept in view (`PagePanel`), when the page was made with `panel`; null otherwise. */
	get panel() {
		return this.#panel;
	}

	get element() {
		return this.#element;
	}

	/** The main column's element, for products that fill it themselves. */
	get region() {
		return this.#main;
	}

	/** Replaces the main column's content; the thread template's dock stays its last block. */
	set main(children) {
		fill(this.#main, children);
		if (this.#dock) this.#main.append(this.#dock.element, this.#dock.end);
	}

	/** The thread template's dock (`PageDock`: `element`, `stuck`), or null in any other template (0.14.0). */
	get dock() {
		return this.#dock;
	}

	/** Replaces what the thread template docks at the window's bottom (0.14.0). */
	set dock(children) {
		if (!this.#dock) {
			if (children) throw new TypeError("A page's dock belongs to the thread template");
			return;
		}
		this.#dock.content = children;
	}

	/** Replaces the side panel's content; `null` removes the panel. */
	set aside(children) {
		if (this.#panel) {
			this.#panel.content = children;
			return;
		}
		if (!children) {
			this.#aside.remove();
			return;
		}
		fill(this.#aside, children);
		if (this.#aside.parentNode !== this.#body) this.#body.append(this.#aside);
	}

	/** The width tier of the main column. */
	set width(width) {
		if (!widths.includes(width)) throw new TypeError(`A page's width is one of ${widths.join(', ')}`);
		this.#element.dataset.width = width;
	}

	mount(parent, before = null) {
		super.mount(parent, before);
		this.#panel?.measure();
		return this;
	}

	destroy() {
		this.#primaries?.destroy();
		this.#hierarchy?.destroy();
		this.#ellipses?.destroy();
		this.#panel?.destroy();
		this.#dock?.destroy();
		super.destroy();
	}

	static #node(part) {
		if (!part) return null;
		return part.element ?? part;
	}
}
