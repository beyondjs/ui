import { Component } from '../core/component.js';
import { el } from '../core/element.js';
import { Ids } from '../core/ids.js';
import { Labels } from '../core/labels.js';
import { Placement } from '../core/placement.js';
import { single } from '../core/statement.js';
import { ChoiceEntry } from './entry.js';
import { ChoiceFace } from './face.js';
import { ChoiceFinder } from './finder.js';
import { labels as copy } from './labels.js';

/**
 * One choice among a few things that have a state: an environment that is running or failed, a tool
 * that is ready or needs a sign-in. Between `Select` (plain values) and `Picker` (large collections
 * to search), it shows what a native select cannot: each option's state and a line of detail, the
 * choice's state on the button itself, and actions such as "New environment…" after the options.
 *
 * The button names what is chosen ("Environment: lab"), with its state beside it when the state asks
 * for attention, and never cuts its words. It opens the ARIA menu pattern with the options as
 * `menuitemradio` (the chosen one checked) and the actions as `menuitem` after a separator. Arrow
 * keys, Home and End move, Enter or Space chooses, Escape closes and returns focus to the button, Tab
 * closes and moves on, a press outside closes, and printable keys move to the next option that starts
 * with them. A list longer than `ChoiceMenu.threshold` (or with `search: true`) opens with a search
 * field that filters by the beginning of the text or of any segment (0.7.0). A disabled option stays
 * reachable so its reason can be read, and is never chosen. Choosing calls `onchange` with the value.
 *
 * One option that can be chosen and no action is a statement, not a choice (D56, 0.7.0): the label and
 * the option are shown as text, and the value is that option's (`statement: false` keeps the menu).
 *
 * Options: `{ value, label, detail?, status?: [text, tone], disabled?, reason?, search? }`. Actions:
 * `{ label, run, disabled?, reason? }`.
 */
export class ChoiceMenu extends Component {
	/** The copy in English and Spanish. */
	static labels = copy;
	/** More options than this open with a search field. */
	static threshold = 15;

	#element;
	#button;
	#panel;
	#list;
	#finder;
	#input = null;
	#label;
	#labels;
	#options = [];
	#actions = [];
	#entries = [];
	#value = null;
	#settings;
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
	 * @param {boolean|'auto'|number} [options.search] a search field above the options (`auto`: past `ChoiceMenu.threshold`; a number: past it)
	 * @param {boolean} [options.statement] one option is stated as text (default true)
	 * @param {string|null} [options.name] submits the value with a form in a hidden input
	 * @param {(value: string) => void} [options.onchange]
	 */
	constructor({ label, options, value = null, placeholder = null, actions = [], disabled = false, align = 'start', placement = 'auto', search = 'auto', statement = true, name = null, onchange = null, labels = {} }) {
		super();
		this.#label = label;
		this.#labels = new Labels(copy.en, placeholder ? { ...labels, placeholder } : labels);
		this.#settings = { search, statement, name };
		this.#onchange = onchange;
		this.#placement = new Placement(placement);
		const id = Ids.next('bui-choice');
		this.#button = el('button', { type: 'button', class: 'bui-choice-button', 'aria-haspopup': 'menu', 'aria-expanded': 'false', 'aria-controls': id, disabled, onclick: () => (this.#open ? this.close(true) : this.open()), onkeydown: event => this.#opener(event) });
		this.#list = el('ul', { id, class: 'bui-choice-items', role: 'menu', 'aria-label': label });
		this.#panel = el('div', { class: `bui-menu bui-choice-list bui-align-${align}`, hidden: true, onkeydown: event => this.#keys(event) }, [this.#list]);
		this.#element = el('div', { class: 'bui-menu-holder bui-choice' });
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

	/** Whether the one option is stated as text instead of offered. */
	get stated() {
		return this.#element.classList.contains('bui-choice-statement');
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

	/** Opens the list on the chosen option, or the first one; a long list on its search field */
	open() {
		if (this.destroyed || this.#button.disabled || this.stated) return;
		if (!this.#open) {
			this.#open = true;
			this.#panel.hidden = false;
			this.#button.setAttribute('aria-expanded', 'true');
			this.#placement.place(this.#panel, this.#button);
			this.#release = this.listen(this.#element.ownerDocument, 'pointerdown', event => {
				if (!this.#element.contains(event.target)) this.close(false);
			});
		}
		if (this.#finder.field) return this.#finder.field.focus({ preventScroll: true });
		const chosen = this.#entries.findIndex(entry => entry.option && entry.option.value === this.#value);
		this.#entries[Math.max(chosen, 0)]?.node.focus({ preventScroll: true });
	}

	close(refocus = false) {
		if (!this.#open) return;
		this.#open = false;
		this.#panel.hidden = true;
		this.#button.setAttribute('aria-expanded', 'false');
		this.#release?.();
		this.#finder.clear();
		this.#filter();
		if (refocus) this.#button.focus({ preventScroll: true });
	}

	/** Draws the button, or the statement, and the list; an open list keeps the entry that had focus. */
	#draw() {
		const document = this.#element.ownerDocument;
		const active = this.#open ? this.#entries.find(entry => entry.node === document.activeElement) : null;
		const place = active ? this.#entries.indexOf(active) : -1;
		const typing = this.#open && this.#finder?.field === document.activeElement;
		const query = this.#finder?.query ?? '';
		const one = this.#settings.statement ? single(this.#options, { actions: this.#actions }) : null;
		if (one) this.#value = one.value;
		this.#finder = this.#search();
		this.#entries = [...this.#options.map(option => new ChoiceEntry(option, 'menuitemradio', this.#value, (item, chosen) => this.#choose(item, chosen))), ...this.#actions.map(action => new ChoiceEntry(action, 'menuitem', null, item => this.#choose(item, null)))];
		const options = this.#entries.filter(entry => entry.option);
		const actions = this.#entries.filter(entry => !entry.option);
		const separator = options.length && actions.length ? [el('li', { role: 'separator', class: 'bui-menu-separator' })] : [];
		this.#list.replaceChildren(...options.map(entry => entry.holder), ...separator, ...actions.map(entry => entry.holder));
		this.#panel.replaceChildren(...[this.#finder.element, this.#list, this.#finder.none].filter(Boolean));
		if (this.#finder.field && query) this.#finder.field.value = query;
		this.#filter();
		this.#input = this.#settings.name ? el('input', { type: 'hidden', name: this.#settings.name, value: this.#value ?? '' }) : null;
		this.#element.classList.toggle('bui-choice-statement', Boolean(one));
		if (one) {
			if (this.#open) this.close(false);
			this.#element.replaceChildren(ChoiceFace.stated(this.#label, one, this.#settings.name));
			return;
		}
		ChoiceFace.draw(this.#button, this.#label, this.chosen, this.#labels.text('placeholder'));
		const parts = [this.#button, this.#panel, this.#input].filter(Boolean);
		// Replaced only when they differ: moving the focused button would drop its focus.
		if (parts.length !== this.#element.childNodes.length || parts.some((part, index) => this.#element.childNodes[index] !== part)) this.#element.replaceChildren(...parts);
		if (typing) return this.#finder.field?.focus({ preventScroll: true });
		if (!active) return;
		const same = active.option ? this.#entries.find(entry => entry.option?.value === active.option.value) : null;
		(same ?? this.#entries[Math.min(place, this.#entries.length - 1)])?.node.focus({ preventScroll: true });
	}

	#search() {
		const { search } = this.#settings;
		const limit = typeof search === 'number' ? search : ChoiceMenu.threshold;
		const shown = search === true || ((search === 'auto' || typeof search === 'number') && this.#options.length > limit);
		if (this.#finder && Boolean(this.#finder.field) === shown) return this.#finder;
		return new ChoiceFinder({ search: shown, label: this.#labels.text('search', { label: this.#label }), controls: this.#list.id, onkeys: event => this.#field(event), oninput: () => this.#filter() });
	}

	/** Lists the options that match the query; actions always stay. */
	#filter() {
		const query = this.#finder?.query ?? '';
		let shown = 0;
		for (const entry of this.#entries) {
			entry.shown = !entry.option || ChoiceFinder.match(entry.text, query);
			if (entry.option && entry.shown) shown += 1;
		}
		const none = this.#finder?.none;
		if (!none) return;
		none.textContent = query && !shown ? this.#labels.text('none', { query }) : '';
		none.hidden = !none.textContent;
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

	/** Keys in the search field: down into the list, Enter chooses the first match, Escape clears then closes. */
	#field(event) {
		const shown = this.#entries.filter(entry => entry.shown);
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			shown[0]?.node.focus({ preventScroll: true });
		} else if (event.key === 'Enter') {
			event.preventDefault();
			const first = shown.find(entry => entry.option && !entry.item.disabled);
			if (first) this.#choose(first.item, first.option);
		} else if (event.key === 'Escape' && this.#finder.query) {
			event.preventDefault();
			event.stopPropagation();
			this.#finder.clear();
			this.#filter();
		}
	}

	#keys(event) {
		if (event.target === this.#finder.field) {
			if (event.key === 'Escape') this.#escape(event);
			else if (event.key === 'Tab') this.close(false);
			return;
		}
		const nodes = this.#entries.filter(entry => entry.shown).map(entry => entry.node);
		const index = nodes.indexOf(this.#element.ownerDocument.activeElement);
		if (event.key === 'Escape') this.#escape(event);
		else if (event.key === 'Tab') this.close(false);
		else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
			event.preventDefault();
			const next = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: nodes.length - 1 }[event.key];
			if (event.key === 'ArrowUp' && index === 0 && this.#finder.field) return this.#finder.field.focus({ preventScroll: true });
			nodes[(next + nodes.length) % nodes.length]?.focus({ preventScroll: true });
		} else if (!event.ctrlKey && !event.metaKey && !event.altKey) this.#ahead(event, index);
	}

	/** A printable key: into the search field of a long list, else to the next entry that starts with it. */
	#ahead(event, index) {
		if (this.#finder.field && event.key.length === 1 && event.key.trim()) {
			event.preventDefault();
			this.#finder.field.value += event.key;
			this.#filter();
			return this.#finder.field.focus({ preventScroll: true });
		}
		const shown = this.#entries.filter(entry => entry.shown);
		const entry = this.#finder.ahead(event.key, Date.now(), shown, index);
		if (!entry) return;
		event.preventDefault();
		entry.node.focus({ preventScroll: true });
	}

	#escape(event) {
		event.preventDefault();
		event.stopPropagation();
		this.close(true);
	}
}
