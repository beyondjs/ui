import { Component } from '../core/component.js';
import { el, content, fill } from '../core/element.js';
import { Ids } from '../core/ids.js';
import { waiting } from '../feedback.js';
import { EmptyState } from '../checklist/empty.js';
import { LastUpdate } from '../again/update.js';
import { SectionPart } from './part.js';

/**
 * A flat section of a page (LR-06, D10): a heading, one optional description at the reading width,
 * its content and its actions at the end of the heading's line. Sections are set apart by space and a
 * 1 px divider, never by a bordered box, so no bordered surface sits inside another; a `Collection`
 * inside a section keeps no border of its own. Since 0.15.0 (decision C2, amending D10) `raised` draws a
 * section that is an object of its own (an inspector's panel, a summary card) on a raised surface.
 *
 * Since 0.24.0 (D163) a section whose read did not answer says so in its own place (`unavailable`), and a
 * section that keeps an earlier read's content says when that was (`updated`); who did not answer and
 * Try again belong to the page's one `Recovery`.
 *
 * Since 0.44.0 (LOAD-01) one part of the body may wait while the rest is drawn (`part()`), such as a list
 * beside an action of the body; the section is busy while its own wait or one of its parts' runs.
 */
export class Section extends Component {
	#element;
	#body;
	#update = null;
	/** Whether the whole body waits (`wait()`) */
	#own = false;

	/**
	 * @param {object} options
	 * @param {string|Node} options.title
	 * @param {string|Node|null} [options.description] one line at the reading width
	 * @param {Node[]} [options.actions] the section's own actions
	 * @param {Node[]} [options.children]
	 * @param {2|3} [options.level] the heading's level (default 2)
	 * @param {boolean} [options.raised] a raised surface inside the page (0.15.0)
	 * @param {object|number|null} [options.waiting] starts waiting in that shape (`wait`, 0.23.0)
	 * @param {boolean|object|null} [options.unavailable] starts unavailable, with `EmptyState`'s options (0.24.0)
	 * @param {object|string|number|Date|null} [options.updated] the kept content's time, or `{ time, locale, labels }` (0.24.0)
	 */
	constructor({ title, description = null, actions = [], children = [], level = 2, raised = false, waiting: shape = null, unavailable = null, updated = null }) {
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
		if (unavailable) this.unavailable(unavailable === true ? {} : unavailable);
		else if (shape) this.wait(shape === true ? {} : shape);
		else this.children = children;
		this.updated = updated;
	}

	get element() {
		return this.#element;
	}

	/** Replaces the section's content, ending a wait. */
	set children(children) {
		this.#own = false;
		fill(this.#body, children);
		this.#mark();
	}

	/**
	 * Waits in place while the section's first read runs (0.23.0, LOAD-01): the heading and actions stay,
	 * the body holds `waiting(shape)` and the section is `aria-busy` until `children` is set.
	 */
	wait(shape = {}) {
		this.#own = true;
		fill(this.#body, [waiting(shape)]);
		this.#mark();
	}

	/**
	 * A part of the body that waits for its own read while the rest is drawn (0.44.0, LOAD-01): place its
	 * `element` among the section's `children`; the section is busy while it waits, until its `children` is set.
	 * @param {{waiting?: object|number|boolean|null, children?: Node[]}} [options]
	 * @returns {SectionPart}
	 */
	part({ waiting: shape = null, children = [] } = {}) {
		return new SectionPart({ waiting: shape, children, onchange: () => this.#mark() });
	}

	/**
	 * Says in place that the section's read did not answer (0.24.0, D163): the heading and actions stay and
	 * the body holds `EmptyState`'s `outage` ("Not available right now"), with no action of its own.
	 */
	unavailable(options = {}) {
		this.#own = false;
		fill(this.#body, [new EmptyState({ ...options, kind: 'outage' }).element]);
		this.#mark();
	}

	/** When the kept content was read, said above it (`LastUpdate`), or null while it is current. */
	get updated() {
		return this.#update?.time ?? null;
	}

	set updated(value) {
		const given = value !== null && typeof value === 'object' && !(value instanceof Date) ? value : value === null || value === undefined ? null : { time: value };
		if (!given) {
			this.#update?.destroy();
			this.#update = null;
			return;
		}
		if (this.#update) this.#update.time = given.time ?? null;
		else {
			this.#update = new LastUpdate({ time: given.time ?? null, locale: given.locale, labels: given.labels });
			this.#body.before(this.#update.element);
		}
	}

	/** Busy while the body waits, or one of its own parts placed in it does (not a nested section's). */
	#mark() {
		const busy = this.#own || [...this.#body.querySelectorAll('.bui-section-part[data-waiting]')].some(part => part.closest('.bui-section') === this.#element);
		if (busy) this.#element.setAttribute('aria-busy', 'true');
		else this.#element.removeAttribute('aria-busy');
	}
}
