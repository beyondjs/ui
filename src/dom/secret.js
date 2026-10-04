import { Component } from './core/component.js';
import { el, fill, content } from './core/element.js';
import { Ids } from './core/ids.js';
import { Labels } from './core/labels.js';
import { status } from './feedback.js';

const words = {
	en: {
		paste: 'Paste the {credential} instead',
		last: 'Only when connecting isn’t possible: a pasted {credential} stays as it is until someone replaces it.',
		field: 'The {credential}',
		stored: 'Stored',
		replace: 'Replace',
		keep: 'Keep the stored {credential}'
	},
	es: {
		paste: 'Pegar el {credential} en su lugar',
		last: 'Solo si no es posible conectar: el {credential} pegado queda como está hasta que alguien lo reemplace.',
		field: 'El {credential}',
		stored: 'Guardado',
		replace: 'Reemplazar',
		keep: 'Conservar el {credential} guardado'
	}
};

/**
 * A secret with the integration first (FR-2, D56, shared piece 4): connecting with the provider is the
 * primary action, and pasting a credential is folded beneath it, labeled as the last resort.
 *
 * A held secret reads "Stored · Replace" and is never shown or prefilled; until the person presses
 * Replace there is no enabled input, so a form submits nothing for it and the stored one is kept
 * ("Keep the stored {credential}" goes back to that). A closed fold submits nothing either. The input
 * is a password field the browser neither fills nor remembers, and the component keeps no draft.
 * `value` is the pasted text while an input is open, else null.
 */
export class SecretField extends Component {
	/** The copy in English and Spanish. */
	static labels = Object.freeze({ en: Object.freeze(words.en), es: Object.freeze(words.es) });

	#element;
	#body;
	#labels;
	#options;
	#input;
	#stored;
	#replacing = false;

	/**
	 * @param {object} options
	 * @param {string|Node} options.label what the secret is for ("Supabase access")
	 * @param {{label: string, run?: () => void, href?: string}|null} [options.connect] the provider's own authorization
	 * @param {string} [options.credential] the pasted thing's name ("access token")
	 * @param {boolean} [options.stored] a secret is held
	 * @param {string|Node|null} [options.hint]
	 * @param {string|null} [options.name] the input's form name
	 */
	constructor({ label, connect = null, credential = 'token', stored = false, hint = null, name = null, labels = {} }) {
		super();
		this.#labels = new Labels(words.en, labels);
		this.#options = { connect, credential, name };
		this.#stored = Boolean(stored);
		const id = Ids.next('bui-secret');
		this.#input = el('input', { id: `${id}-input`, type: 'password', class: 'bui-input', name, autocomplete: 'off', spellcheck: 'false', 'data-1p-ignore': true, 'data-lpignore': 'true', disabled: true });
		this.#body = el('div', { class: 'bui-secret-body' });
		this.#element = el('fieldset', { class: 'bui-secret', 'aria-describedby': hint ? `${id}-hint` : null }, [
			el('legend', { class: 'bui-field-label' }, [content(label)]),
			hint ? el('p', { id: `${id}-hint`, class: 'bui-field-hint' }, [content(hint)]) : null,
			this.#connect(),
			this.#body
		]);
		this.#draw();
	}

	get element() {
		return this.#element;
	}

	/** The password input (enabled only while open). */
	get control() {
		return this.#input;
	}

	/** The pasted text while an input is open, else null (a held secret is then kept). */
	get value() {
		return this.#input.disabled ? null : this.#input.value;
	}

	get stored() {
		return this.#stored;
	}

	/** Whether a secret is held; a new answer closes any replacement and forgets its text. */
	set stored(value) {
		this.#stored = Boolean(value);
		this.#replacing = false;
		this.#draw();
	}

	#connect() {
		const connect = this.#options.connect;
		if (!connect?.label) return null;
		const props = { class: 'bui-button bui-button-primary bui-secret-connect' };
		return connect.href ? el('a', { ...props, href: connect.href }, [connect.label]) : el('button', { ...props, type: 'button', onclick: () => connect.run?.() }, [connect.label]);
	}

	#draw() {
		const credential = this.#options.credential;
		this.#input.value = '';
		const field = el('div', { class: 'bui-field bui-secret-field' }, [el('label', { class: 'bui-field-label', for: this.#input.id, text: this.#labels.text('field', { credential }) }), this.#input]);
		if (this.#stored) {
			this.#input.disabled = !this.#replacing;
			const action = this.#replacing
				? el('button', { type: 'button', class: 'bui-link-button', onclick: () => this.#replace(false) }, [this.#labels.text('keep', { credential })])
				: el('button', { type: 'button', class: 'bui-link-button', onclick: () => this.#replace(true) }, [this.#labels.text('replace')]);
			return fill(this.#body, [el('p', { class: 'bui-secret-stored' }, [status(this.#labels.text('stored'), 'success'), el('span', { 'aria-hidden': 'true', text: ' · ' }), action]), this.#replacing ? field : null]);
		}
		const fold = el('details', { class: 'bui-secret-fold' }, [el('summary', { class: 'bui-secret-summary', text: this.#labels.text('paste', { credential }) }), el('div', { class: 'bui-secret-inside' }, [el('p', { class: 'bui-secret-last', text: this.#labels.text('last', { credential }) }), field])]);
		fold.addEventListener('toggle', () => {
			this.#input.disabled = !fold.open;
			if (!fold.open) this.#input.value = '';
		});
		this.#input.disabled = true;
		fill(this.#body, [fold]);
	}

	#replace(open) {
		this.#replacing = open;
		this.#draw();
		if (open) this.#input.focus();
		else this.#body.querySelector('.bui-link-button')?.focus();
	}
}
