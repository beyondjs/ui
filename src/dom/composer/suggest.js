import { el, fill, content } from '../core/element.js';
import { Ids } from '../core/ids.js';
import { Placement } from '../core/placement.js';
import { Announcer } from '../operations/announcer.js';
import { MentionToken } from './token.js';
import { SuggestAsk } from './ask.js';
import { CaretPoint } from './caret.js';

/**
 * Suggestions after a trigger character in a composer's field (0.11.0), such as "@" for a file of the
 * repository: a listbox kept by the field, which keeps its own role (a multi-line text box) and focus
 * and says it with the attributes a text box takes (`aria-controls`, `aria-autocomplete="list"`,
 * `aria-haspopup="listbox"`, `aria-activedescendant`; since 0.11.2 no `aria-expanded`, which a text box
 * does not take). The list opens at the trigger being typed (0.11.2), each option on one line: its label,
 * then its detail, cut at the line's end. "Looking…", "No match" and "Unavailable · {reason}" are said apart; a polite region
 * says each answer once. Up and Down move, Enter or Tab inserts, Escape closes (and the same token stays
 * closed); the token is replaced by the item's value and a space. Nothing is asked while an input method
 * composes, and Enter is taken only while an option is active in an open list.
 *
 * A list the source cut (0.11.1: `{ items, total }`, `{ items, more: true }` or `{ items, note }`) ends
 * with a line that says so ("50 of 120 · keep typing to narrow"), kept in view at the list's end, which
 * describes the list and is said once with the answer ("50 of 120 suggestions · keep typing to narrow").
 */
export class ComposerSuggest {
	#field;
	#anchor;
	#panel;
	#list;
	#line = el('p', { id: Ids.next('bui-composer-suggest-line'), class: 'bui-composer-suggest-line' });
	#announcer = new Announcer();
	#ask;
	#labels;
	#numbers;
	#trigger;
	#oninsert;
	#placement = new Placement('auto');
	#caret;
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
	 * @param {string} [options.locale] the language of the counts in a cut list's last line
	 */
	constructor({ field, anchor, labels, source, settings = {}, oninsert, locale = undefined }) {
		const { trigger = '@', bound, delay, label = null, explain = null } = settings ?? {};
		if (typeof trigger !== 'string' || [...trigger].length !== 1 || /\s/.test(trigger)) throw new TypeError("A suggestion's trigger is one character that is not a space");
		this.#field = field;
		this.#anchor = anchor;
		this.#labels = labels;
		this.#numbers = new Intl.NumberFormat(locale);
		this.#trigger = trigger;
		this.#oninsert = oninsert;
		this.#ask = new SuggestAsk({ source, bound, delay, explain, labels });
		this.#list = el('ul', { id: Ids.next('bui-composer-suggestions'), class: 'bui-composer-options', role: 'listbox', 'aria-label': label ?? labels.text('suggestions') });
		this.#panel = el('div', { class: 'bui-menu bui-align-start bui-composer-suggest', hidden: true, onpointerdown: event => event.preventDefault() }, [this.#list, this.#line, this.#announcer.element]);
		field.setAttribute('aria-autocomplete', 'list');
		field.setAttribute('aria-controls', this.#list.id);
		field.setAttribute('aria-haspopup', 'listbox');
		this.#caret = new CaretPoint(field);
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
		this.#field.removeAttribute('aria-activedescendant');
	}

	destroy() {
		this.close();
		for (const [type, handler] of this.#handlers) this.#field.removeEventListener(type, handler);
		this.#handlers = [];
		for (const name of ['aria-autocomplete', 'aria-controls', 'aria-haspopup', 'aria-activedescendant']) this.#field.removeAttribute(name);
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

	#show({ state, items = [], reason = null, total = null, more = false, note = null }) {
		this.#panel.dataset.state = state;
		this.#items = state === 'results' ? items : [];
		this.#active = this.#items.length ? 0 : -1;
		fill(this.#list, this.#items.map((item, index) => this.#option(item, index)));
		this.#list.hidden = !this.#items.length;
		const cut = state === 'results' ? this.#cut(this.#items.length, total, more, note) : null;
		const line = cut?.line ?? { looking: this.#labels.text('looking'), none: this.#labels.text('nomatch'), unavailable: this.#labels.text('unavailable', { reason }) }[state] ?? '';
		this.#line.textContent = line;
		this.#line.hidden = !line;
		this.#panel.toggleAttribute('data-cut', Boolean(cut));
		if (cut) this.#list.setAttribute('aria-describedby', this.#line.id);
		else this.#list.removeAttribute('aria-describedby');
		if (state !== 'looking') this.#announcer.say(cut?.said ?? (state === 'results' ? this.#labels.text('suggested', { count: this.#items.length }) : line));
		this.#panel.hidden = false;
		this.#move(this.#active);
		this.#align();
		this.#placement.place(this.#panel, this.#anchor);
	}

	/** Moves the list along the box to the trigger being typed, never past the box's end. */
	#align() {
		this.#panel.style.removeProperty('left');
		const point = this.#token ? this.#caret.at(this.#token.start) : null;
		if (!point) return;
		const box = this.#anchor.getBoundingClientRect();
		const field = this.#field.getBoundingClientRect();
		const room = box.width - this.#panel.getBoundingClientRect().width;
		const left = Math.max(0, Math.min(field.left - box.left + point.left, room));
		if (left > 0) this.#panel.style.left = `${Math.round(left)}px`;
	}

	/** A cut list's last line and what is said with it, or null for a whole list. */
	#cut(count, total, more, note) {
		if (note) return { line: note, said: `${this.#labels.text('suggested', { count })} · ${note}` };
		if (!more) return null;
		const values = { count: this.#numbers.format(count), total: total === null ? null : this.#numbers.format(total) };
		return { line: this.#labels.text('narrow', values), said: this.#labels.text('narrowed', values) };
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
