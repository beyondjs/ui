import { Component } from './core/component.js';
import { el, fill, content } from './core/element.js';
import { glyph } from './core/icons.js';
import { Labels } from './core/labels.js';
import { Hint } from './core/hint.js';

const defaults = { busy: '{label}…' };

/**
 * A button, or a link styled as one when `href` is given.
 *
 * Variants: `primary`, `secondary`, `quiet` and `danger`. While busy the button keeps focus and its
 * place but ignores presses (`aria-disabled`), shows a spinner and says it is working, so a double
 * press can never send an action twice; `run()` wraps an asynchronous action in that state.
 *
 * Since 0.26.0 (D165) a button may be `bare`: its glyph alone is drawn, its label stays its accessible
 * name (visually hidden, and its `aria-label`) and the family tooltip shows it on hover and focus. Only a
 * glyph of the closed list (`unlabeled`, D11) stands alone this way; `bare` can change while it lives,
 * as a composer's Send does when a step needs its words.
 *
 * Since 0.32.0 (D183) a button may be `waiting` for a step not yet taken, such as Add while nothing is
 * chosen: it is quiet (`aria-disabled`) and still reachable, and a press only puts the person at
 * `place()`, its own action never running; a link that waits does not navigate. A form's submit waits
 * through `Required` instead. Since 0.35.0 its own wait carries `data-bui-waiting`, which `Required` and
 * `Quiet` never free, so a product's condition on a form's submit stands once the form holds everything.
 */
export class Button extends Component {
	#element;
	#label;
	#glyph;
	#labels;
	#busy = false;
	#waiting = false;
	#place = null;
	#disabled;
	#bare = false;
	#name;
	#hint = null;

	/**
	 * @param {object} options
	 * @param {string|Node} options.label visible label
	 * @param {'primary'|'secondary'|'quiet'|'danger'} [options.variant]
	 * @param {string} [options.glyph] icon name from the package catalog
	 * @param {string} [options.href] renders a link styled as a button
	 * @param {(event: Event) => void} [options.onclick]
	 * @param {string} [options.name] accessible name when it differs from the label
	 * @param {boolean} [options.bare] the glyph alone, its label the name and the tooltip (0.26.0, D165)
	 * @param {boolean} [options.waiting] a step not yet taken: quiet, a press only going to `place` (0.32.0, D183)
	 * @param {(() => HTMLElement|null|undefined)|null} [options.place] where a press puts the person while it waits
	 */
	constructor({
		label,
		variant = 'secondary',
		glyph = null,
		href = null,
		onclick = null,
		disabled = false,
		busy = false,
		type = 'button',
		small = false,
		name = null,
		describedby = null,
		bare = false,
		waiting = false,
		place = null,
		labels = {}
	}) {
		super();
		this.#label = label;
		this.#glyph = glyph;
		this.#disabled = disabled;
		this.#name = name;
		this.#labels = new Labels(defaults, labels);
		const props = {
			class: `bui-button bui-button-${variant}${small ? ' bui-button-small' : ''}`,
			'aria-label': name,
			'aria-describedby': describedby
		};
		this.#element =
			href && !disabled
				? el('a', { ...props, href })
				: el('button', { ...props, type, disabled, onclick: event => this.#press(event, onclick) });
		// A link that waits or works holds its press before any handler, as a button does, and does not navigate
		if (href && !disabled) this.#element.addEventListener('click', event => this.#hold(event), { capture: true });
		if (href && !disabled && onclick) this.#element.addEventListener('click', onclick);
		this.#bare = Boolean(bare && glyph);
		this.#place = place;
		this.#waiting = Boolean(waiting);
		this.busy = busy;
	}

	get element() {
		return this.#element;
	}

	get busy() {
		return this.#busy;
	}

	set busy(value) {
		this.#busy = Boolean(value);
		this.#quiet();
		this.#element.toggleAttribute('data-busy', this.#busy);
		this.#render();
	}

	get waiting() {
		return this.#waiting;
	}

	/** Waits quiet for a step not yet taken, a press only going to `place` (true), or acts (false). */
	set waiting(value) {
		this.#waiting = Boolean(value);
		this.#quiet();
	}

	get disabled() {
		return this.#disabled;
	}

	set disabled(value) {
		this.#disabled = Boolean(value);
		if (this.#element.tagName === 'BUTTON') this.#element.disabled = this.#disabled;
	}

	set label(value) {
		this.#label = value;
		this.#render();
	}

	/** The accessible name when it differs from the words (a bare button's name and tooltip), or null for its words. */
	set name(value) {
		this.#name = value || null;
		if (this.#bare) return this.#render();
		if (this.#name) this.#element.setAttribute('aria-label', this.#name);
		else this.#element.removeAttribute('aria-label');
	}

	get bare() {
		return this.#bare;
	}

	/** Draws the glyph alone (true) or with its words (false); a button without a glyph keeps its words. */
	set bare(value) {
		const bare = Boolean(value && this.#glyph);
		if (bare === this.#bare) return;
		this.#bare = bare;
		this.#render();
	}

	/** Replaces the glyph (a copy's check for a moment), drawn while the button is not busy. */
	set glyph(name) {
		this.#glyph = name ?? null;
		if (!this.#glyph) this.#bare = false;
		this.#render();
	}

	destroy() {
		this.#hint?.destroy();
		this.#hint = null;
		super.destroy();
	}

	/** Runs an asynchronous action while busy; presses during it are ignored. Rethrows its failure. */
	async run(work) {
		if (this.#busy) return undefined;
		this.busy = true;
		try {
			return await work();
		} finally {
			if (!this.destroyed) this.busy = false;
		}
	}

	#press(event, handler) {
		if (!this.#hold(event)) handler?.(event);
	}

	/** Holds a press while busy or waiting; while waiting it only puts the person at `place()`, saying nothing. */
	#hold(event) {
		if (!this.#busy && !this.#waiting) return false;
		event.preventDefault();
		event.stopImmediatePropagation();
		if (!this.#busy) this.#place?.()?.focus();
		return true;
	}

	#quiet() {
		if (this.#busy || this.#waiting) this.#element.setAttribute('aria-disabled', 'true');
		else this.#element.removeAttribute('aria-disabled');
		// Its own wait is marked, so a form's or a Quiet's settling never frees it (0.35.0)
		this.#element.toggleAttribute('data-bui-waiting', this.#waiting);
	}

	#render() {
		const text = this.#busy && typeof this.#label === 'string' ? this.#labels.text('busy', { label: this.#label }) : this.#label;
		fill(this.#element, [
			this.#busy ? el('span', { class: 'bui-spinner', 'aria-hidden': 'true' }) : this.#glyph ? glyph(this.#glyph) : null,
			el('span', { class: this.#bare ? 'bui-hidden' : null }, [content(text)])
		]);
		this.#face(text);
	}

	/**
	 * A bare button's name and tooltip follow its words; once its words are drawn again its name is the
	 * label's own (or `name`). A button that never was bare is left as it is, whatever a product set on it.
	 */
	#face(text) {
		const element = this.#element;
		if (!this.#bare && !this.#hint) return;
		element.classList.toggle('bui-button-bare', this.#bare);
		element.toggleAttribute('data-bui-hint', this.#bare);
		if (this.#bare) {
			const words = typeof text === 'string' ? text : (text?.textContent ?? '');
			element.setAttribute('aria-label', this.#name ?? words);
			this.#hint ??= new Hint(element);
			return;
		}
		if (this.#name) element.setAttribute('aria-label', this.#name);
		else element.removeAttribute('aria-label');
		this.#hint.destroy();
		this.#hint = null;
	}
}
