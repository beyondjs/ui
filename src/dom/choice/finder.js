import { el } from '../core/element.js';
import { glyph } from '../core/icons.js';

/**
 * Finding an entry of an open `ChoiceMenu` by its words.
 *
 * A long list (more than `ChoiceMenu.threshold` options, or `search: true`) opens with a search field
 * above the options: typing filters them, ignoring case and accents, by the beginning of the text or
 * of any segment after `/`, `-`, `_`, `.` or a space, so "login" finds `feature/login-page`. A short
 * list keeps the menu pattern's type-ahead instead: printable keys move focus to the next option
 * whose text starts with what was typed in the last half second.
 */
export class ChoiceFinder {
	static #separators = /[/\-_.\s]/;

	#field = null;
	#element = null;
	#none;
	#typed = '';
	#at = 0;

	/**
	 * @param {object} options
	 * @param {boolean} options.search whether the list has a search field
	 * @param {string} options.label the field's accessible name
	 * @param {string} options.controls the id of the menu it filters
	 * @param {(event: KeyboardEvent) => void} options.onkeys keys pressed in the field
	 * @param {() => void} options.oninput the query changed
	 */
	constructor({ search, label, controls, onkeys, oninput }) {
		this.#none = el('p', { class: 'bui-choice-none', role: 'status' });
		if (!search) return;
		this.#field = el('input', { type: 'search', class: 'bui-input bui-choice-field', 'aria-label': label, 'aria-controls': controls, placeholder: label, autocomplete: 'off', spellcheck: 'false', onkeydown: onkeys, oninput });
		this.#element = el('div', { class: 'bui-choice-search' }, [glyph('search'), this.#field]);
	}

	/** The field with its glyph, or null for a short list. */
	get element() {
		return this.#element;
	}

	get field() {
		return this.#field;
	}

	/** The line that says nothing matches, below the options. */
	get none() {
		return this.#none;
	}

	get query() {
		return this.#field?.value.trim() ?? '';
	}

	/** Empties the field. */
	clear() {
		if (this.#field) this.#field.value = '';
	}

	/** Text without case or accents, for comparing. */
	static fold(text) {
		return String(text ?? '')
			.normalize('NFD')
			.replace(/[̀-ͯ]/g, '')
			.toLowerCase();
	}

	/** Whether `text` begins with `query`, or has a segment that does. */
	static match(text, query) {
		const folded = ChoiceFinder.fold(text);
		const wanted = ChoiceFinder.fold(query).trim();
		if (!wanted || folded.startsWith(wanted)) return true;
		for (let index = 1; index < folded.length; index += 1) {
			if (ChoiceFinder.#separators.test(folded[index - 1]) && folded.startsWith(wanted, index)) return true;
		}
		return false;
	}

	/**
	 * Type-ahead: the entry to focus after `key` was typed at `now`, among `entries` from the one at
	 * `index`; null when `key` is not a printable character or nothing starts with what was typed.
	 */
	ahead(key, now, entries, index) {
		if (typeof key !== 'string' || key.length !== 1 || !key.trim()) return null;
		this.#typed = now - this.#at > 500 ? key : this.#typed + key;
		this.#at = now;
		// The same letter again moves on to the next entry that starts with it.
		const repeated = [...this.#typed].every(letter => letter === key);
		const typed = ChoiceFinder.fold(repeated ? key : this.#typed);
		const start = repeated ? index + 1 : index;
		const order = entries.map((entry, position) => entries[(start + position) % entries.length]);
		return order.find(entry => ChoiceFinder.fold(entry.text).startsWith(typed)) ?? null;
	}
}
