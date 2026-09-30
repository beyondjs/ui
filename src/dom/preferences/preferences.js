import { Store } from './store.js';

const appearances = Object.freeze(['system', 'light', 'dark']);

/**
 * A person's language and appearance in one product (decision D07).
 *
 * Accounts holds the person's choice; the product applies it on arrival, when it learns who the
 * person is (`apply`), and keeps a copy on this device for the next first paint (`restore`). A change
 * made inside the product applies on this device only (`choose`) and lasts until the account's values
 * change: every arrival passes them to `apply`, which overrides the device choice only when they
 * differ from the account values it last applied on this device (the first arrival here, another
 * person, or a change made at Accounts). A reload therefore keeps the device choice. The product
 * offers "Change for all of Beyond" (`labels.everywhere`), a link to the Accounts account page,
 * because a product never writes the account setting.
 *
 * It sets `data-beyond-mode` (`light`, `dark`) on `<html>`, removes it for `system`, and sets `lang`
 * to the language. The device copy holds only the two values, never an account identifier. Storage
 * that is missing or refuses access is skipped: the values then last until the page closes.
 */
export class Preferences {
	/** The copy a product shows beside its own appearance and language choices, in English and Spanish. */
	static labels = Object.freeze({
		en: Object.freeze({ everywhere: 'Change for all of Beyond', appearance: 'Appearance', system: 'System', light: 'Light', dark: 'Dark', language: 'Language' }),
		es: Object.freeze({ everywhere: 'Cambiar en todo Beyond', appearance: 'Apariencia', system: 'Sistema', light: 'Claro', dark: 'Oscuro', language: 'Idioma' })
	});

	/** The appearances a person chooses from; `null` means never chosen, so the product's default applies. */
	static appearances = appearances;

	#store;
	#fallback;
	#locales;
	#root;
	#chosen = { appearance: null, locale: null };
	#account = null;
	#current;
	#listeners = new Set();

	/**
	 * @param {object} options
	 * @param {string} options.key the device copy's storage key, one per product (`beyond-projects`)
	 * @param {{appearance: 'system'|'light'|'dark', locale: string}} options.fallback the product's defaults
	 * @param {string[]} [options.locales] the languages the product is localized in (`en`, `es`)
	 * @param {Storage|null} [options.storage] where the device copy lives; `localStorage` when omitted
	 * @param {Element} [options.root] the element that carries the attributes; `<html>` when omitted
	 */
	constructor({ key, fallback, locales = ['en', 'es'], storage, root } = {}) {
		if (typeof key !== 'string' || !key) throw new TypeError('Preferences needs the key of its device copy');
		if (!appearances.includes(fallback?.appearance)) throw new TypeError(`The fallback appearance is one of ${appearances.join(', ')}`);
		if (!Array.isArray(locales) || !locales.includes(fallback.locale)) throw new TypeError('The fallback locale is one of the product\'s locales');
		this.#fallback = Object.freeze({ appearance: fallback.appearance, locale: fallback.locale });
		this.#locales = Object.freeze([...locales]);
		this.#store = new Store(key, storage);
		this.#root = root ?? globalThis.document?.documentElement ?? null;
		this.#current = this.#fallback;
	}

	/** The appearance in effect: the person's or device's choice, or the product's default. */
	get appearance() {
		return this.#current.appearance;
	}

	/** The language in effect. */
	get locale() {
		return this.#current.locale;
	}

	/** A frozen `{ appearance, locale }` of the values in effect; a new object only after a change. */
	get current() {
		return this.#current;
	}

	/** The product's defaults. */
	get fallback() {
		return this.#fallback;
	}

	/** The copy of `Preferences.labels` in the language in effect (English for any other). */
	get labels() {
		return Preferences.labels[this.#current.locale] ?? Preferences.labels.en;
	}

	/** First paint: applies the device copy, or the product's defaults where it has none. */
	restore() {
		const saved = this.#store.read();
		this.#chosen = { appearance: this.#appearance(saved?.appearance), locale: this.#locale(saved?.locale) };
		this.#account = saved?.account ?? null;
		return this.#update();
	}

	/**
	 * Arrival: the account's values win and become the device copy, unless they are the values this
	 * device last applied, in which case a choice made here since then stays. A missing, `null` or
	 * unknown appearance is unset (the product's default applies); a language the product is not
	 * localized in leaves its default.
	 */
	apply({ appearance = null, locale = null } = {}) {
		const account = { appearance: this.#appearance(appearance), locale: this.#locale(locale) };
		if (!this.#account) this.#account = this.#store.read()?.account ?? null;
		const known = this.#account?.appearance === account.appearance && this.#account?.locale === account.locale;
		if (!known) this.#chosen = account;
		this.#account = account;
		this.#store.write(this.#chosen, account);
		return this.#update();
	}

	/** A change made in the product: this device only, until the account's values change. Only the given values change. */
	choose(values = {}) {
		const next = { ...this.#chosen };
		if ('appearance' in values) {
			if (!appearances.includes(values.appearance)) throw new TypeError(`Choose an appearance among ${appearances.join(', ')}`);
			next.appearance = values.appearance;
		}
		if ('locale' in values) {
			if (!this.#locales.includes(values.locale)) throw new TypeError(`Choose a language among ${this.#locales.join(', ')}`);
			next.locale = values.locale;
		}
		this.#chosen = next;
		this.#store.write(next, this.#account);
		return this.#update();
	}

	/**
	 * Calls `listener(current)` after every change of the values in effect. Returns the release. It is
	 * safe to pass detached (`useSyncExternalStore(preferences.subscribe, …)`).
	 */
	subscribe = listener => {
		const own = value => listener(value);
		this.#listeners.add(own);
		return () => void this.#listeners.delete(own);
	};

	#appearance(value) {
		return appearances.includes(value) ? value : null;
	}

	#locale(value) {
		return this.#locales.includes(value) ? value : null;
	}

	#update() {
		const next = { appearance: this.#chosen.appearance ?? this.#fallback.appearance, locale: this.#chosen.locale ?? this.#fallback.locale };
		this.#paint(next);
		if (next.appearance === this.#current.appearance && next.locale === this.#current.locale) return this.#current;
		this.#current = Object.freeze(next);
		for (const listener of [...this.#listeners]) {
			try {
				listener(this.#current);
			} catch (error) {
				// One listener's failure must not stop the others or undo the change; it is reported apart.
				if (typeof globalThis.reportError === 'function') globalThis.reportError(error);
				else
					queueMicrotask(() => {
						throw error;
					});
			}
		}
		return this.#current;
	}

	#paint({ appearance, locale }) {
		if (!this.#root) return;
		if (appearance === 'system') this.#root.removeAttribute('data-beyond-mode');
		else this.#root.setAttribute('data-beyond-mode', appearance);
		this.#root.setAttribute('lang', locale);
	}
}
