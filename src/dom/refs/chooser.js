import { Component } from '../core/component.js';
import { el, fill } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Ids } from '../core/ids.js';
import { Labels } from '../core/labels.js';
import { skeleton } from '../feedback.js';
import { ChoiceMenu } from '../choice/menu.js';
import { OtherRef } from './other.js';
import { labels as copy } from './labels.js';

/**
 * Choosing a branch or another Git ref (D56, shared piece 3): the default branch first and marked,
 * the others after it, and "Use a commit or another ref…" as the escape to a field in place.
 *
 * It is a `ChoiceMenu` (arrows, type-ahead, Enter, Escape), with a search field once the list is
 * longer than `ChoiceMenu.threshold`, matching the beginning of a name or of any segment
 * (`feature/…`). A value that is not one of the refs (a commit, a tag) is listed first with "Commit or
 * other ref". Its states are told apart: loading (a placeholder line, never a made-up list),
 * unavailable ("Couldn't read the branches", Try again, the escape still usable) and empty (no
 * branches, the escape). With `layout: 'field'` (default) its label sits above the control, as a
 * form's; `'inline'` names it on the button ("Branch: main"), for a composer's toolbar.
 *
 * Refs: `{ name, default?, note? }`. `onchange(value)` runs for each new choice; setting `value`,
 * `refs`, `loading` or `unavailable` redraws without calling it.
 */
export class RefChooser extends Component {
	/** The copy in English and Spanish. */
	static labels = copy;

	#element;
	#body;
	#menu;
	#other;
	#labels;
	#label;
	#refs = [];
	#value;
	#loading;
	#unavailable;
	#escape;
	#onchange;

	/**
	 * @param {object} options
	 * @param {string} [options.label] what is chosen ("Base branch"); `labels.label` by default
	 * @param {Array<{name: string, default?: boolean, note?: string}>} [options.refs]
	 * @param {string|null} [options.value] the ref chosen
	 * @param {boolean} [options.loading] the refs are being read
	 * @param {{text?: string, retry?: () => void}|null} [options.unavailable] the refs could not be read
	 * @param {boolean} [options.escape] offers "Use a commit or another ref…" (default true)
	 * @param {(value: string) => string|null} [options.validate] the product's own rule for a typed ref
	 * @param {'field'|'inline'} [options.layout]
	 * @param {string|null} [options.name] submits the value with a form
	 * @param {(value: string) => void} [options.onchange]
	 */
	constructor({ label = null, refs = [], value = null, loading = false, unavailable = null, escape = true, validate = null, layout = 'field', name = null, onchange = null, labels = {} } = {}) {
		super();
		this.#labels = new Labels(copy.en, labels);
		this.#label = label ?? this.#labels.text('label');
		this.#value = value;
		this.#loading = loading;
		this.#unavailable = unavailable;
		this.#escape = escape;
		this.#onchange = onchange;
		const id = Ids.next('bui-refs');
		this.#menu = new ChoiceMenu({ label: this.#label, options: [], name, search: 'auto', statement: !escape, labels: { search: this.#labels.text('search'), none: ({ query }) => this.#labels.text('none', { query }) }, onchange: chosen => this.#chosen(chosen) });
		this.#menu.control.id = `${id}-button`;
		this.#other = new OtherRef({ labels: this.#labels, validate, onuse: chosen => this.#chosen(chosen), oncancel: () => this.#menu.control.focus() });
		this.#body = el('div', { class: 'bui-refs-body' });
		const heading = layout === 'field' ? el('label', { class: 'bui-field-label', for: `${id}-button`, id: `${id}-label`, text: this.#label }) : null;
		this.#element = el('div', { class: `bui-refs bui-refs-${layout === 'inline' ? 'inline' : 'field'}` }, [heading, this.#body, this.#other.element]);
		this.#refs = [...(refs ?? [])].filter(ref => ref?.name);
		this.#draw();
	}

	get element() {
		return this.#element;
	}

	/** The menu's button, for focus. */
	get control() {
		return this.#menu.control;
	}

	get value() {
		return this.#value;
	}

	/** Chooses a ref without calling `onchange`. */
	set value(value) {
		this.#value = value ?? null;
		this.#draw();
	}

	/** Replaces the refs (a late or refreshed list): loading and unavailable end. */
	set refs(refs) {
		this.#refs = [...(refs ?? [])].filter(ref => ref?.name);
		this.#loading = false;
		this.#unavailable = null;
		this.#draw();
	}

	set loading(loading) {
		this.#loading = Boolean(loading);
		this.#draw();
	}

	/** `{ text?, retry? }` when the refs could not be read, or null. */
	set unavailable(unavailable) {
		this.#unavailable = unavailable ?? null;
		if (unavailable) this.#loading = false;
		this.#draw();
	}

	/** Opens the escape field. */
	other() {
		this.#menu.close(false);
		this.#other.show(this.#custom() ? this.#value : '');
	}

	focus() {
		this.#menu.control.focus();
	}

	destroy() {
		this.#menu.destroy();
		super.destroy();
	}

	#draw() {
		const escape = this.#escape ? this.#link() : null;
		if (this.#loading) return fill(this.#body, [el('p', { class: 'bui-hidden', role: 'status', text: this.#labels.text('loading') }), skeleton(1)]);
		if (this.#unavailable) {
			const retry = this.#unavailable.retry ? el('button', { type: 'button', class: 'bui-button bui-button-secondary bui-button-small', onclick: () => this.#unavailable?.retry?.() }, [glyph('refresh'), el('span', { text: this.#labels.text('retry') })]) : null;
			return fill(this.#body, [el('p', { class: 'bui-refs-problem', role: 'status', text: this.#unavailable.text ?? this.#labels.text('unavailable') }), el('div', { class: 'bui-refs-actions' }, [retry, escape])]);
		}
		if (!this.#refs.length && !this.#custom()) return fill(this.#body, [el('p', { class: 'bui-refs-empty', role: 'status', text: this.#labels.text('empty') }), escape]);
		this.#menu.options = this.#options();
		this.#menu.actions = this.#escape ? [{ label: this.#labels.text('escape'), run: () => this.other() }] : [];
		this.#menu.value = this.#value;
		if (this.#menu.element.parentNode !== this.#body) fill(this.#body, [this.#menu.element]);
	}

	/** The custom value first, then the default branch, then the others in the order given. */
	#options() {
		const sorted = [...this.#refs.filter(ref => ref.default), ...this.#refs.filter(ref => !ref.default)];
		const options = sorted.map(ref => ({ value: ref.name, label: ref.name, detail: ref.note ?? null, status: ref.default ? [this.#labels.text('default'), 'neutral'] : null }));
		return this.#custom() ? [{ value: this.#value, label: this.#value, detail: this.#labels.text('custom') }, ...options] : options;
	}

	#custom() {
		return Boolean(this.#value) && !this.#refs.some(ref => ref.name === this.#value);
	}

	#link() {
		return el('button', { type: 'button', class: 'bui-link-button bui-refs-escape', onclick: () => this.other() }, [this.#labels.text('escape')]);
	}

	#chosen(value) {
		const changed = value !== this.#value;
		this.#value = value;
		this.#draw();
		this.#menu.control.focus({ preventScroll: true });
		if (changed) this.#onchange?.(value);
	}
}
