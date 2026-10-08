import { el, fill, content } from '../core/element.js';
import { Ids } from '../core/ids.js';
import { Placement } from '../core/placement.js';
import { Announcer } from '../operations/announcer.js';
import { MentionToken } from './token.js';
import { SuggestAsk } from './ask.js';

/**
 * Suggestions after a trigger character in a composer's field (0.11.0), such as "@" for a file of the
 * repository: the listbox of the combobox pattern, kept by the field (`aria-controls`,
 * `aria-autocomplete="list"`, `aria-expanded`, `aria-activedescendant`), with the field keeping its own
 * role and focus. "Looking…", "No match" and "Unavailable · {reason}" are said apart; a polite region
 * says each answer once. Up and Down move, Enter or Tab inserts, Escape closes (and the same token stays
 * closed); the token is replaced by the item's value and a space. Nothing is asked while an input method
 * composes, and Enter is taken only while an option is active in an open list.
 */
export class ComposerSuggest {
	#field;
	#anchor;
	#panel;
	#list;
	#line = el('p', { class: 'bui-composer-suggest-line' });
	#announcer = new Announcer();
	#ask;
	#labels;
	#trigger;
	#oninsert;
	#placement = new Placement('auto');
	#token = null;
	#closed = null;
	#items = [];
	#active = -1;
	#composing = false;
	#handlers = [];

	/**
	 * @param {object} options
	 * @param {HTMLTextAreaElement} options.field the composer's field
	 * @param {HTMLElement} options.anchor the box the list opens against (above it, or below where there is room)
	 * @param {import('../core/labels.js').Labels} options.labels the composer's copy
	 * @param {(query: string, signal: AbortSignal) => Promise<unknown>} options.source the product's `onsuggest`
	 * @param {{trigger?: string, bound?: number, delay?: number, label?: string|null, explain?: ((error: unknown) => string|null)|null}} [options.settings]
	 * @param {(text: string, caret: number) => void} options.oninsert writes the new text and caret into the field
	 */
	constructor({ field, anchor, labels, source, settings = {}, oninsert }) {
		const { trigger = '@', bound, delay, label = null, explain = null } = settings ?? {};
		if (typeof trigger !== 'string' || [...trigger].length !== 1 || /\s/.test(trigger)) throw new TypeError("A suggestion's trigger is one character that is not a space");
		this.#field = field;
		this.#anchor = anchor;
		this.#labels = labels;
		this.#trigger = trigger;
		this.#oninsert = oninsert;
		this.#ask = new SuggestAsk({ source, bound, delay, explain, labels });
		this.#list = el('ul', { id: Ids.next('bui-composer-suggestions'), class: 'bui-composer-options', role: 'listbox', 'aria-label': label ?? labels.text('suggestions') });
		this.#panel = el('div', { class: 'bui-menu bui-align-start bui-composer-suggest', hidden: true, onpointerdown: event => event.preventDefault() }, [this.#list, this.#line, this.#announcer.element]);
		field.setAttribute('aria-autocomplete', 'list');
		field.setAttribute('aria-controls', this.#list.id);
		field.setAttribute('aria-expanded', 'false');
		this.#on('input', event => (event.isComposing ? null : this.#read()));
		this.#on('compositionstart', () => ((this.#composing = true), this.close()));
		this.#on('compositionend', () => ((this.#composing = false), this.#read()));
		this.#on('click', () => this.#read());
		this.#on('keyup', event => ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) && this.#read());
		this.#on('blur', () => this.close());
	}

	/** The list's panel, placed inside the composer. */
	get element() {
		return this.#panel;
	}

	/** Whether the list is open. */
	get open() {
		return !this.#panel.hidden;
	}

	/** The list's state: `looking`, `results`, `none` or `unavailable` while open; `closed` otherwise. */
	get state() {
		return this.open ? this.#panel.dataset.state : 'closed';
	}

	/**
	 * Handles a key in the field while the list is open; returns whether it was taken. Enter and Tab are
	 * taken only while an option is active, so a closed or empty list never steals Enter.
	 */
	keys(event) {
		if (!this.open || event.isComposing || event.keyCode === 229) return false;
		if (event.key === 'Escape') {
			this.#closed = this.#token;
			this.close();
			return true;
		}
		const options = this.#items.length;
		if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && options) {
			this.#move(this.#active + (event.key === 'ArrowDown' ? 1 : -1));
			return true;
		}
		if ((event.key === 'Enter' || event.key === 'Tab') && options && this.#active >= 0 && !event.shiftKey) {
			this.#insert(this.#items[this.#active]);
			return true;
		}
		return false;
	}

	close() {
		this.#ask.cancel();
		this.#panel.hidden = true;
		this.#items = [];
		this.#active = -1;
		this.#field.setAttribute('aria-expanded', 'false');
		this.#field.removeAttribute('aria-activedescendant');
	}

	destroy() {
		this.close();
		for (const [type, handler] of this.#handlers) this.#field.removeEventListener(type, handler);
		this.#handlers = [];
		for (const name of ['aria-autocomplete', 'aria-controls', 'aria-expanded', 'aria-activedescendant']) this.#field.removeAttribute(name);
	}

	#on(type, handler) {
		this.#field.addEventListener(type, handler);
		this.#handlers.push([type, handler]);
	}

	/** Reads the token at the caret and asks for it, unless it is the one just closed. */
	#read() {
		if (this.#composing) return;
		const { value, selectionStart, selectionEnd } = this.#field;
		const token = selectionStart === selectionEnd ? MentionToken.at(value, selectionStart, this.#trigger) : null;
		if (!token) {
			this.#token = null;
			this.#closed = null;
			return this.close();
		}
		if (this.#closed && this.#closed.start === token.start) return;
		this.#closed = null;
		if (token.same(this.#token) && this.open) return;
		this.#token = token;
		this.#ask.ask(token.query, answer => this.#show(answer));
	}

	#show({ state, items = [], reason = null }) {
		this.#panel.dataset.state = state;
		this.#items = state === 'results' ? items : [];
		this.#active = this.#items.length ? 0 : -1;
		fill(this.#list, this.#items.map((item, index) => this.#option(item, index)));
		this.#list.hidden = !this.#items.length;
		const line = { looking: this.#labels.text('looking'), none: this.#labels.text('nomatch'), unavailable: this.#labels.text('unavailable', { reason }) }[state] ?? '';
		this.#line.textContent = line;
		this.#line.hidden = !line;
		if (state !== 'looking') this.#announcer.say(state === 'results' ? this.#labels.text('suggested', { count: this.#items.length }) : line);
		this.#panel.hidden = false;
		this.#field.setAttribute('aria-expanded', String(Boolean(this.#items.length)));
		this.#move(this.#active);
		this.#placement.place(this.#panel, this.#anchor);
	}

	#option(item, index) {
		const node = el('li', { id: `${this.#list.id}-${index}`, class: 'bui-composer-option', role: 'option', 'aria-selected': 'false', onclick: () => this.#insert(item) }, [el('span', { class: 'bui-composer-option-label', 'data-mono': item.mono ? '' : null }, [content(item.label ?? item.value)]), item.detail ? el('span', { class: 'bui-composer-option-detail' }, [content(item.detail)]) : null]);
		return node;
	}

	#move(index) {
		const nodes = [...this.#list.children];
		if (!nodes.length) {
			this.#active = -1;
			return this.#field.removeAttribute('aria-activedescendant');
		}
		this.#active = (index + nodes.length) % nodes.length;
		nodes.forEach((node, at) => node.setAttribute('aria-selected', String(at === this.#active)));
		const active = nodes[this.#active];
		this.#field.setAttribute('aria-activedescendant', active.id);
		active.scrollIntoView?.({ block: 'nearest' });
	}

	#insert(item) {
		const token = this.#token;
		if (!token) return;
		const { text, caret } = token.replace(this.#field.value, String(item.value));
		this.#token = null;
		this.close();
		this.#oninsert(text, caret);
	}
}
