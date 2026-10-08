import { el, fill, content } from '../core/element.js';
import { Glyph, glyph } from '../core/icons.js';
import { Cut, NameTip } from '../core/cut.js';
import { hidden, status } from '../feedback.js';

const states = Object.freeze(['running', 'done', 'failed', 'denied', 'waiting']);
const tones = { running: 'info', failed: 'danger', denied: 'warning', waiting: 'neutral' };

/**
 * The head of an activity row or group, patched part by part so an update never replaces the control
 * that may hold focus: the kind's glyph (a spinner while running, still under reduced motion), the
 * title, the meta in words, the duration and the state in words ("Running", "Failed", "Denied",
 * "Waiting", and "Done" for assistive technology only). With a body it is a button (`aria-expanded`,
 * `aria-controls`, Enter and Space toggle it natively) ending with the disclosure chevron; without one
 * it is plain text.
 *
 * The title takes two lines, then is cut; while it is cut a tooltip shows it whole on hover and focus
 * (D44), and the row shows it whole at the top of its body.
 */
export class ActivityHead {
	static states = states;

	#element;
	#mark = el('span', { class: 'bui-activity-mark', 'aria-hidden': 'true' });
	#title = el('span', { class: 'bui-activity-title' });
	#meta = el('span', { class: 'bui-activity-meta', hidden: true });
	#time = el('span', { class: 'bui-activity-time', hidden: true });
	#word = el('span', { class: 'bui-activity-word' });
	#labels;
	#tip;
	#glyph = null;
	#state = null;

	/**
	 * @param {object} options
	 * @param {string|null} options.controls the id of the body it shows and hides; null for a head without one
	 * @param {import('../core/labels.js').Labels} options.labels
	 */
	constructor({ controls, labels }) {
		this.#labels = labels;
		const parts = [this.#mark, el('span', { class: 'bui-activity-text' }, [this.#title, this.#meta, this.#time]), this.#word];
		if (controls) {
			const chevron = glyph('chevron');
			chevron.classList.add('bui-activity-chevron');
			this.#element = el('button', { type: 'button', class: 'bui-activity-head', 'aria-expanded': 'false', 'aria-controls': controls }, [...parts, chevron]);
		} else this.#element = el('div', { class: 'bui-activity-head' }, parts);
		this.#tip = new NameTip(this.#element, { text: () => this.#title.textContent, cut: () => this.cut });
	}

	/** A state as given, or `waiting` for anything unknown. */
	static state(value) {
		return states.includes(value) ? value : 'waiting';
	}

	get element() {
		return this.#element;
	}

	/** Whether the title is cut now. */
	get cut() {
		return Cut.clamp(this.#title);
	}

	/** The whole title as text. */
	get text() {
		return this.#title.textContent;
	}

	set expanded(value) {
		if (this.#element.tagName === 'BUTTON') this.#element.setAttribute('aria-expanded', String(Boolean(value)));
	}

	set glyph(name) {
		if (name === this.#glyph) return;
		new Glyph(name);
		this.#glyph = name;
		this.#paint();
	}

	set title(value) {
		if (typeof value === 'string' && this.#title.childNodes.length === 1 && this.#title.textContent === value) return;
		fill(this.#title, [content(value)]);
	}

	/** Words after the title ("exit 1", "+12 −3"); null for none. */
	set meta(value) {
		const empty = value === null || value === undefined || value === '';
		this.#meta.hidden = empty;
		if (empty) return this.#meta.replaceChildren();
		if (typeof value === 'string' && this.#meta.textContent === `, ${value}`) return;
		fill(this.#meta, [hidden(', '), content(value)]);
	}

	/** The duration in words, or null. Written only when it changed, so a tick never disturbs a reader. */
	set time(text) {
		this.#time.hidden = !text;
		const wanted = text ? `, ${text}` : '';
		if (this.#time.textContent !== wanted) fill(this.#time, text ? [hidden(', '), text] : []);
	}

	set state(value) {
		const state = ActivityHead.state(value);
		if (state === this.#state) return;
		this.#state = state;
		this.#paint();
		const word = this.#labels.text(state);
		fill(this.#word, tones[state] ? [hidden(', '), status(word, tones[state])] : [hidden(`, ${word}`)]);
	}

	destroy() {
		this.#tip.destroy();
	}

	#paint() {
		if (!this.#glyph) return;
		fill(this.#mark, [this.#state === 'running' ? el('span', { class: 'bui-spinner' }) : glyph(this.#glyph)]);
	}
}
