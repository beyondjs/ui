import { Component } from '../core/component.js';
import { el, content } from '../core/element.js';
import { Ids } from '../core/ids.js';
import { Labels } from '../core/labels.js';

const defaults = { allow: 'Allow', deny: 'Deny', more: 'Show all', less: 'Show less', allowed: 'Allowed', denied: 'Denied', working: 'Sending your answer…', failed: 'Your answer did not reach it. Try again.' };

/**
 * A request that waits for the person's answer (0.15.0, DQ-13): an agent asks to run a command, write a
 * file or reach a host. The card is the present state of the work, said once: a neutral raised surface
 * with an attention edge, its title, the command whole in a wrapping monospace block (folded past
 * `CommandCard.lines` lines with Show all), an optional scope ("Always allow commands like this") and two
 * actions with their keys: Enter allows and Escape denies while focus is inside the card. `focus()` takes
 * the person there on arrival. An answer is sent once (`allow` and `deny` may return a promise); a failed
 * one is said in place and the actions come back. Then the card states the outcome: `allowed` or `denied`.
 * Products bring the words of their request and what each answer does.
 */
export class CommandCard extends Component {
	/** The copy in English and Spanish. */
	static labels = Object.freeze({ en: Object.freeze({ ...defaults }), es: Object.freeze({ allow: 'Permitir', deny: 'Rechazar', more: 'Ver todo', less: 'Ver menos', allowed: 'Permitido', denied: 'Rechazado', working: 'Enviando tu respuesta…', failed: 'Tu respuesta no llegó. Vuelve a intentarlo.' }) });
	/** Lines of a command shown before Show all. */
	static lines = 8;

	#element;
	#labels;
	#state = 'pending';
	#busy = false;
	#scope = null;
	#actions;
	#line = el('p', { class: 'bui-command-line', role: 'status' });
	#handlers;

	/**
	 * @param {object} options
	 * @param {string|Node} options.title what is asked ("Claude Code asks to run a command")
	 * @param {string} options.command the command or content, shown whole
	 * @param {string|Node|null} [options.detail] one line of context (where it runs)
	 * @param {{label: string, checked?: boolean}|null} [options.scope] a choice that widens the answer
	 * @param {(answer: {scope: boolean}) => unknown} options.allow
	 * @param {(answer: {scope: boolean}) => unknown} options.deny
	 * @param {'pending'|'allowed'|'denied'} [options.state]
	 */
	constructor({ title, command, detail = null, scope = null, allow, deny, state = 'pending', labels = {} }) {
		super();
		this.#labels = new Labels(defaults, labels);
		this.#handlers = { allow, deny };
		const id = Ids.next('bui-command');
		const code = el('pre', { class: 'bui-command-code' }, [el('code', { text: String(command ?? '') })]);
		const long = String(command ?? '').split('\n').length > CommandCard.lines;
		const toggle = long ? el('button', { type: 'button', class: 'bui-link-button bui-command-toggle', 'aria-expanded': 'false', onclick: () => this.#unfold(code, toggle) }, [this.#labels.text('more')]) : null;
		if (long) code.setAttribute('data-folded', '');
		this.#scope = scope ? el('input', { type: 'checkbox', class: 'bui-command-scope', checked: Boolean(scope.checked) }) : null;
		this.#actions = el('div', { class: 'bui-command-actions' }, [this.#button('allow', 'primary', '⏎'), this.#button('deny', 'secondary', 'Esc')]);
		this.#element = el('section', { class: 'bui-command', tabindex: '-1', 'aria-labelledby': `${id}-title`, onkeydown: event => this.#keys(event) }, [
			el('p', { id: `${id}-title`, class: 'bui-command-title' }, [content(title)]),
			detail ? el('p', { class: 'bui-command-detail' }, [content(detail)]) : null,
			code,
			toggle,
			this.#scope ? el('label', { class: 'bui-command-choice' }, [this.#scope, el('span', { text: scope.label })]) : null,
			this.#actions,
			this.#line
		]);
		this.state = state;
	}

	get element() {
		return this.#element;
	}

	get state() {
		return this.#state;
	}

	/** `pending` offers the answers; `allowed` and `denied` state the outcome in place of them. */
	set state(state) {
		this.#state = ['allowed', 'denied'].includes(state) ? state : 'pending';
		this.#element.dataset.state = this.#state;
		this.#actions.hidden = this.#state !== 'pending';
		if (this.#scope) this.#scope.disabled = this.#state !== 'pending';
		this.#line.textContent = this.#state === 'pending' ? '' : this.#labels.text(this.#state);
	}

	/** Takes focus on arrival, so Enter and Escape answer at once. */
	focus() {
		this.#element.focus({ preventScroll: false });
	}

	/** Answers as the person would: `allow` or `deny`; resolves whether the answer was taken. */
	async answer(kind) {
		if (this.#busy || this.#state !== 'pending' || !['allow', 'deny'].includes(kind)) return false;
		this.#busy = true;
		this.#element.setAttribute('aria-busy', 'true');
		this.#line.textContent = this.#labels.text('working');
		try {
			await this.#handlers[kind]?.({ scope: Boolean(this.#scope?.checked) });
			if (!this.destroyed) this.state = kind === 'allow' ? 'allowed' : 'denied';
			return true;
		} catch {
			if (!this.destroyed) this.#line.textContent = this.#labels.text('failed');
			return false;
		} finally {
			this.#busy = false;
			this.#element.removeAttribute('aria-busy');
		}
	}

	#button(kind, variant, key) {
		return el('button', { type: 'button', class: `bui-button bui-button-${variant} bui-button-small`, 'aria-keyshortcuts': key === '⏎' ? 'Enter' : 'Escape', onclick: () => this.answer(kind) }, [el('span', { text: this.#labels.text(kind) }), el('kbd', { class: 'bui-keys', 'aria-hidden': 'true', text: key })]);
	}

	/** Enter allows and Escape denies while focus is in the card, never from its own controls' keys. */
	#keys(event) {
		if (this.#state !== 'pending' || event.defaultPrevented || event.isComposing) return;
		const target = event.target;
		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			this.answer('deny');
		} else if (event.key === 'Enter' && !event.shiftKey && (target === this.#element || target.localName === 'pre' || target === this.#scope)) {
			event.preventDefault();
			this.answer('allow');
		}
	}

	#unfold(code, toggle) {
		const folded = code.toggleAttribute('data-folded');
		toggle.setAttribute('aria-expanded', String(!folded));
		toggle.textContent = this.#labels.text(folded ? 'more' : 'less');
	}
}
