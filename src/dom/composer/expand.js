import { el } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Hint } from '../core/hint.js';

/**
 * A long draft's taller editor (0.14.0, CV-11): the field grows to about a third of the window
 * (`--bui-composer-cap`) and then scrolls; once it does, **Expand** (the `maximize` glyph alone, on
 * D11's closed list, with its name and tooltip) opens the same box over the content in a modal dialog,
 * as tall as the window allows. Escape or **Collapse** puts the box back where it was, with the draft,
 * the caret and focus kept; so does a message that was sent. The box itself moves, so the field, its
 * suggestions, attachments and toolbar keep working as they are.
 */
export class ComposerExpand {
	#root;
	#box;
	#field;
	#labels;
	#button;
	#holder;
	#dialog;
	#mark = null;
	#hint;

	/**
	 * @param {object} options
	 * @param {HTMLElement} options.root the composer (`data-capped`, `data-expanded`)
	 * @param {HTMLElement} options.box the field's box, which the editor holds while expanded
	 * @param {HTMLTextAreaElement} options.field the field
	 * @param {import('../core/labels.js').Labels} options.labels the composer's copy (`expand`, `collapse`)
	 */
	constructor({ root, box, field, labels }) {
		this.#root = root;
		this.#box = box;
		this.#field = field;
		this.#labels = labels;
		this.#button = el('button', { type: 'button', class: 'bui-icon-button bui-composer-expand', 'data-bui-hint': true, onclick: () => this.toggle() });
		this.#holder = el('span', { class: 'bui-composer-grow' }, [this.#button]);
		this.#hint = new Hint(this.#holder);
		this.#dialog = el('dialog', { class: 'bui-composer-editor', 'aria-label': field.getAttribute('aria-label') });
		this.#dialog.addEventListener('cancel', event => {
			event.preventDefault();
			this.close();
		});
		field.addEventListener('input', () => this.measure());
		this.#paint();
	}

	/** The control's holder, placed in the box. */
	get element() {
		return this.#holder;
	}

	/** The editor's dialog, placed in the composer. */
	get dialog() {
		return this.#dialog;
	}

	/** Whether the box is in the taller editor. */
	get expanded() {
		return this.#dialog.open;
	}

	/** Decides whether the field reached its cap (and Expand is offered). */
	measure() {
		const field = this.#field;
		const capped = field.isConnected && field.scrollHeight > field.clientHeight + 1;
		this.#root.toggleAttribute('data-capped', capped || this.expanded);
	}

	toggle() {
		if (this.expanded) this.close();
		else this.open();
	}

	/** Moves the box into the taller editor over the content; focus and the caret stay in the field. */
	open() {
		if (this.expanded || !this.#root.isConnected || !this.#dialog.showModal) return;
		const { selectionStart, selectionEnd } = this.#field;
		this.#mark = this.#root.ownerDocument.createComment('bui-composer-box');
		this.#box.before(this.#mark);
		this.#dialog.append(this.#box);
		this.#dialog.showModal();
		this.#root.setAttribute('data-expanded', '');
		this.#paint();
		this.#field.focus({ preventScroll: true });
		this.#field.setSelectionRange?.(selectionStart, selectionEnd);
	}

	/** Puts the box back in the composer; focus and the caret stay in the field. */
	close() {
		if (!this.expanded) return;
		const { selectionStart, selectionEnd } = this.#field;
		this.#mark.replaceWith(this.#box);
		this.#mark = null;
		this.#dialog.close();
		this.#root.removeAttribute('data-expanded');
		this.#paint();
		this.measure();
		this.#field.focus({ preventScroll: true });
		this.#field.setSelectionRange?.(selectionStart, selectionEnd);
	}

	destroy() {
		this.close();
		this.#hint.destroy();
		this.#dialog.remove();
	}

	#paint() {
		const expanded = this.expanded;
		this.#button.setAttribute('aria-label', this.#labels.text(expanded ? 'collapse' : 'expand'));
		this.#button.replaceChildren(glyph(expanded ? 'restore' : 'maximize'));
	}
}
