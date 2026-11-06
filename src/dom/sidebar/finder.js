import { el } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Announcer } from '../operations/announcer.js';
import { AgainLine } from '../again/line.js';
import { Matches } from '../list/matches.js';
import { SidebarGroup } from './group.js';
import { SidebarResultKeys } from './keys.js';

/**
 * The search as one copy of a sidebar draws it: a search field named by the product's label, and while
 * a query is typed, in the groups' place, its state and results: "Searching…", the entries found with
 * "See all results" when the product gives that address, "Nothing matches “…”." or, when the source
 * failed or did not answer in time, why with Try again. A polite region says the count of results (or
 * the sentence) once each answer arrives, never while typing.
 *
 * Escape in the field clears it and brings the groups back (an empty field lets Escape through, to
 * close the drawer); Enter opens every result when the product gives that address. A field drawn in place
 * of its search icon (0.14.0, `escape`) hands every Escape to that callback after clearing the query.
 *
 * Since 0.47.0, the list rules where they meet a search's results (D162): the words a query matched
 * are marked in the results' names (L8, `Matches`, names given as text); Down from the field reaches the first
 * result and the arrows move between them (L7, `SidebarResultKeys`); no match offers Clear search, which puts the
 * caret back in the empty field (L10); an outage says when it last tried while the search asks again by itself
 * (L10, D132, `AgainLine`), with Try again.
 */
export class SidebarFinder {
	#search;
	#labels;
	#groups;
	#input;
	#field;
	#line = el('p', { class: 'bui-sidebar-line' });
	#retry;
	#erase;
	#tries;
	#arrows;
	#list;
	#results;
	#announcer = new Announcer();
	#release;
	#state = 'idle';
	#escape;

	/**
	 * @param {object} options
	 * @param {import('./search.js').SidebarSearch} options.search the shared search
	 * @param {import('../core/labels.js').Labels} options.labels the sidebar's copy
	 * @param {Element} options.groups the view's groups, hidden while a query is typed
	 * @param {(() => void)|null} [options.escape] takes every Escape in the field, after the query is cleared (0.14.0)
	 */
	constructor({ search, labels, groups, escape = null }) {
		this.#escape = escape;
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
		this.#erase = el('button', { type: 'button', class: 'bui-link-button bui-sidebar-clear', text: labels.text('clear'), onclick: () => this.#clear() });
		this.#tries = new AgainLine({ again: search.again, labels: labels.entries, locale: this.#input.ownerDocument.documentElement.lang || undefined });
		this.#tries.element.classList.add('bui-sidebar-tries');
		this.#results = el('div', { class: 'bui-sidebar-results', hidden: true }, [this.#line, this.#tries.element, this.#retry, this.#erase, this.#list.element]);
		this.#arrows = new SidebarResultKeys({ input: this.#input, results: this.#results });
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

	/** The text field. */
	get input() {
		return this.#input;
	}

	/** Moves focus to the field. */
	focus() {
		this.#input.focus({ preventScroll: true });
	}

	/** The results, shown in the groups' place while a query is typed. */
	get results() {
		return this.#results;
	}

	destroy() {
		this.#release();
		this.#arrows.destroy();
		this.#tries.destroy();
		this.#list.destroy();
		this.#field.remove();
		this.#results.remove();
		this.#groups.hidden = false;
	}

	#keys(event) {
		if (event.key === 'Escape' && this.#escape) {
			event.preventDefault();
			event.stopPropagation();
			this.#input.value = '';
			this.#search.clear();
			this.#escape();
		} else if (event.key === 'Escape' && this.#search.query) {
			event.preventDefault();
			event.stopPropagation();
			this.#input.value = '';
			this.#search.clear();
		} else if (event.key === 'Enter' && this.#search.all) {
			event.preventDefault();
			this.#list.element.querySelector('.bui-sidebar-more')?.click();
		}
	}

	/** Clear search: the groups come back and the caret is in the empty field. */
	#clear() {
		this.#input.value = '';
		this.#search.clear();
		this.focus();
	}

	/** An entry whose name is text, with the query's words marked in it (L8). */
	#marked(item, query) {
		if (typeof item?.label !== 'string') return item;
		const name = this.#input.ownerDocument.createDocumentFragment();
		name.append(...Matches.mark(item.label, query));
		return { ...item, key: item.key ?? item.href ?? item.label, label: name };
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
		this.#erase.hidden = state !== 'none';
		const all = query ? this.#search.all : null;
		const found = state === 'results' ? items.map(item => this.#marked(item, query)) : [];
		this.#list.update({ heading: state === 'results' ? labels.text('results') : null, items: found, more: all && state !== 'unavailable' ? { label: labels.text('all'), href: all } : null });
		// Each answer is said once: the count, or the sentence that replaces the results
		if (state !== this.#state || state === 'results') {
			if (state === 'results') this.#announcer.say(labels.text('count', { count: items.length }));
			else if (state === 'none' || state === 'unavailable') this.#announcer.say(words);
		}
		this.#state = state;
	}
}
