import { Component } from '../core/component.js';
import { el } from '../core/element.js';
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
 * effect, English and Spanish.
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
	#dialog = null;

	/**
	 * @param {object} options
	 * @param {Preferences} options.preferences the product's own instance
	 * @param {string|null} options.everywhere the account page at Accounts ("Change for all of Beyond")
	 * @param {string[]} [options.locales] the languages offered (default English and Spanish)
	 */
	constructor({ preferences, everywhere = null, locales = ['en', 'es'] }) {
		super();
		if (!(preferences instanceof Preferences)) throw new TypeError('PreferencesDialog needs the product\'s Preferences');
		this.#preferences = preferences;
		this.#everywhere = everywhere;
		this.#locales = locales;
	}

	/** The open dialog's element, or a detached placeholder while closed. */
	get element() {
		return this.#dialog?.element ?? el('span', { hidden: true });
	}

	/**
	 * Opens the dialog; resolves when it closes. Opening it again while open does nothing.
	 *
	 * @param {{restore?: Element|null}} [options] where focus returns when what opened it is gone or hidden
	 */
	async open({ restore = null } = {}) {
		if (this.#dialog) return null;
		this.#dialog = this.#build(restore);
		try {
			return await this.#dialog.open();
		} finally {
			this.#dialog?.destroy();
			this.#dialog = null;
		}
	}

	destroy() {
		this.#dialog?.destroy();
		this.#dialog = null;
		super.destroy();
	}

	#build(restore) {
		const preferences = this.#preferences;
		const words = preferences.labels;
		const own = PreferencesDialog.labels[preferences.locale] ?? PreferencesDialog.labels.en;
		const language = new Select({
			name: 'locale',
			value: preferences.locale,
			options: this.#locales.map(locale => ({ value: locale, label: own.names[locale] ?? locale })),
			onchange: locale => preferences.choose({ locale })
		});
		const appearance = new Select({
			name: 'appearance',
			value: preferences.appearance,
			options: Preferences.appearances.map(value => ({ value, label: words[value] })),
			onchange: value => preferences.choose({ appearance: value })
		});
		const note = el('p', { class: 'bui-preferences-note' }, [own.note, this.#everywhere ? ' ' : null, this.#everywhere ? el('a', { href: this.#everywhere, text: words.everywhere }) : null]);
		const dialog = new Dialog({
			title: own.title,
			size: 'small',
			restore,
			children: [new Field({ label: words.language, control: language }).element, new Field({ label: words.appearance, control: appearance }).element, note],
			actions: [new Button({ label: own.done, variant: 'primary', onclick: () => dialog.close(true) }).element]
		});
		return dialog;
	}
}
