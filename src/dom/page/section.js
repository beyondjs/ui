import { Component } from '../core/component.js';
import { el, content, fill } from '../core/element.js';
import { Ids } from '../core/ids.js';

/**
 * A flat section of a page (LR-06, D10): a heading, one optional description at the reading width,
 * its content and its actions at the end of the heading's line. Sections are set apart by space and a
 * 1 px divider, never by a bordered box, so no bordered surface sits inside another; a `Collection`
 * inside a section keeps no border of its own. Since 0.15.0 (decision C2, amending D10) `raised` draws a
 * section that is an object of its own (an inspector's panel, a summary card) on a raised surface.
 */
export class Section extends Component {
	#element;
	#body;

	/**
	 * @param {object} options
	 * @param {string|Node} options.title
	 * @param {string|Node|null} [options.description] one line at the reading width
	 * @param {Node[]} [options.actions] the section's own actions
	 * @param {Node[]} [options.children]
	 * @param {2|3} [options.level] the heading's level (default 2)
	 * @param {boolean} [options.raised] a raised surface inside the page (0.15.0)
	 */
	constructor({ title, description = null, actions = [], children = [], level = 2, raised = false }) {
		super();
		const id = Ids.next('bui-section');
		const heading = el(level === 3 ? 'h3' : 'h2', { class: 'bui-section-title', id }, [content(title)]);
		const tools = actions.length ? el('div', { class: 'bui-section-actions' }, actions.map(action => action?.element ?? action)) : null;
		this.#body = el('div', { class: 'bui-section-body' });
		this.#element = el('section', { class: 'bui-section', 'aria-labelledby': id, 'data-raised': raised ? '' : null }, [
			el('div', { class: 'bui-section-head' }, [heading, tools]),
			description ? el('p', { class: 'bui-section-description' }, [content(description)]) : null,
			this.#body
		]);
		this.children = children;
	}

	get element() {
		return this.#element;
	}

	/** Replaces the section's content. */
	set children(children) {
		fill(this.#body, children);
	}
}
