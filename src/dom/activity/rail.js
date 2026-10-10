import { Component } from '../core/component.js';
import { el, fill, content } from '../core/element.js';
import { glyph } from '../core/icons.js';

const tones = Object.freeze(['neutral', 'success', 'info', 'progress', 'warning', 'danger']);

/**
 * A rail of work (0.12.0): one thin line down a column of marks, so the events of a feed (a coding
 * agent's turn, a delivery's history) read as one sequence from the message that started them to their
 * end. Activity rows (`ActivityRow`, `ActivityGroup`) placed in it put their own mark on the line; any
 * other event is a `RailItem`, a mark with the product's content beside it, and `RailMoment` says a time
 * of day at the line's far end where the clock moved between two events.
 *
 * A mark's color follows its state (danger for a failure, warning for a denial or a wait for the person,
 * progress while it runs), always beside the product's words: color never says a state alone (D42). The
 * line is decoration and is hidden from assistive technology. It may adopt a product's own container
 * (`element`), whose children the product keeps placing. Nothing moves under reduced motion.
 */
export class Rail extends Component {
	static tones = tones;

	#element;

	/**
	 * @param {object} [options]
	 * @param {HTMLElement|null} [options.element] a container of the product's to draw as the rail
	 * @param {string|null} [options.label] its accessible name, when it is a group of its own
	 * @param {Array<Node|{element: Node}>} [options.children] what it holds at first
	 */
	constructor({ element = null, label = null, children = [] } = {}) {
		super();
		this.#element = element ?? el('div', {});
		this.#element.classList.add('bui-rail');
		if (label) {
			this.#element.setAttribute('role', 'group');
			this.#element.setAttribute('aria-label', label);
		}
		if (children.length) this.#element.append(...children.map(child => child.element ?? child));
	}

	get element() {
		return this.#element;
	}

	/** A tone the rail knows, else `neutral`. */
	static tone(value) {
		return tones.includes(value) ? value : 'neutral';
	}
}

/**
 * One event on a rail that is not an activity row: a mark on the line (the kind's glyph from the one
 * catalog, a dot without one, a spinner while `progress`) and the product's content beside it, such as
 * a paragraph the agent wrote, "Thought for 42 s" or a failure said in one line. `update()` patches the
 * mark and the content in place, so focus inside the content stays.
 */
export class RailItem extends Component {
	#element;
	#mark = el('span', { class: 'bui-rail-mark', 'aria-hidden': 'true' });
	#content = el('div', { class: 'bui-rail-content' });
	#values = { glyph: null, tone: 'neutral' };

	/**
	 * @param {object} [options]
	 * @param {string|null} [options.glyph] a name of the icon catalog; none draws a dot
	 * @param {'neutral'|'success'|'info'|'progress'|'warning'|'danger'} [options.tone] (default `neutral`)
	 * @param {string|Node|{element: Node}|null} [options.content] what the event says
	 */
	constructor({ glyph: name = null, tone = 'neutral', content: node = null } = {}) {
		super();
		this.#element = el('div', { class: 'bui-rail-item' }, [this.#mark, this.#content]);
		this.update({ glyph: name, tone, content: node });
	}

	get element() {
		return this.#element;
	}

	/** The element the product's content is placed in. */
	get body() {
		return this.#content;
	}

	/** Changes what is given (`glyph`, `tone`, `content`) and leaves the rest as it is. */
	update(values = {}) {
		if (this.destroyed) return this;
		const given = key => Object.hasOwn(values, key);
		const before = { ...this.#values };
		if (given('glyph')) this.#values.glyph = values.glyph ?? null;
		if (given('tone')) this.#values.tone = Rail.tone(values.tone);
		if (!this.#mark.firstChild || before.glyph !== this.#values.glyph || (before.tone === 'progress') !== (this.#values.tone === 'progress')) this.#draw();
		this.#element.dataset.tone = this.#values.tone;
		if (given('content')) {
			const node = values.content?.element ?? values.content;
			fill(this.#content, node === null || node === undefined ? [] : [content(node)]);
		}
		return this;
	}

	#draw() {
		const { glyph: name, tone } = this.#values;
		if (tone === 'progress') return fill(this.#mark, [el('span', { class: 'bui-spinner' })]);
		fill(this.#mark, [name ? glyph(name) : el('span', { class: 'bui-rail-dot' })]);
	}
}

/**
 * A time of day at a rail's far end, before an event that came well after the one above it (the
 * product decides when: Conduict says it where two minutes or more passed). Its text is the product's
 * ("10:51"); `datetime` and `title` carry the whole moment for assistive technology and on hover.
 */
export class RailMoment extends Component {
	#element;
	#time = el('time', {});

	/**
	 * @param {object} options
	 * @param {string} options.text the time as the product says it
	 * @param {string|null} [options.datetime] the moment, machine-readable
	 * @param {string|null} [options.title] the whole moment in words
	 */
	constructor({ text, datetime = null, title = null }) {
		super();
		this.#element = el('p', { class: 'bui-rail-moment' }, [this.#time]);
		this.update({ text, datetime, title });
	}

	get element() {
		return this.#element;
	}

	update({ text = this.#time.textContent, datetime = this.#time.getAttribute('datetime'), title = this.#time.getAttribute('title') } = {}) {
		if (this.#time.textContent !== text) this.#time.textContent = text ?? '';
		for (const [name, value] of [['datetime', datetime], ['title', title]]) {
			if (value) this.#time.setAttribute(name, value);
			else this.#time.removeAttribute(name);
		}
		return this;
	}
}
