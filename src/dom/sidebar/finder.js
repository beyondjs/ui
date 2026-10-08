import { el } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Announcer } from '../operations/announcer.js';
import { SidebarGroup } from './group.js';

/**
 * The search as one copy of a sidebar draws it: a search field named by the product's label, and while
 * a query is typed, in the groups' place, its state and results: "Searching…", the entries found with
 * "See all results" when the product gives that address, "Nothing matches “…”." or, when the source
 * failed or did not answer in time, why with Try again. A polite region says the count of results (or
 * the sentence) once each answer arrives, never while typing.
 *
 * Escape in the field clears it and brings the groups back (an empty field lets Escape through, to
 * close the drawer); Enter opens every result when the product gives that address.
 */
export class SidebarFinder {
	#search;
	#labels;
	#groups;
	#input;
	#field;
	#line = el('p', { class: 'bui-sidebar-line' });
	#retry;
	#list;
	#results;
	#announcer = new Announcer();
	#release;
	#state = 'idle';

	/**
	 * @param {object} options
	 * @param {import('./search.js').SidebarSearch} options.search the shared search
	 * @param {import('../core/labels.js').Labels} options.labels the sidebar's copy
	 * @param {Element} options.groups the view's groups, hidden while a query is typed
	 */
	constructor({ search, labels, groups }) {
		this.#search = search;
		this.#labels = labels;
		this.#groups = groups;
		this.#list = new SidebarGroup({ kind: 'entries', labels });
		const { label, placeholder } = search.config;
		// With no placeholder of its own the field shows its name, the only words it has on screen
		this.#input = el('input', { type: 'search', class: 'bui-input bui-sidebar-query', 'aria-label': label, placeholder: placeholder ?? label, autocomplete: 'off', spellcheck: 'false', enterkeyhint: 'search' });
		this.#input.addEventListener('input', () => search.type(this.#input.value));
		this.#input.addEventListener('keydown', event => this.#keys(event));
		this.#field = el('div', { class: 'bui-sidebar-search', role: 'search' }, [glyph('search'), this.#input, this.#announcer.element]);
		this.#retry = el('button', { type: 'button', class: 'bui-link-button bui-sidebar-retry', text: labels.text('retry'), onclick: () => search.retry() });
		this.#results = el('div', { class: 'bui-sidebar-results', hidden: true }, [this.#line, this.#retry, this.#list.element]);
		this.#release = search.subscribe(() => this.#draw());
		this.#draw();
	}

	get search() {
		return this.#search;
	}

	/** The search field, placed above the groups. */
	get field() {
		return this.#field;
	}

	/** The results, shown in the groups' place while a query is typed. */
	get results() {
		return this.#results;
	}

	destroy() {
		this.#release();
		this.#list.destroy();
		this.#field.remove();
		this.#results.remove();
		this.#groups.hidden = false;
	}

	#keys(event) {
		if (event.key === 'Escape' && this.#search.query) {
			event.preventDefault();
			event.stopPropagation();
			this.#input.value = '';
			this.#search.clear();
		} else if (event.key === 'Enter' && this.#search.all) {
			event.preventDefault();
			this.#list.element.querySelector('.bui-sidebar-more')?.click();
		}
	}

	#draw() {
		const { query, state, items } = this.#search;
		const document = this.#input.ownerDocument;
		// The other copy's field follows what the person types in this one
		if (document.activeElement !== this.#input && this.#input.value.trim() !== query) this.#input.value = query;
		this.#groups.hidden = Boolean(query);
		this.#results.hidden = !query;
		const labels = this.#labels;
		const words = { searching: labels.text('searching'), none: labels.text('none', { query }), unavailable: labels.text('unavailable') }[state] ?? '';
		this.#line.textContent = words;
		this.#line.hidden = !words;
		this.#retry.hidden = state !== 'unavailable';
		const all = query ? this.#search.all : null;
		this.#list.update({ heading: state === 'results' ? labels.text('results') : null, items: state === 'results' ? items : [], more: all && state !== 'unavailable' ? { label: labels.text('all'), href: all } : null });
		// Each answer is said once: the count, or the sentence that replaces the results
		if (state !== this.#state || state === 'results') {
			if (state === 'results') this.#announcer.say(labels.text('count', { count: items.length }));
			else if (state === 'none' || state === 'unavailable') this.#announcer.say(words);
		}
		this.#state = state;
	}
}
