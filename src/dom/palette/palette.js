import { Component } from '../core/component.js';
import { el } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Labels } from '../core/labels.js';
import { SidebarShortcut } from '../sidebar/shortcut.js';
import { PaletteResults } from './results.js';
import { PaletteRecent } from './recent.js';
import { words } from './labels.js';

/**
 * The product's command palette (0.16.0, the audit's DQ-21): ⌘K / Ctrl+K as the main way to go anywhere
 * and do anything, keyboard first. One large field with no title bar, in a modal dialog in the top
 * layer; results grouped by the sources the product (and the products it hosts) contribute, each source
 * asked as the person types (after `delay`, with an `AbortSignal`, bounded by `bound`: a source that
 * does not answer says so in its group and never holds the others back); before typing, the items the
 * person opened last on this device (`recent`) and every source marked `empty: true`.
 *
 * Up and Down move across groups, Enter opens the active item (⌘/Ctrl+Enter an address in a new tab),
 * Escape clears the field and then closes, a press outside closes, and focus goes back where it was.
 * An item is `{ id, label, detail?, glyph?, keys?, href?, run? }`: `run(item)` is the product's action,
 * an `href` goes through `onnavigate(item, event)` or the window's address. Nothing is kept but the
 * recent items with an address, on this device only.
 */
export class CommandPalette extends Component {
	/** The copy in English and Spanish. */
	static labels = words;

	#element;
	#field;
	#results;
	#status = el('p', { class: 'bui-palette-status', role: 'status' });
	#labels;
	#options;
	#sources;
	#recent;
	#shortcut;
	#groups = [];
	#sequence = 0;
	#aborts = [];
	#restore = null;
	#wait = null;

	/**
	 * @param {object} options
	 * @param {Array<{key: string, label: string, search: (query: string, context: {signal: AbortSignal}) => object[]|Promise<object[]>, empty?: boolean}>} options.sources
	 * @param {{key: string, limit?: number, storage?: Storage|null}|false} [options.recent] recent items kept on this device
	 * @param {boolean} [options.shortcut] ⌘K / Ctrl+K opens and closes it
	 * @param {((item: object, event: Event) => void)|null} [options.onnavigate] takes over an item's address
	 * @param {number} [options.delay] milliseconds after the last key before asking (120)
	 * @param {number} [options.bound] milliseconds a source may take (4000)
	 */
	constructor({ sources = [], recent = false, shortcut = false, onnavigate = null, delay = 120, bound = 4000, labels = {} }) {
		super();
		this.#labels = new Labels(words, labels);
		this.#options = { onnavigate, delay, bound };
		this.#sources = sources;
		this.#recent = recent ? new PaletteRecent(recent) : null;
		this.#results = new PaletteResults({ labels: this.#labels, onchoose: (item, group, event) => this.#choose(item, group, event) });
		this.#field = el('input', { type: 'text', class: 'bui-palette-field', role: 'combobox', autocomplete: 'off', spellcheck: 'false', 'aria-expanded': 'true', 'aria-controls': this.#results.element.id, 'aria-autocomplete': 'list', 'aria-label': this.#labels.text('label'), placeholder: this.#labels.text('placeholder'), oninput: () => this.#typed(), onkeydown: event => this.#keys(event) });
		this.#element = el('dialog', { class: 'bui-palette', 'aria-label': this.#labels.text('label') }, [
			el('div', { class: 'bui-palette-search' }, [glyph('search'), this.#field]),
			this.#results.element,
			this.#status
		]);
		this.listen(this.#element, 'cancel', event => (event.preventDefault(), this.close()));
		this.listen(this.#element, 'click', event => event.target === this.#element && this.close());
		this.#shortcut = new SidebarShortcut({ view: globalThis.document?.defaultView ?? null, run: () => (this.toggle(), true), enabled: shortcut });
	}

	get element() {
		return this.#element;
	}

	/** Whether it is open. */
	get opened() {
		return this.#element.open;
	}

	/** The shortcut as shown ("⌘K", "Ctrl+K") and as `aria-keyshortcuts`, for the product's own button. */
	get keys() {
		return this.#shortcut.words;
	}

	/** Replaces the sources (a hosted application added its own); an open palette asks again. */
	set sources(sources) {
		this.#sources = sources ?? [];
		if (this.opened) this.#search();
	}

	/** Opens it on `query` (empty by default) with focus in its field. */
	open(query = '') {
		if (this.destroyed) return;
		const document = this.#element.ownerDocument;
		if (!this.#element.isConnected) document.body.append(this.#element);
		if (!this.opened) {
			this.#restore = document.activeElement;
			this.#element.showModal?.();
			if (!this.#element.open) this.#element.setAttribute('open', '');
		}
		this.#field.value = query;
		this.#field.focus();
		this.#search();
	}

	/** Closes it, cancels what it asked and returns focus. */
	close() {
		if (!this.opened) return;
		this.#cancel();
		if (typeof this.#element.close === 'function') this.#element.close();
		this.#element.removeAttribute('open');
		this.#restore?.focus?.({ preventScroll: true });
		this.#restore = null;
	}

	toggle() {
		if (this.opened) this.close();
		else this.open();
	}

	destroy() {
		this.#cancel();
		this.#shortcut.destroy();
		super.destroy();
	}

	#typed() {
		this.#wait?.();
		this.#wait = this.later(() => this.#search(), this.#options.delay);
	}

	/** Asks every source for the field's text (or draws the recent items and the empty sources). */
	#search() {
		this.#cancel();
		const query = this.#field.value.trim();
		const sequence = ++this.#sequence;
		const asked = this.#sources.filter(source => source && typeof source.search === 'function' && (query || source.empty));
		const recent = !query && this.#recent ? [{ key: 'recent', label: this.#labels.text('recent'), state: 'ready', items: this.#recent.items }] : [];
		this.#groups = [...recent, ...asked.map(source => ({ key: source.key, label: source.label, state: 'looking', items: [] }))];
		this.#draw(query);
		asked.forEach((source, index) => this.#ask(source, query, sequence, recent.length + index));
	}

	async #ask(source, query, sequence, index) {
		const abort = new AbortController();
		this.#aborts.push(abort);
		const timer = setTimeout(() => abort.abort(new Error('bound')), this.#options.bound);
		const expired = new Promise((resolve, reject) => abort.signal.addEventListener('abort', () => reject(abort.signal.reason), { once: true }));
		let group;
		try {
			const items = await Promise.race([Promise.resolve(source.search(query, { signal: abort.signal })), expired]);
			group = { ...this.#groups[index], state: 'ready', items: (Array.isArray(items) ? items : []).filter(item => item && item.id && item.label) };
		} catch {
			group = { ...this.#groups[index], state: 'unavailable', items: [] };
		} finally {
			clearTimeout(timer);
		}
		if (sequence !== this.#sequence || this.destroyed) return;
		this.#groups[index] = group;
		this.#draw(query);
	}

	#draw(query) {
		this.#results.draw(this.#groups);
		const looking = this.#groups.some(group => group.state === 'looking');
		const count = this.#results.count;
		this.#status.textContent = count ? this.#labels.text('results', { count }) : looking ? '' : query ? this.#labels.text('none', { query }) : this.#labels.text('empty');
		const active = this.#results.active;
		if (active) this.#field.setAttribute('aria-activedescendant', active.node.id);
		else this.#field.removeAttribute('aria-activedescendant');
	}

	#keys(event) {
		if (event.isComposing) return;
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			this.#results.step(event.key === 'ArrowDown' ? 1 : -1);
			this.#draw(this.#field.value.trim());
		} else if (event.key === 'Enter') {
			const active = this.#results.active;
			if (!active) return;
			event.preventDefault();
			this.#choose(active.item, active.group, event);
		} else if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			if (this.#field.value) {
				this.#field.value = '';
				this.#search();
			} else this.close();
		}
	}

	/** Opens an item: its action, else its address (a new tab with ⌘/Ctrl), and keeps it as recent. */
	#choose(item, group, event) {
		this.#recent?.keep(item, group.key);
		const view = this.#element.ownerDocument.defaultView;
		const tab = Boolean(event?.metaKey || event?.ctrlKey);
		this.close();
		if (typeof item.run === 'function') return void item.run(item);
		if (!item.href) return;
		if (tab) return void view?.open(item.href, '_blank', 'noopener');
		if (this.#options.onnavigate) return void this.#options.onnavigate(item, event);
		view?.location.assign(item.href);
	}

	#cancel() {
		this.#wait?.();
		this.#wait = null;
		for (const abort of this.#aborts) abort.abort(new Error('closed'));
		this.#aborts = [];
		this.#sequence += 1;
	}
}
