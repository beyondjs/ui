import { Component } from '../core/component.js';
import { el, fill } from '../core/element.js';

const templates = Object.freeze(['overview', 'list', 'detail', 'settings', 'task', 'tool']);
const widths = Object.freeze(['fluid', 'standard', 'form', 'reading']);

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
 * `reading` for prose (`--layout-measure`). The arrival line and the header come first; `aside` is a
 * resource page's side panel, beside the main column once the region holds a form-width column and
 * the panel (68rem), and below it otherwise. `template` names the page's kind (overview, list,
 * detail, settings, task or tool) as `data-template`, for checks and for the tool template, which has
 * no gutter (D22's departures).
 */
export class Page extends Component {
	static templates = templates;
	static widths = widths;

	#element;
	#frame;
	#body;
	#main;
	#aside;

	/**
	 * @param {object} [options]
	 * @param {'overview'|'list'|'detail'|'settings'|'task'|'tool'} [options.template] the page's kind (default `detail`)
	 * @param {'fluid'|'standard'|'form'|'reading'} [options.width] the main column's tier (default `standard`)
	 * @param {Node|{element: Node}|null} [options.arrival] the arrival line (`Arrival`), first in the region
	 * @param {Node|{element: Node}|null} [options.header] the page's header (`PageHeader`)
	 * @param {Node[]} [options.children] the main column
	 * @param {Node[]|null} [options.aside] the side panel's content; no panel without it
	 * @param {string} [options.label] the side panel's accessible name
	 */
	constructor({ template = 'detail', width = 'standard', arrival = null, header = null, children = [], aside = null, label = null } = {}) {
		super();
		if (!templates.includes(template)) throw new TypeError(`A page's template is one of ${templates.join(', ')}`);
		if (!widths.includes(width)) throw new TypeError(`A page's width is one of ${widths.join(', ')}`);
		this.#main = el('div', { class: 'bui-page-main' });
		this.#aside = el('aside', { class: 'bui-page-aside', 'aria-label': label });
		this.#body = el('div', { class: 'bui-page-body' }, [this.#main]);
		this.#frame = el('div', { class: 'bui-page-frame' }, [Page.#node(arrival), Page.#node(header), this.#body]);
		this.#element = el('div', { class: 'bui-page', dataset: { template, width } }, [this.#frame]);
		this.main = children;
		this.aside = aside;
	}

	get element() {
		return this.#element;
	}

	/** The main column's element, for products that fill it themselves. */
	get region() {
		return this.#main;
	}

	/** Replaces the main column's content. */
	set main(children) {
		fill(this.#main, children);
	}

	/** Replaces the side panel's content; `null` removes the panel. */
	set aside(children) {
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

	static #node(part) {
		if (!part) return null;
		return part.element ?? part;
	}
}
