import { Component } from '../core/component.js';
import { el, fill, content } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Ids } from '../core/ids.js';
import { Hint } from '../core/hint.js';
import { Labels } from '../core/labels.js';
import { Unavailable } from '../unavailable.js';
import { OutageRead } from '../again/read.js';
import { Search } from './search.js';
import { Selection } from './selection.js';
import { ResultList } from './list.js';
import { PickerFoot } from './foot.js';
import { PickerChosen } from './chosen.js';
import { PickerAccounts } from './accounts.js';
import { Recognizer } from './recognizer.js';
import { PickerFilters } from './filters.js';
import { labels as copy } from './labels.js';

/**
 * A searchable picker of one or many entities from a source that may be large, paged and slow; since
 * 0.7.0 also the family's resource picker (D56 "Choose, never type", CNT-93).
 *
 * The person types to search (and may narrow with finite `filters`); results arrive a page at a time
 * with "Load more". Choices are kept by id across queries, filters, pages and accounts, counted, and
 * listed as removable chips. Loading, no matches, an empty source, a source that failed or did not
 * answer within `bound` (unavailable, with Try again; never "nothing to choose"), disabled results with
 * their reason and chosen items that became stale or ineligible are all stated in words. Keyboard:
 * arrows and Page Up/Down move, Enter chooses, Escape clears the search.
 *
 * A resource picker adds: "From [account ▾]" (`accounts`, with the product's "Connect another"); a
 * `gate` in place of the list when nothing can be listed yet (not connected, single sign-on, adding
 * restricted), with the product's one action; rows with a picture, "Private" with a lock, an update
 * time, one state and marks with their reason; a suggested group from the source; `recognize`, which
 * turns a pasted address into a search or a direct choice; and the "Can't find it?" footer
 * (`footer`), shown in every state. Authorization stays with the product: the source returns what the
 * person may see, and the product revalidates the choice when it is committed (`mark`).
 *
 * Since 0.33.0 (D163) a search that did not answer joins the page's `Recovery` (`recovery`, `outage`,
 * `details`), as a `Collection` does: the line under the list says "Not available right now", with no Try
 * again; the page's line searches again until it answers. Any other failure keeps the picker's own words.
 */
export class Picker extends Component {
	/** The copy in English and Spanish. */
	static labels = copy;

	#element;
	#labels;
	#input;
	#list;
	#search;
	#selection;
	#foot;
	#chosen;
	#accounts = null;
	#recognizer;
	#gate;
	#escape;
	#slot;
	#working;
	#onchange;
	#onrecognize;
	#explain;
	#filters;
	#outage;
	#delay;
	#pending = null;
	#tip;

	/**
	 * @param {object} options
	 * @param {string} options.label names the search field and the list
	 * @param {(request: {query: string, filters: object, account: string|null, cursor: unknown, limit: number, signal: AbortSignal}) => Promise<{items: object[], next?: unknown, total?: number, suggested?: {label?: string, items: object[]}}>} options.source
	 * @param {boolean} [options.multiple] several choices (default true)
	 * @param {{items: object[], value?: string|null, connect?: {label: string, run: () => void}}|null} [options.accounts] "From [account ▾]"
	 * @param {object|null} [options.gate] shown in place of the list: `Unavailable`'s options (`title`, `reason`, `owner`, `action`, `secondary`, `kind`)
	 * @param {Node|Node[]|null} [options.footer] the "Can't find it?" actions
	 * @param {((text: string) => object|null)|null} [options.recognize] a pasted address as a search or a choice
	 * @param {((found: object|null) => void)|null} [options.onrecognize] what was recognized and its outcome
	 * @param {((error: unknown) => string|null)|null} [options.explain] the words of a failure
	 * @param {number} [options.bound] milliseconds a source may take (20000)
	 * @param {import('../again/recovery.js').Recovery|null} [options.recovery] the page's notice for its search's cause (0.33.0)
	 * @param {((error: unknown) => boolean)|null} [options.outage] which failures are that cause's outage (0.33.0)
	 * @param {((error: unknown) => object|null)|null} [options.details] a failure's evidence for the notice (0.33.0)
	 */
	constructor({ label, source, multiple = true, selected = [], filters = [], name = null, hint = null, limit = 20, delay = 250, bound = 20000, all = false, accounts = null, gate = null, footer = null, recognize = null, onrecognize = null, explain = null, onchange = null, recovery = null, outage = null, details = null, labels = {} }) {
		super();
		this.#labels = new Labels(copy.en, labels);
		this.#onchange = onchange;
		this.#onrecognize = onrecognize;
		this.#explain = explain;
		this.#delay = delay;
		this.#selection = new Selection(selected, multiple);
		this.#recognizer = new Recognizer(recognize);
		this.#filters = new PickerFilters(filters, () => this.refresh());
		this.#outage = new OutageRead({ recovery, outage, details, title: typeof label === 'string' ? label : this.#labels.text('outage'), words: this.#labels.text('outage'), inline: true });
		const id = Ids.next('bui-picker');
		this.#input = el('input', { id: `${id}-input`, type: 'search', class: 'bui-input bui-picker-input', 'data-bui-caret': '', role: 'combobox', autocomplete: 'off', 'aria-autocomplete': 'list', 'aria-expanded': 'true', 'aria-controls': `${id}-list`, 'aria-describedby': [hint ? `${id}-hint` : null, `${id}-count`, `${id}-status`].filter(Boolean).join(' '), placeholder: this.#labels.text('placeholder'), oninput: () => this.#typed(), onpaste: () => this.#typed(0), onkeydown: event => this.#keys(event) });
		this.#chosen = new PickerChosen({ id: `${id}-count`, selection: this.#selection, labels: this.#labels, name, input: this.#input, tip: null, onremove: key => (this.remove(key), this.#list.mark(item => this.#selection.has(item))) });
		this.#list = new ResultList({ id: `${id}-list`, label, multiple, input: this.#input, onchoose: index => this.#choose(this.#list.item(index)) });
		this.#foot = new PickerFoot({ id: `${id}-status`, labels: this.#labels, input: this.#input, all: multiple && all, on: { retry: () => this.#search.retry(), more: () => this.#search.page(), all: () => this.#choose(...this.#open()) } });
		this.#search = new Search({ source, limit, bound, onchange: () => this.#render() });
		if (accounts) this.#accounts = new PickerAccounts({ accounts, labels: this.#labels, onchange: () => this.refresh() });
		this.#gate = el('div', { class: 'bui-picker-gate', hidden: true });
		this.#slot = el('div', { class: 'bui-picker-escape-slot' });
		this.#escape = el('div', { class: 'bui-picker-escape', hidden: true }, [el('p', { class: 'bui-picker-escape-title', text: this.#labels.text('escape') }), this.#slot]);
		this.#working = el('div', { class: 'bui-picker-work' }, [
			this.#chosen.element,
			el('div', { class: 'bui-picker-bar' }, [el('span', { class: 'bui-picker-search' }, [glyph('search'), this.#input]), ...this.#filters.elements]),
			this.#list.element,
			this.#foot.element
		]);
		this.#element = el('div', { class: `bui-picker${multiple ? ' bui-picker-multiple' : ''}` }, [
			el('label', { for: `${id}-input`, class: 'bui-field-label' }, [content(label)]),
			hint ? el('p', { id: `${id}-hint`, class: 'bui-field-hint' }, [content(hint)]) : null,
			this.#accounts?.element,
			this.#gate,
			this.#working,
			this.#escape,
			this.#chosen.inputs
		]);
		// The chips' remove buttons show a glyph alone: their names appear as tooltips (D11).
		this.#tip = new Hint(this.#element);
		this.#chosen.tip = this.#tip;
		this.footer = footer;
		this.#draw();
		if (gate) this.gate = gate;
		else this.refresh();
	}

	get element() {
		return this.#element;
	}

	/** The chosen ids. */
	get value() {
		return this.#selection.ids;
	}

	/** The chosen items, with any `state`, `reason` and `account`. */
	get selected() {
		return this.#selection.items;
	}

	/** The search field, for focusing it. */
	get control() {
		return this.#input;
	}

	/** The account in view, or null without accounts. */
	get account() {
		return this.#accounts?.value ?? null;
	}

	/** Replaces the accounts (`{ items, value?, connect? }`); a new account in view searches again. */
	set accounts(accounts) {
		if (this.#accounts?.update(accounts ?? {}) && !this.#gated) this.refresh();
	}

	/** What the search field was recognized as (`{ label, id, query, value }`), or null. */
	get recognized() {
		return this.#recognizer.current;
	}

	/** Replaces the "Can't find it?" actions; it shows in every state while it holds any. */
	set footer(nodes) {
		fill(this.#slot, [].concat(nodes ?? []).map(node => node?.element ?? node));
		this.#escape.hidden = !this.#slot.childNodes.length;
	}

	/** Shows `Unavailable` in place of the list (`{ title, reason, owner?, action?, secondary?, kind? }`), or the list again with null. */
	set gate(options) {
		this.#gate.replaceChildren();
		if (!options) {
			const was = this.#gated;
			this.#gate.hidden = true;
			this.#working.hidden = false;
			if (was) this.refresh();
			return;
		}
		this.#search.cancel();
		this.#outage.release();
		new Unavailable({ kind: 'association', level: 3, ...options }).mount(this.#gate);
		this.#gate.hidden = false;
		this.#working.hidden = true;
	}

	/** Records the product's finding about a chosen item (`stale`, `ineligible`, `unavailable`), or clears it. */
	mark(id, finding) {
		this.#selection.mark(id, finding);
		this.#draw();
	}

	/** Removes a chosen item. */
	remove(id) {
		this.#selection.remove(id);
		this.#draw();
		this.#onchange?.(this.selected);
	}

	/** Searches again with the current query, filters and account, for example after the source changed. */
	refresh() {
		if (this.#gated) return Promise.resolve();
		const query = this.#recognizer.read(this.#input.value);
		return this.#search.find(query, this.#filters.values, this.account);
	}

	focus() {
		this.#input.focus();
	}

	destroy() {
		this.#search.cancel();
		this.#tip.destroy();
		this.#accounts?.destroy();
		this.#outage.release();
		this.#filters.destroy();
		super.destroy();
	}

	get #gated() {
		return !this.#gate.hidden;
	}

	// Typing searches after the delay; a paste at once, so the address it carries is recognized without waiting
	#typed(wait = this.#delay) {
		this.#pending?.();
		this.#pending = this.later(() => this.refresh(), wait);
	}

	#keys(event) {
		if (this.#list.move(event.key)) event.preventDefault();
		else if (event.key === 'Enter') {
			event.preventDefault();
			if (this.#list.active) this.#choose(this.#list.active);
		} else if (event.key === 'Escape' && this.#input.value) {
			event.preventDefault();
			event.stopPropagation();
			this.#input.value = '';
			this.#pending?.();
			this.refresh();
		}
	}

	// Several items are added together (the "all" action); one item is toggled.
	#choose(...items) {
		const usable = items.filter(item => item && !item.disabled).map(item => (this.account === null ? item : { ...item, account: this.account }));
		if (!usable.length) return;
		if (items.length > 1) this.#selection.add(usable);
		else this.#selection.toggle(usable[0]);
		this.#list.mark(id => this.#selection.has(id));
		this.#draw();
		this.#onchange?.(this.selected);
	}

	/** The results shown, the suggested group's included (0.7.4), that can be chosen and are not chosen yet. */
	#open() {
		const shown = new Map([...(this.#search.suggested?.items ?? []), ...this.#search.items].map(item => [item.id, item]));
		return [...shown.values()].filter(item => !item.disabled && !this.#selection.has(item.id));
	}

	#draw() {
		this.#chosen.draw();
		this.#foot.offer(this.#search.state === 'ready' && this.#open().length > 0);
	}

	#render() {
		const search = this.#search;
		const busy = search.state === 'loading' || search.state === 'more';
		this.#list.element.setAttribute('aria-busy', String(busy));
		if (search.state !== 'more') this.#list.render(search.items, id => this.#selection.has(id), this.#labels, search.suggested);
		// The notice's own tries keep the outage's place; an answer leaves the notice
		if (search.state === 'loading' && this.#outage.active) return;
		const outage = search.state === 'failed' && this.#outage.takes(search.error);
		if (search.state === 'ready') this.#outage.release();
		this.#foot.show({ failed: search.state === 'failed' && !outage, more: search.state === 'ready' && search.more, busy: search.state === 'more' });
		this.#draw();
		if (outage) return this.#foot.place(this.#outage.draw(search.error, async () => (await this.#search.retry(), false)));
		const found = search.state === 'ready' ? this.#recognized() : null;
		this.#foot.say(found ?? this.#foot.describe(search, this.#filters.narrowed, this.#explain), search.state === 'failed');
	}

	/** Chooses what a pasted address named when the list holds it, and says what happened; null when nothing was recognized. */
	#recognized() {
		// Settled once, on the first answer to the query it was read for (0.7.4)
		if (this.#recognizer.current && this.#recognizer.settled) return null;
		const listed = [...(this.#search.suggested?.items ?? []), ...this.#search.items];
		const settled = this.#recognizer.settle(listed);
		const current = this.#recognizer.current;
		this.#onrecognize?.(current ? { ...current, outcome: settled.outcome, item: settled.item } : null);
		if (!settled) return null;
		const { outcome, item } = settled;
		if (outcome === 'picked') {
			if (!this.#selection.has(item.id)) this.#choose(item);
			this.#list.activate(this.#list.find(item.id));
		}
		const label = current.label;
		return this.#labels.text(outcome, { label, reason: item?.reason ?? this.#labels.text('disabled') });
	}
}
