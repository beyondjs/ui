import { el, fill, content } from '../core/element.js';
import { Ids } from '../core/ids.js';
import { Button } from '../button.js';

/**
 * A composer's state line (since 0.11.0 outside the field's box, above it, as a line of its own): one
 * sentence that changes what sending does ("My first VM is stopped · about $0.20 an hour"), with an
 * optional action at its end. The sentence describes the field. The value is text or a node, or
 * `{ text, action }` where the action is a node, a component or `{ label, run }` (a quiet button).
 */
export class ComposerStatus {
	#element;
	#text;
	#action = el('span', { class: 'bui-composer-status-action' });
	#button = null;
	#run = null;

	constructor() {
		this.#text = el('p', { id: Ids.next('bui-composer-status'), class: 'bui-composer-status' });
		this.#text.hidden = true;
		this.#element = el('div', { class: 'bui-composer-line', hidden: true }, [this.#text]);
	}

	get element() {
		return this.#element;
	}

	/** The sentence's id while it is shown (it describes the field), else null. */
	get id() {
		return this.#element.hidden ? null : this.#text.id;
	}

	/** Text, a node, `{ text, action }`, or null for none. */
	set value(value) {
		const empty = value === null || value === undefined || value === '';
		const framed = !empty && typeof value === 'object' && !value.nodeType && 'text' in value;
		const text = framed ? value.text : value;
		this.#element.hidden = empty;
		this.#text.hidden = empty;
		fill(this.#text, empty ? [] : [content(text)]);
		this.#act(framed ? value.action : null);
	}

	destroy() {
		this.#button?.destroy();
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
