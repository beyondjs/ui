import { el } from '../core/element.js';
import { Status } from '../status/status.js';

const said = value => value !== null && value !== undefined && value !== '';
/** Each state a turn's mark says, as the `Status` state whose shape and hue it takes. */
const marks = Object.freeze({ running: 'running', waiting: 'attention', failed: 'failed' });

/**
 * One turn of a `TurnIndex` (0.29.0, D182): one row of the index, a link to the turn when it has an
 * address (`href`), so it opens in another tab and copies as a link, else a button. It draws a short dash
 * at the row's end beside the turns, longer for the turn in view and under the pointer, and for a turn
 * that runs, needs the person or failed, that state's `Status` shape before it, still. Its name is the turn's message, then the state in
 * words; the dash and the shape are hidden from assistive technology. `update()` writes only what
 * changed, so the control that may hold focus stays, unless the turn gains or loses its address.
 */
export class TurnMark {
	/** The states a mark says; any other turn is drawn as a dash alone. */
	static states = Object.freeze(Object.keys(marks));

	#key;
	#labels;
	#element = el('li', { class: 'bui-turns-row' });
	#control = null;
	#name = el('span', { class: 'bui-hidden' });
	#dash = el('span', { class: 'bui-turns-dash', 'aria-hidden': 'true' });
	#state = el('span', { class: 'bui-turns-state bui-status', 'aria-hidden': 'true', hidden: true }, [el('span', { class: 'bui-status-dot' })]);
	#item = null;
	#mood = null;

	/**
	 * @param {string} key the turn's key
	 * @param {{labels: import('../core/labels.js').Labels}} options the index's copy
	 */
	constructor(key, { labels }) {
		this.#key = key;
		this.#labels = labels;
	}

	get key() {
		return this.#key;
	}

	/** The row (`li`). */
	get element() {
		return this.#element;
	}

	/** The link or button that takes focus and is pressed. */
	get control() {
		return this.#control;
	}

	/** The turn as last given: `{ key, title, summary, facts, state, stateLabel, href, element, head }`. */
	get item() {
		return this.#item;
	}

	/** The state the mark says (`running`, `waiting` or `failed`), or null. */
	get state() {
		return this.#mood;
	}

	/** The state in words: the product's `stateLabel`, else the index's own; null without a state. */
	get word() {
		if (!this.#mood) return null;
		return said(this.#item?.stateLabel) ? String(this.#item.stateLabel) : this.#labels.text(this.#mood);
	}

	/** Whether this is the turn in view (`aria-current`). */
	set current(value) {
		if (value) this.#control.setAttribute('aria-current', 'true');
		else this.#control.removeAttribute('aria-current');
	}

	get current() {
		return this.#control?.getAttribute('aria-current') === 'true';
	}

	/** How far it is from the mark under the pointer (0, 1 or 2), which lengthens its dash; null for none. */
	set near(distance) {
		if (distance === null || distance > 2) delete this.#control.dataset.near;
		else this.#control.dataset.near = String(distance);
	}

	/** Takes the turn as given now; answers itself. */
	update(item) {
		const href = said(item.href) ? String(item.href) : null;
		if (!this.#control || (href !== null) !== (this.#control.tagName === 'A')) this.#make(href !== null);
		if (href !== null && this.#control.getAttribute('href') !== href) this.#control.setAttribute('href', href);
		this.#item = item;
		this.#mood = TurnMark.states.includes(item.state) ? item.state : null;
		const name = [said(item.title) ? String(item.title) : this.#key, this.word].filter(Boolean).join(', ');
		if (this.#name.textContent !== name) this.#name.textContent = name;
		this.#state.hidden = !this.#mood;
		this.#state.className = this.#mood ? `bui-turns-state bui-status bui-status-${Status.tone(marks[this.#mood])}` : 'bui-turns-state bui-status';
		if (this.#mood) this.#control.dataset.state = this.#mood;
		else delete this.#control.dataset.state;
		return this;
	}

	focus(options = {}) {
		this.#control.focus(options);
	}

	destroy() {
		this.#element.remove();
	}

	/** The control: a link with an address, else a button; one that held focus hands it to its successor. */
	#make(link) {
		const before = this.#control;
		const focused = before && before.ownerDocument.activeElement === before;
		const control = link ? el('a', { class: 'bui-turns-mark' }) : el('button', { type: 'button', class: 'bui-turns-mark' });
		control.append(this.#name, this.#dash, this.#state);
		for (const name of ['tabindex', 'aria-current', 'data-near']) if (before?.hasAttribute(name)) control.setAttribute(name, before.getAttribute(name));
		if (before) before.replaceWith(control);
		else this.#element.append(control);
		this.#control = control;
		if (focused) control.focus({ preventScroll: true });
	}
}
