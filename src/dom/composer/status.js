import { el, fill, content } from '../core/element.js';
import { Ids } from '../core/ids.js';
import { glyph } from '../core/icons.js';
import { Button } from '../button.js';

/**
 * A composer's state line, the box's first band (since 0.11.0 a line of its own above the field): one
 * sentence that changes what sending does ("My first VM is stopped · about $0.20 an hour"), with an
 * optional action at its end. The sentence describes the field. The value is text or a node, or
 * `{ text, action }` where the action is a node, a component or `{ label, run }` (a quiet button).
 *
 * Since 0.29.0 (D183) the band is also the one place where the composer says why a message was not sent
 * (`say()`): an established failure, drawn as one (the alert glyph, the danger hue, `role="alert"`), on
 * a row of its own above the sentence. An empty message is never said here: nothing failed.
 */
export class ComposerStatus {
	#element;
	#text;
	#problem = el('p', { id: Ids.next('bui-composer-problem'), class: 'bui-composer-problem', role: 'alert', hidden: true });
	#action = el('span', { class: 'bui-composer-status-action' });
	#button = null;
	#run = null;

	constructor() {
		this.#text = el('p', { id: Ids.next('bui-composer-status'), class: 'bui-composer-status' });
		this.#text.hidden = true;
		this.#element = el('div', { class: 'bui-composer-line', hidden: true }, [this.#problem, this.#text]);
	}

	get element() {
		return this.#element;
	}

	/** The sentence's id while it is shown (it describes the field), else null. */
	get id() {
		return this.#text.hidden ? null : this.#text.id;
	}

	/** The failure's id while one is said (it describes the field), else null (0.29.0). */
	get problem() {
		return this.#problem.hidden ? null : this.#problem.id;
	}

	/** Text, a node, `{ text, action }`, or null for none. */
	set value(value) {
		const empty = value === null || value === undefined || value === '';
		const framed = !empty && typeof value === 'object' && !value.nodeType && 'text' in value;
		const text = framed ? value.text : value;
		this.#text.hidden = empty;
		fill(this.#text, empty ? [] : [content(text)]);
		this.#act(framed ? value.action : null);
		this.#show();
	}

	/**
	 * Says why a message was not sent, or clears it with null; true when what the band says changed
	 * (0.29.0, before in a line between the field and the toolbar).
	 */
	say(text) {
		if (!text && this.#problem.hidden) return false;
		this.#problem.hidden = !text;
		fill(this.#problem, text ? [glyph('alert'), el('span', { text })] : []);
		this.#show();
		return true;
	}

	destroy() {
		this.#button?.destroy();
	}

	/** The band shows while it says something: a failure, a sentence or both. */
	#show() {
		this.#element.hidden = this.#text.hidden && this.#problem.hidden;
	}

	/** The action at the line's end; a button that stays keeps its element, so focus on it stays. */
	#act(action) {
		if (!action || action.nodeType || action.element) {
			this.#button?.destroy();
			this.#button = null;
		}
		if (!action) return void this.#action.remove();
		if (action.nodeType || action.element) {
			const node = action.element ?? action;
			if (this.#action.firstChild !== node) fill(this.#action, [node]);
		} else {
			this.#run = action.run;
			if (this.#button) this.#button.label = action.label;
			else {
				this.#button = new Button({ label: action.label, variant: 'quiet', onclick: () => this.#run?.() });
				fill(this.#action, [this.#button.element]);
			}
		}
		if (this.#action.parentNode !== this.#element) this.#element.append(this.#action);
	}
}
