import { Component } from '../core/component.js';
import { el, content } from '../core/element.js';
import { Ids } from '../core/ids.js';
import { Labels } from '../core/labels.js';
import { CommandDecisions } from './decisions.js';

const defaults = { allow: 'Allow', deny: 'Deny', more: 'Show all', less: 'Show less', allowed: 'Allowed', denied: 'Denied', working: 'Sending your answer…', failed: 'Your answer could not be confirmed. Try again.', note: 'Describe an alternative', send: 'Send', back: 'Back', command: 'Command' };

/**
 * A request that waits for the person's answer (0.15.0, DQ-13): an agent asks to run a command, write a
 * file or reach a host. The card is the present state of the work, said once: a neutral raised surface
 * with an attention edge, its title, the command whole in a wrapping monospace block (folded past
 * `CommandCard.lines` lines with Show all), an optional scope ("Always allow commands like this") and two
 * actions with their keys: Enter allows and Escape denies while focus is inside the card. `focus()` takes
 * the person there on arrival. An answer is sent once (`allow` and `deny` may return a promise); a failed
 * one is said in place and the actions come back. Then the card states the outcome: `allowed` or `denied`.
 * Products bring the words of their request and what each answer does.
 *
 * Since 0.16.0 (CNV-10) a product may offer scoped decisions instead (`decisions`, `ondecide`): "Allow
 * once", "Allow for this conversation", "Deny with a note" (`CommandDecisions`); `ondecide({ value, kind,
 * note, command, scope })` answers, and the card states the decision's own words. With `editable` the
 * command is a field the person may correct before allowing; the answer carries the corrected command.
 */
export class CommandCard extends Component {
	/** The copy in English and Spanish. */
	static labels = Object.freeze({ en: Object.freeze({ ...defaults }), es: Object.freeze({ allow: 'Permitir', deny: 'Rechazar', more: 'Ver todo', less: 'Ver menos', allowed: 'Permitido', denied: 'Rechazado', working: 'Enviando tu respuesta…', failed: 'No se pudo confirmar tu respuesta. Vuelve a intentarlo.', note: 'Describe una alternativa', send: 'Enviar', back: 'Volver', command: 'Comando' }) });
	/** Lines of a command shown before Show all. */
	static lines = 8;

	#element;
	#labels;
	#state = 'pending';
	#busy = false;
	#scope = null;
	#line = el('p', { class: 'bui-command-line', role: 'status' });
	#handlers;
	#decisions;
	#code;
	#said = null;

	/**
	 * @param {object} options
	 * @param {string|Node} options.title what is asked ("Claude Code asks to run a command")
	 * @param {string} options.command the command or content, shown whole
	 * @param {string|Node|null} [options.detail] one line of context (where it runs)
	 * @param {{label: string, checked?: boolean}|null} [options.scope] a choice that widens the answer
	 * @param {(answer: {scope: boolean}) => unknown} options.allow
	 * @param {(answer: {scope: boolean}) => unknown} options.deny
	 * @param {'pending'|'allowed'|'denied'} [options.state]
	 * @param {Array<{value: string, label: string, kind: 'allow'|'deny', keys?: 'Enter'|'Escape', note?: boolean|object, said?: string}>|null} [options.decisions] scoped decisions (0.16.0)
	 * @param {((answer: {value: string, kind: string, note: string|null, command: string, scope: boolean}) => unknown)|null} [options.ondecide] answers a decision (0.16.0)
	 * @param {boolean} [options.editable] the command may be corrected before allowing (0.16.0)
	 */
	constructor({ title, command, detail = null, scope = null, allow = null, deny = null, state = 'pending', labels = {}, decisions = null, ondecide = null, editable = false }) {
		super();
		this.#labels = new Labels(CommandCard.labels, labels);
		this.#handlers = { allow, deny, ondecide };
		const id = Ids.next('bui-command');
		this.#code = editable ? el('textarea', { class: 'bui-command-code bui-command-edit', rows: Math.min(8, String(command ?? '').split('\n').length + 1), spellcheck: 'false', 'aria-label': this.#labels.text('command') }) : null;
		if (this.#code) this.#code.value = String(command ?? '');
		const code = this.#code ?? el('pre', { class: 'bui-command-code' }, [el('code', { text: String(command ?? '') })]);
		const long = !editable && String(command ?? '').split('\n').length > CommandCard.lines;
		const toggle = long ? el('button', { type: 'button', class: 'bui-link-button bui-command-toggle', 'aria-expanded': 'false', onclick: () => this.#unfold(code, toggle) }, [this.#labels.text('more')]) : null;
		if (long) code.setAttribute('data-folded', '');
		this.#scope = scope ? el('input', { type: 'checkbox', class: 'bui-command-scope', checked: Boolean(scope.checked) }) : null;
		const given = Array.isArray(decisions) && decisions.length ? decisions : [{ value: 'allow', kind: 'allow', label: this.#labels.text('allow') }, { value: 'deny', kind: 'deny', label: this.#labels.text('deny') }];
		this.#decisions = new CommandDecisions({ decisions: given, labels: this.#labels, ondecide: (decision, note) => this.#decide(decision, note) });
		this.#element = el('section', { class: 'bui-command', tabindex: '-1', 'aria-labelledby': `${id}-title`, onkeydown: event => this.#keys(event) }, [
			el('p', { id: `${id}-title`, class: 'bui-command-title' }, [content(title)]),
			detail ? el('p', { class: 'bui-command-detail' }, [content(detail)]) : null,
			code,
			toggle,
			this.#scope ? el('label', { class: 'bui-command-choice' }, [this.#scope, el('span', { text: scope.label })]) : null,
			...this.#decisions.elements,
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
		this.#decisions.shown = this.#state === 'pending';
		if (this.#scope) this.#scope.disabled = this.#state !== 'pending';
		this.#line.textContent = this.#state === 'pending' ? '' : (this.#said ?? this.#labels.text(this.#state));
	}

	/** Takes focus on arrival, so Enter and Escape answer at once. */
	focus() {
		this.#element.focus({ preventScroll: false });
	}

	/** Answers as the person would: `allow` or `deny` (the first decision of that kind); resolves whether the answer was taken. */
	answer(kind) {
		if (!['allow', 'deny'].includes(kind)) return Promise.resolve(false);
		const decision = this.#decisions.key(kind === 'allow' ? 'Enter' : 'Escape') ?? { value: kind, kind, label: this.#labels.text(kind) };
		return this.#decide(decision, null);
	}

	/** Sends a decision once; resolves whether it was taken. */
	async #decide(decision, note) {
		if (this.#busy || this.#state !== 'pending') return false;
		const kind = decision.kind === 'deny' ? 'deny' : 'allow';
		this.#busy = true;
		this.#element.setAttribute('aria-busy', 'true');
		this.#line.textContent = this.#labels.text('working');
		try {
			const answer = { value: String(decision.value), kind, note, command: this.#code?.value ?? null, scope: Boolean(this.#scope?.checked) };
			if (this.#handlers.ondecide) await this.#handlers.ondecide(answer);
			else await this.#handlers[kind]?.({ scope: answer.scope, ...(note ? { note } : {}), ...(this.#code ? { command: answer.command } : {}) });
			this.#said = decision.said ?? (this.#handlers.ondecide ? decision.label : null);
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

	/**
	 * Enter and Escape take their decisions while focus is in the card, never from its own controls' keys
	 * (a button's own Enter, the command being corrected, the note's field).
	 */
	#keys(event) {
		if (this.#state !== 'pending' || event.defaultPrevented || event.isComposing || this.#decisions.noting) return;
		const target = event.target;
		const own = target === this.#element || target.localName === 'pre' || target === this.#scope;
		const decision = event.key === 'Escape' && target !== this.#code ? this.#decisions.key('Escape') : event.key === 'Enter' && !event.shiftKey && own ? this.#decisions.key('Enter') : null;
		if (!decision) return;
		event.preventDefault();
		event.stopPropagation();
		this.#decisions.choose(decision);
	}

	#unfold(code, toggle) {
		const folded = code.toggleAttribute('data-folded');
		toggle.setAttribute('aria-expanded', String(!folded));
		toggle.textContent = this.#labels.text(folded ? 'more' : 'less');
	}
}
