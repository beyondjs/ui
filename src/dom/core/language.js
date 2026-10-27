/**
 * The language a component speaks (0.44.0).
 *
 * A component carries its copy in one set per language (`X.labels.en`, `.es`). The language is, in
 * order: the component's own `locale` (`es-AR` speaks `es`) when the set has that language; else the
 * page's language, `<html lang>`, which `Preferences` sets (D07), when the set has it; else English.
 * The page's language is read at each call, so a product that sets it after a component was made is
 * followed on that component's next draw.
 */
export class Language {
	#locale;

	/** @param {string} [locale] the component's own BCP 47 tag, when the product gave one */
	constructor(locale = undefined) {
		this.#locale = locale;
	}

	/** The language of a BCP 47 tag (`es-AR` → `es`), or `null` for none. */
	static of(tag) {
		const code = String(tag ?? '').trim().toLowerCase().split(/[-_]/)[0];
		return code || null;
	}

	/** The page's language: `<html lang>` as it is now, or `null` without a document or a `lang`. */
	static get page() {
		return Language.of(globalThis.document?.documentElement?.getAttribute?.('lang'));
	}

	/**
	 * The tag `Intl` formats dates and numbers in (0.44.0): the component's own `locale`; else the page's
	 * `<html lang>` when its language is not the runtime's, so a Spanish page in an English browser says its
	 * dates in Spanish beside its Spanish words; else none, and `Intl` keeps the runtime's own regional form.
	 */
	static tag(locale = undefined) {
		if (locale) return locale;
		const page = globalThis.document?.documentElement?.getAttribute?.('lang')?.trim();
		if (!page) return undefined;
		const runtime = new Intl.DateTimeFormat().resolvedOptions().locale;
		return Language.of(page) === Language.of(runtime) ? undefined : page;
	}

	/** The language among `known` (a set's languages) this component speaks now; `en` when none fits. */
	choose(known) {
		const own = Language.of(this.#locale);
		if (own && known.includes(own)) return own;
		const page = Language.page;
		if (page && known.includes(page)) return page;
		return 'en';
	}
}
