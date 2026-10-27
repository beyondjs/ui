import { Language } from './language.js';

/**
 * Interface copy of one component.
 *
 * Products localize: each component takes a `labels` option whose entries replace the defaults it
 * declares. An entry is a string with `{name}` placeholders or a function of the values, which is how a
 * consumer writes plurals and word order for its own language.
 *
 * A component's defaults are its set, one entry list per language (`X.labels`, with `en` and `es`).
 * Since 0.44.0 the set's language is chosen by one rule (`Language`): the component's `locale` when the
 * set has its language, else the page's `<html lang>` (which `Preferences` sets, D07), else English. The
 * given `labels` win, and the keys they leave out come from the chosen language, not from English; a key
 * the chosen language lacks comes from English. The page's language is read at each `text()`, so a
 * component follows a `lang` set after it was made on its next draw. Defaults given as one plain entry
 * list (the earlier form) are used as they are, in any language.
 */
export class Labels {
	#defaults;
	#given;
	#language;
	#entries = new Map();

	/**
	 * @param {object} defaults the component's set (`{ en, es }`), or one plain entry list
	 * @param {object} [given] the product's entries, which win
	 * @param {string} [locale] the component's own BCP 47 tag, which chooses the set's language first
	 */
	constructor(defaults, given = {}, locale = undefined) {
		this.#defaults = defaults ?? {};
		this.#given = given ?? {};
		this.#language = new Language(locale);
	}

	/** A set has an entry list per language, English first; one plain entry list is not a set. */
	static #set(value) {
		return Boolean(value?.en) && typeof value.en === 'object';
	}

	/** The language these entries speak now: `en`, `es`, … (`en` for a plain entry list). */
	get language() {
		return Labels.#set(this.#defaults) ? this.#language.choose(Object.keys(this.#defaults)) : 'en';
	}

	/** Every entry in the language in effect, the given ones applied; a new object each call. */
	get entries() {
		return { ...this.#current() };
	}

	/** The text of one entry with its values applied. Unknown entries return their key. */
	text(key, values = {}) {
		const entry = this.#current()[key];
		if (typeof entry === 'function') return String(entry(values));
		if (entry === undefined || entry === null) return key;
		return String(entry).replace(/\{(\w+)\}/g, (match, name) => (name in values ? String(values[name]) : match));
	}

	/** A copy with further entries replaced, choosing its language by the same rule. */
	with(given) {
		const copy = new Labels(this.#defaults, { ...this.#given, ...(given ?? {}) });
		copy.#language = this.#language;
		return copy;
	}

	#current() {
		const defaults = this.#defaults;
		if (!Labels.#set(defaults)) return this.#entries.get('') ?? this.#keep('', { ...defaults, ...this.#given });
		const language = this.language;
		return this.#entries.get(language) ?? this.#keep(language, { ...defaults.en, ...defaults[language], ...this.#given });
	}

	#keep(language, entries) {
		this.#entries.set(language, entries);
		return entries;
	}
}
