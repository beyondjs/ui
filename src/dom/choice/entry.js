import { el, content } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Ids } from '../core/ids.js';

/**
 * One entry of a `ChoiceMenu`: an option (`menuitemradio`, checked when chosen) or an action
 * (`menuitem`), with its state, detail and reason. A disabled entry stays reachable so its reason can
 * be read. `text` is what a search or type-ahead matches: the option's `search`, else its label.
 */
export class ChoiceEntry {
	#node;
	#holder;
	#item;
	#option;

	/**
	 * @param {object} item an option `{ value, label, detail?, status?, disabled?, reason?, search? }` or an action `{ label, run }`
	 * @param {'menuitemradio'|'menuitem'} role
	 * @param {string|null} value the value chosen
	 * @param {(item: object, option: object|null) => void} onchoose
	 */
	constructor(item, role, value, onchoose) {
		this.#item = item;
		this.#option = role === 'menuitemradio' ? item : null;
		const note = item.reason ? Ids.next('bui-reason') : null;
		const checked = this.#option ? this.#option.value === value : null;
		const [state, tone] = this.#option?.status ?? [null, null];
		this.#node = el(
			'button',
			{
				type: 'button',
				role,
				tabindex: '-1',
				class: `bui-menu-item bui-choice-item${checked ? ' bui-choice-checked' : ''}`,
				'aria-checked': this.#option ? String(checked) : null,
				'aria-disabled': item.disabled ? 'true' : null,
				'aria-describedby': note,
				onclick: () => onchoose(item, this.#option)
			},
			[
				el('span', { class: 'bui-choice-line' }, [
					checked ? glyph('check') : el('span', { class: 'bui-choice-space', 'aria-hidden': 'true' }),
					el('span', { class: 'bui-choice-name' }, [content(item.label)]),
					state ? el('span', { class: `bui-status bui-status-${tone ?? 'neutral'}` }, [el('span', { class: 'bui-status-dot', 'aria-hidden': 'true' }), state]) : null
				]),
				item.detail ? el('span', { class: 'bui-choice-detail' }, [content(item.detail)]) : null,
				item.reason ? el('span', { id: note, class: 'bui-menu-reason', text: item.reason }) : null
			]
		);
		this.#holder = el('li', { role: 'none' }, [this.#node]);
	}

	/** The focusable menu item. */
	get node() {
		return this.#node;
	}

	/** The list item that holds it. */
	get holder() {
		return this.#holder;
	}

	/** The option, or null for an action. */
	get option() {
		return this.#option;
	}

	get item() {
		return this.#item;
	}

	/** What a search or type-ahead matches. */
	get text() {
		const item = this.#item;
		if (typeof item.search === 'string') return item.search;
		return typeof item.label === 'string' ? item.label : (item.label?.textContent ?? String(item.value ?? ''));
	}

	/** Whether the entry is listed (a search hides the options that do not match). */
	get shown() {
		return !this.#holder.hidden;
	}

	set shown(value) {
		this.#holder.hidden = !value;
	}
}
