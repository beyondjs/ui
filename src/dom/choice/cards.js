import { Component } from '../core/component.js';
import { el, fill, content } from '../core/element.js';
import { Ids } from '../core/ids.js';
import { status } from '../feedback.js';

/**
 * A choice among a few options a person compares (0.16.0, the audit's DQ-15): a machine's size, a plan,
 * where something runs. Each option is a card with its title, one line of detail, short facts (price,
 * cores, memory) and an optional state, instead of a native radio followed by a paragraph. It is a
 * group of native radios (a `fieldset` with its `legend`): the arrows move and choose, Space chooses,
 * and the choice applies at once (`onchange`), never through a separate Save. An option that cannot be
 * chosen stays visible and says why (`reason`), and is never chosen.
 *
 * Options: `{ value, title, detail?, facts?: string[], status?: [label, tone], disabled?, reason? }`.
 */
export class ChoiceCards extends Component {
	#element;
	#list = el('div', { class: 'bui-cards-list' });
	#name;
	#options = [];
	#value = null;
	#onchange;

	/**
	 * @param {object} options
	 * @param {string|Node} options.label what is chosen ("Size"), the group's legend
	 * @param {Array<object>} options.options the cards
	 * @param {string|null} [options.value] the value chosen
	 * @param {string|null} [options.name] the radios' name, submitted with a form
	 * @param {(value: string) => void} [options.onchange]
	 * @param {string|Node|null} [options.description] one line under the legend
	 */
	constructor({ label, options = [], value = null, name = null, onchange = null, description = null }) {
		super();
		this.#name = name ?? Ids.next('bui-cards');
		this.#onchange = onchange;
		this.#value = value;
		this.#element = el('fieldset', { class: 'bui-cards' }, [el('legend', { class: 'bui-cards-legend' }, [content(label)]), description ? el('p', { class: 'bui-cards-description' }, [content(description)]) : null, this.#list]);
		this.options = options;
	}

	get element() {
		return this.#element;
	}

	get value() {
		return this.#value;
	}

	/** Chooses a value without calling `onchange`; a value no option can take chooses nothing. */
	set value(value) {
		this.#value = this.#options.some(option => option.value === value && !option.disabled) ? value : null;
		for (const input of this.#list.querySelectorAll('input')) {
			input.checked = input.value === this.#value;
			input.closest('.bui-card-choice').toggleAttribute('data-checked', input.checked);
		}
	}

	/** Replaces the options; the value stays chosen only while an option can still take it. Focus stays on its option. */
	set options(options) {
		const document = this.#element.ownerDocument;
		const focused = this.#list.contains(document.activeElement) ? document.activeElement.value : null;
		this.#options = options.filter(Boolean).map(option => ({ ...option, value: String(option.value) }));
		fill(this.#list, this.#options.map(option => this.#card(option)));
		this.value = this.#value;
		if (focused !== null) [...this.#list.querySelectorAll('input')].find(input => input.value === focused)?.focus({ preventScroll: true });
	}

	set disabled(disabled) {
		this.#element.disabled = Boolean(disabled);
	}

	#card(option) {
		const id = Ids.next('bui-card');
		const input = el('input', { type: 'radio', class: 'bui-card-radio', name: this.#name, value: option.value, id, disabled: Boolean(option.disabled), 'aria-describedby': `${id}-detail`, onchange: () => this.#choose(option) });
		return el('label', { class: 'bui-card-choice', for: id, 'data-disabled': option.disabled ? '' : null }, [
			input,
			el('span', { class: 'bui-card-head' }, [el('span', { class: 'bui-card-title' }, [content(option.title)]), option.status ? status(option.status[0], option.status[1] ?? 'neutral') : null]),
			el('span', { id: `${id}-detail`, class: 'bui-card-body' }, [
				option.detail ? el('span', { class: 'bui-card-detail' }, [content(option.detail)]) : null,
				option.facts?.length ? el('span', { class: 'bui-card-facts' }, option.facts.filter(Boolean).map(fact => el('span', { class: 'bui-card-fact' }, [content(fact)]))) : null,
				option.disabled && option.reason ? el('span', { class: 'bui-card-reason' }, [content(option.reason)]) : null
			])
		]);
	}

	#choose(option) {
		if (option.disabled || option.value === this.#value) return;
		this.value = option.value;
		this.#onchange?.(option.value);
	}
}
