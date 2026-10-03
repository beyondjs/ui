import { Component } from './core/component.js';
import { el, content } from './core/element.js';
import { glyph } from './core/icons.js';
import { Ids } from './core/ids.js';
import { Placement } from './core/placement.js';

/**
 * One choice among a few things that have a state: an environment that is running or failed, a tool
 * that is ready or needs a sign-in. Between `Select` (plain values, where the platform's own list is
 * enough) and `Picker` (large collections to search), it shows what a native select cannot: each
 * option's state and a line of detail, the choice's state on the button itself, and actions such as
 * "New environment…" after the options, in the family's own menu.
 *
 * The button names what is chosen ("Environment: lab"), with its state beside it when the state asks
 * for attention, and never cuts its words: it grows, and wraps in a narrow container. It opens the
 * ARIA menu pattern with the options as `menuitemradio` (the chosen one checked) and the actions as
 * `menuitem` after a separator. Arrow keys, Home and End move, Enter or Space chooses, Escape closes
 * and returns focus to the button, Tab closes and moves on, and a press outside closes. A disabled
 * option stays reachable so its reason can be read, and is never chosen. Choosing calls `onchange`
 * with the value; it never changes anything else.
 *
 * Options: `{ value, label, detail?, status?: [text, tone], disabled?, reason? }`. Actions:
 * `{ label, run, disabled?, reason? }`.
 */
export class ChoiceMenu extends Component {
	#element;
	#button;
	#list;
	#label;
	#placeholder;
	#options = [];
	#actions = [];
	#entries = [];
	#value = null;
	#onchange;
	#placement;
	#open = false;
	#release = null;

	/**
	 * @param {object} options
	 * @param {string} options.label what is chosen ("Environment"), shown before the value
	 * @param {Array<object>} options.options the choices
	 * @param {string|null} [options.value] the value chosen, or none
	 * @param {string} [options.placeholder] what the button says while nothing is chosen
	 * @param {Array<object>} [options.actions] actions after the options
	 * @param {boolean} [options.disabled]
	 * @param {'start'|'end'} [options.align] which edge of the button the list aligns to
	 * @param {'auto'|'below'|'above'} [options.placement] which side of the button the list opens on
	 * @param {(value: string) => void} [options.onchange]
	 */
	constructor({ label, options, value = null, placeholder = 'Choose', actions = [], disabled = false, align = 'start', placement = 'auto', onchange = null }) {
		super();
		this.#label = label;
		this.#placeholder = placeholder;
		this.#onchange = onchange;
		this.#placement = new Placement(placement);
		const id = Ids.next('bui-choice');
		this.#button = el('button', {
			type: 'button',
			class: 'bui-choice-button',
			'aria-haspopup': 'menu',
			'aria-expanded': 'false',
			'aria-controls': id,
			disabled,
			onclick: () => (this.#open ? this.close(true) : this.open()),
			onkeydown: event => this.#opener(event)
		});
		this.#list = el('ul', { id, class: `bui-menu bui-choice-list bui-align-${align}`, role: 'menu', 'aria-label': label, hidden: true, onkeydown: event => this.#keys(event) });
		this.#element = el('div', { class: 'bui-menu-holder bui-choice' }, [this.#button, this.#list]);
		this.#value = value;
		this.#actions = actions.filter(Boolean);
		this.options = options;
	}

	get element() {
		return this.#element;
	}

	/** The button, for focus and labels */
	get control() {
		return this.#button;
	}

	get expanded() {
		return this.#open;
	}

	get value() {
		return this.#value;
	}

	/** Chooses a value without calling `onchange`, as when the consumer's state changed */
	set value(value) {
		this.#value = value ?? null;
		this.#draw();
	}

	set disabled(disabled) {
		this.#button.disabled = Boolean(disabled);
		if (disabled) this.close(false);
	}

	/** Replaces the options; the value stays chosen only while an option still has it */
	set options(options) {
		this.#options = options.filter(Boolean);
		if (!this.#options.some(option => option.value === this.#value)) this.#value = null;
		this.#draw();
	}

	set actions(actions) {
		this.#actions = actions.filter(Boolean);
		this.#draw();
	}

	/** The option chosen, or null */
	get chosen() {
		return this.#options.find(option => option.value === this.#value) ?? null;
	}

	/** Opens the list on the chosen option, or the first one */
	open() {
		if (this.destroyed || this.#button.disabled) return;
		if (!this.#open) {
			this.#open = true;
			this.#list.hidden = false;
			this.#button.setAttribute('aria-expanded', 'true');
			this.#placement.place(this.#list, this.#button);
			this.#release = this.listen(this.#element.ownerDocument, 'pointerdown', event => {
				if (!this.#element.contains(event.target)) this.close(false);
			});
		}
		const nodes = this.#entries.map(entry => entry.node);
		const chosen = this.#entries.findIndex(entry => entry.option && entry.option.value === this.#value);
		nodes[Math.max(chosen, 0)]?.focus({ preventScroll: true });
	}

	close(refocus = false) {
		if (!this.#open) return;
		this.#open = false;
		this.#list.hidden = true;
		this.#button.setAttribute('aria-expanded', 'false');
		this.#release?.();
		if (refocus) this.#button.focus({ preventScroll: true });
	}

	/**
	 * Draws the button and the list. While the list is open the entry that had focus keeps it, by its
	 * value or its place, so a live change never drops focus out of an open menu
	 */
	#draw() {
		const active = this.#open ? this.#entries.find(entry => entry.node === this.#element.ownerDocument.activeElement) : null;
		const place = active ? this.#entries.indexOf(active) : -1;
		const chosen = this.chosen;
		const [state, tone] = chosen?.status ?? [null, null];
		const attention = tone === 'danger' || tone === 'warning';
		this.#button.dataset.tone = tone ?? '';
		this.#button.classList.toggle('bui-choice-empty', !chosen);
		const parts = [
			el('span', { class: 'bui-choice-label', text: this.#label }),
			chosen && tone ? el('span', { class: `bui-choice-dot bui-status-${tone}`, 'aria-hidden': 'true' }, [el('span', { class: 'bui-status-dot' })]) : null,
			el('span', { class: 'bui-choice-value' }, [content(chosen ? chosen.label : this.#placeholder)]),
			// The state is always in the accessible name; it is shown when it asks for attention
			state ? el('span', { class: attention ? 'bui-choice-state' : 'bui-hidden', text: state }) : null,
			glyph('chevron')
		];
		this.#button.replaceChildren(...parts.filter(Boolean));
		const options = this.#options.map(option => this.#entry(option, 'menuitemradio'));
		const actions = this.#actions.map(action => this.#entry(action, 'menuitem'));
		this.#entries = [...options, ...actions];
		const separator = options.length && actions.length ? [el('li', { role: 'separator', class: 'bui-menu-separator' })] : [];
		this.#list.replaceChildren(...options.map(entry => entry.holder), ...separator, ...actions.map(entry => entry.holder));
		if (!active) return;
		const same = active.option ? this.#entries.find(entry => entry.option?.value === active.option.value) : null;
		(same ?? this.#entries[Math.min(place, this.#entries.length - 1)])?.node.focus({ preventScroll: true });
	}

	#entry(item, role) {
		const option = role === 'menuitemradio' ? item : null;
		const note = item.reason ? Ids.next('bui-reason') : null;
		const checked = option ? option.value === this.#value : null;
		const [state, tone] = option?.status ?? [null, null];
		const node = el(
			'button',
			{
				type: 'button',
				role,
				tabindex: '-1',
				class: `bui-menu-item bui-choice-item${checked ? ' bui-choice-checked' : ''}`,
				'aria-checked': option ? String(checked) : null,
				'aria-disabled': item.disabled ? 'true' : null,
				'aria-describedby': note,
				onclick: () => this.#choose(item, option)
			},
			[
				el('span', { class: 'bui-choice-line' }, [
					checked ? glyph('check') : el('span', { class: 'bui-choice-space', 'aria-hidden': 'true' }),
					el('span', { class: 'bui-choice-name' }, [content(item.label)]),
					state ? el('span', { class: `bui-status bui-status-${tone ?? 'neutral'}` }, [el('span', { class: 'bui-status-dot', 'aria-hidden': 'true' }), state]) : null
				].filter(Boolean)),
				item.detail ? el('span', { class: 'bui-choice-detail', text: item.detail }) : null,
				item.reason ? el('span', { id: note, class: 'bui-menu-reason', text: item.reason }) : null
			].filter(Boolean)
		);
		return { node, option, holder: el('li', { role: 'none' }, [node]) };
	}

	#choose(item, option) {
		if (item.disabled) return;
		this.close(true);
		if (!option) return item.run?.();
		if (option.value === this.#value) return;
		this.#value = option.value;
		this.#draw();
		this.#onchange?.(option.value);
	}

	#opener(event) {
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			this.open();
		}
	}

	#keys(event) {
		const nodes = this.#entries.map(entry => entry.node);
		const index = nodes.indexOf(this.#element.ownerDocument.activeElement);
		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			this.close(true);
		} else if (event.key === 'Tab') this.close(false);
		else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
			event.preventDefault();
			const next = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: nodes.length - 1 }[event.key];
			nodes[(next + nodes.length) % nodes.length]?.focus({ preventScroll: true });
		}
	}
}
