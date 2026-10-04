import { Component } from '../core/component.js';
import { el, fill } from '../core/element.js';
import { Button } from '../button.js';
import { Dialog } from '../dialog.js';
import { Field } from '../field.js';
import { Select } from '../select.js';
import { Preferences } from './preferences.js';

/**
 * "Language and appearance" (decision D54, over D07): the one place a product offers its person's
 * language and appearance, a small dialog the profile menu's product group opens (the family bar's
 * `account.preferences`). A choice applies at once, on this device only (`Preferences.choose`); "Change
 * for all of Beyond" leads to the account page at Accounts, the only place that changes them
 * everywhere, because a product never writes the account setting. Its copy follows the language in
 * effect, English and Spanish, and changes in place when the person chooses another language, so the
 * dialog stays open with focus where it was.
 *
 * Since 0.6.2 it outlives the bar that opened it: a product that draws its bar again when the
 * language changes (its labels change) leaves the open dialog open (`leave()`), and closing it returns
 * focus to the profile button in view (`open({ restore })` takes a function). `everywhere` may be a
 * function, asked each time the dialog opens, so the address carries the page the person is on.
 */
export class PreferencesDialog extends Component {
	/** The dialog's own copy; the field names come from `Preferences.labels`. */
	static labels = Object.freeze({
		en: Object.freeze({ title: 'Language and appearance', note: 'Applies on this device.', done: 'Done', names: Object.freeze({ en: 'English', es: 'Español' }) }),
		es: Object.freeze({ title: 'Idioma y apariencia', note: 'Se aplica en este dispositivo.', done: 'Listo', names: Object.freeze({ en: 'English', es: 'Español' }) })
	});

	#preferences;
	#everywhere;
	#locales;
	#parts = null;
	#release = null;
	#left = false;
	#onclose;

	/**
	 * @param {object} options
	 * @param {Preferences} options.preferences the product's own instance
	 * @param {string|(() => string|null)|null} options.everywhere the account page at Accounts ("Change for all of Beyond"), or a function asked at each opening
	 * @param {string[]} [options.locales] the languages offered (default English and Spanish)
	 * @param {(() => void)|null} [options.onclose] called once the dialog closed (0.6.2); a product that
	 *   follows each choice subscribes to its `Preferences` instead, which says every change
	 */
	constructor({ preferences, everywhere = null, locales = ['en', 'es'], onclose = null }) {
		super();
		if (!(preferences instanceof Preferences)) throw new TypeError('PreferencesDialog needs the product\'s Preferences');
		this.#preferences = preferences;
		this.#everywhere = everywhere;
		this.#locales = locales;
		this.#onclose = onclose;
	}

	/** The open dialog's element, or a detached placeholder while closed. */
	get element() {
		return this.#parts?.dialog.element ?? el('span', { hidden: true });
	}

	/** Whether the dialog is open now. */
	get shown() {
		return Boolean(this.#parts);
	}

	/**
	 * Opens the dialog; resolves when it closes. Opening it again while open does nothing.
	 *
	 * @param {{restore?: Element|(() => Element|null)|null}} [options] where focus returns when what opened it is gone or hidden
	 */
	async open({ restore = null } = {}) {
		if (this.#parts || this.destroyed) return null;
		const dialog = this.#build(typeof restore === 'function' ? null : restore);
		this.#release = this.#preferences.subscribe(() => this.#words());
		let value = null;
		try {
			value = await dialog.open();
		} finally {
			this.#close();
		}
		const document = globalThis.document;
		if (typeof restore === 'function' && (!document.activeElement || document.activeElement === document.body)) restore()?.focus?.();
		if (this.#left) this.destroy();
		this.#onclose?.();
		return value;
	}

	/**
	 * Its opener is going away (the bar drawn again): an open dialog stays until the person closes it,
	 * then releases itself; a closed one is released now.
	 */
	leave() {
		if (this.#parts) this.#left = true;
		else this.destroy();
	}

	destroy() {
		this.#close();
		super.destroy();
	}

	#close() {
		this.#release?.();
		this.#release = null;
		const parts = this.#parts;
		this.#parts = null;
		parts?.dialog.destroy();
	}

	/** The copy in the language in effect. */
	get #own() {
		return PreferencesDialog.labels[this.#preferences.locale] ?? PreferencesDialog.labels.en;
	}

	#build(restore) {
		const preferences = this.#preferences;
		const language = new Select({
			name: 'locale',
			value: preferences.locale,
			options: this.#locales.map(locale => ({ value: locale, label: this.#own.names[locale] ?? locale })),
			onchange: locale => preferences.choose({ locale })
		});
		const appearance = new Select({ name: 'appearance', value: preferences.appearance, options: Preferences.appearances.map(value => ({ value, label: preferences.labels[value] })), onchange: value => preferences.choose({ appearance: value }) });
		const fields = [new Field({ label: preferences.labels.language, control: language }), new Field({ label: preferences.labels.appearance, control: appearance })];
		const note = el('p', { class: 'bui-preferences-note' });
		const done = new Button({ label: this.#own.done, variant: 'primary', onclick: () => dialog.close(true) });
		const dialog = new Dialog({ title: this.#own.title, size: 'small', restore, children: [...fields.map(field => field.element), note], actions: [done.element] });
		const address = typeof this.#everywhere === 'function' ? this.#everywhere() : this.#everywhere;
		this.#parts = { dialog, fields, appearance, note, done, address };
		this.#words();
		return dialog;
	}

	/** Writes the copy of the language in effect into the open dialog, without moving focus. */
	#words() {
		const parts = this.#parts;
		if (!parts) return;
		const words = this.#preferences.labels;
		const own = this.#own;
		parts.dialog.title = own.title;
		const [language, appearance] = parts.fields.map(field => field.element.querySelector('label'));
		if (language) language.textContent = words.language;
		if (appearance) appearance.textContent = words.appearance;
		for (const option of parts.appearance.control.options) option.textContent = words[option.value];
		fill(parts.note, [own.note, parts.address ? ' ' : null, parts.address ? el('a', { href: parts.address, text: words.everywhere }) : null]);
		parts.done.label = own.done;
	}
}
