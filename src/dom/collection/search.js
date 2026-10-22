import { Component } from '../core/component.js';
import { el } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Ids } from '../core/ids.js';
import { Hint } from '../core/hint.js';

/** An inline search editor whose closed summary keeps the applied query visible. */
export class CollectionSearch extends Component {
	#element;
	#input;
	#trigger;
	#editor;
	#summary;
	#clear;
	#labels;
	#compact;
	#hint;
	#change;
	#close;

	constructor({ label, labels, compact, onchange, onclose }) {
		super();
		this.#labels = labels;
		this.#compact = compact;
		this.#change = onchange;
		this.#close = onclose;
		const id = Ids.next('bui-list-search');
		const name = typeof label === 'string' ? labels.text('search', { label }) : labels.text('placeholder');
		this.#trigger = el('button', { type: 'button', class: 'bui-icon-button', 'aria-label': name, 'data-bui-hint': '', 'aria-controls': id, 'aria-expanded': 'false', hidden: !compact, onclick: () => this.#editor.hidden ? this.focus() : this.close() }, [glyph('search')]);
		this.#input = el('input', { id: `${id}-input`, type: 'search', class: 'bui-input', autocomplete: 'off', placeholder: name, oninput: event => { if (!event.isComposing) this.#typed(); }, oncompositionend: () => this.#typed() });
		this.#editor = el('span', { id, class: 'bui-list-search-editor', hidden: compact }, [el('label', { for: this.#input.id, class: 'bui-hidden', text: name }), this.#input]);
		this.#summary = el('button', { type: 'button', class: 'bui-button bui-button-quiet bui-list-query', hidden: true, onclick: () => this.focus() });
		this.#clear = el('button', { type: 'button', class: 'bui-icon-button', 'aria-label': labels.text('erase'), 'data-bui-hint': '', hidden: true, onclick: () => this.#erase() }, [glyph('close')]);
		this.#element = el('div', { class: 'bui-list-search', onkeydown: event => this.#key(event) }, [this.#trigger, this.#editor, this.#summary, this.#clear]);
		this.#hint = new Hint(this.#element);
	}

	get element() { return this.#element; }

	set value(value) {
		if (this.#input.value !== value) this.#input.value = value;
		this.#draw();
	}

	/** Reveals the same editor without changing its query or selection. */
	focus() {
		this.#editor.hidden = false;
		this.#trigger.setAttribute('aria-expanded', 'true');
		this.#draw();
		this.#input.focus();
	}

	close() {
		this.#close?.();
		if (!this.#compact) return;
		this.#editor.hidden = true;
		this.#trigger.setAttribute('aria-expanded', 'false');
		this.#draw();
		this.#trigger.focus();
	}

	#key(event) {
		if (event.isComposing) return;
		if (event.key === 'Escape' && !this.#editor.hidden) {
			// Native search inputs can clear on Escape. Closing is never a clearing action.
			event.preventDefault();
			if (this.#compact) event.stopPropagation();
			this.close();
		} else if (event.key === 'Enter' && event.target === this.#input) {
			event.preventDefault();
			this.#close?.();
		}
	}

	#typed() {
		this.#draw();
		this.#change(this.#input.value, false);
	}

	#erase() {
		this.#input.value = '';
		this.#draw();
		this.#change('', true);
		this.focus();
	}

	#draw() {
		const query = this.#input.value;
		this.#summary.textContent = this.#labels.text('query', { query });
		this.#summary.hidden = !query || !this.#editor.hidden;
		this.#clear.hidden = !query;
	}

	destroy() {
		this.#hint.destroy();
		super.destroy();
	}
}
