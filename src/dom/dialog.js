import { Component } from './core/component.js';
import { el, append, fill, content } from './core/element.js';
import { icon } from './core/icons.js';
import { Ids } from './core/ids.js';
import { Labels } from './core/labels.js';
import { Focus } from './core/focus.js';

const defaults = { close: 'Close' };

/**
 * A modal dialog on the native `<dialog>` element.
 *
 * Each instance is named by its own title (and described by its description). Opening remembers the
 * element that had focus, makes the rest of the page inert (`showModal`), keeps Tab and Shift+Tab
 * inside the dialog and moves focus to `[data-autofocus]`, the first field or the first action.
 * Closing returns focus to that element, or to `restore` when it is gone.
 *
 * Dismissal policy: Escape and the close button dismiss unless `escape` is false; a press on the
 * backdrop dismisses only with `backdrop: true`. While `busy` nothing dismisses it — not Escape, the
 * close button, the backdrop nor a repeated close request — so an operation whose integrity matters
 * can finish. `open()` returns a promise of the value given to `close(value)`; a dismissal gives null.
 */
export class Dialog extends Component {
	#element;
	#heading;
	#body;
	#footer;
	#closer;
	#labels;
	#escape;
	#backdrop;
	#restore;
	#onclose;
	#busy = false;
	#opener = null;
	#adopted = false;
	#settle = null;
	#closing = false;

	/**
	 * @param {object} options
	 * @param {string|Node} options.title
	 * @param {string|Node} [options.description]
	 * @param {Node[]} [options.children] body content
	 * @param {Node[]} [options.actions] footer actions, usually buttons
	 * @param {boolean} [options.escape] Escape and the close button dismiss (default true)
	 * @param {boolean} [options.backdrop] a press on the backdrop dismisses (default false)
	 * @param {'small'|'medium'|'large'} [options.size]
	 * @param {Element} [options.restore] focus target after closing when the opener is gone
	 */
	constructor({ title, description = null, children = [], actions = [], escape = true, backdrop = false, size = 'medium', restore = null, onclose = null, labels = {} }) {
		super();
		this.#labels = new Labels(defaults, labels);
		this.#escape = escape;
		this.#backdrop = backdrop;
		this.#restore = restore;
		this.#onclose = onclose;
		const id = Ids.next('bui-dialog');
		this.#heading = el('h2', { id: `${id}-title`, class: 'bui-dialog-title' }, [content(title)]);
		this.#closer = el('button', { type: 'button', class: 'bui-icon-button', 'aria-label': this.#labels.text('close'), onclick: () => this.dismiss() }, [icon('close')]);
		this.#body = el('div', { class: 'bui-dialog-body' }, children);
		this.#footer = el('div', { class: 'bui-dialog-actions', hidden: !actions.length }, actions);
		this.#element = el(
			'dialog',
			{ class: `bui-dialog bui-dialog-${size}`, 'aria-labelledby': `${id}-title`, 'aria-describedby': description ? `${id}-description` : null },
			[
				el('div', { class: 'bui-dialog-head' }, [this.#heading, escape ? this.#closer : null]),
				description ? el('p', { id: `${id}-description`, class: 'bui-dialog-description' }, [content(description)]) : null,
				this.#body,
				this.#footer
			]
		);
		this.#element.addEventListener('keydown', event => this.#keys(event));
		this.#element.addEventListener('cancel', event => {
			event.preventDefault();
			this.dismiss();
		});
		this.#element.addEventListener('close', () => this.#closed());
		this.#element.addEventListener('click', event => this.#press(event));
		this.#policy();
	}

	get element() {
		return this.#element;
	}

	/** The body element, for consumers that render into it (the React adapter does). */
	get body() {
		return this.#body;
	}

	/** The footer element holding the actions. */
	get footer() {
		return this.#footer;
	}

	get shown() {
		return this.#element.open;
	}

	get busy() {
		return this.#busy;
	}

	/** Busy dialogs cannot be dismissed; the close button is marked unavailable. */
	set busy(value) {
		this.#busy = Boolean(value);
		this.#element.setAttribute('aria-busy', String(this.#busy));
		this.#element.toggleAttribute('data-busy', this.#busy);
		if (this.#busy) this.#closer.setAttribute('aria-disabled', 'true');
		else this.#closer.removeAttribute('aria-disabled');
		this.#policy();
	}

	set title(value) {
		fill(this.#heading, [content(value)]);
	}

	/** Replaces the body content. */
	fill(children) {
		fill(this.#body, children);
		return this;
	}

	/** Replaces the footer actions. */
	set actions(nodes) {
		fill(this.#footer, nodes);
		this.#footer.hidden = !this.#footer.childElementCount;
	}

	/** Opens the dialog modally. Resolves with the value it closes with. */
	open() {
		if (this.destroyed) return Promise.resolve(null);
		if (this.#element.open) return this.#settle.promise;
		const document = this.#element.ownerDocument;
		this.#opener = document.activeElement;
		if (!this.#element.isConnected) {
			document.body.append(this.#element);
			this.#adopted = true;
		}
		this.#settle = Promise.withResolvers ? Promise.withResolvers() : Dialog.#resolvers();
		this.#element.showModal();
		new Focus(this.#element).first(this.#closer);
		return this.#settle.promise;
	}

	/** Closes with a value, unless busy. Returns whether it closed. */
	close(value = null) {
		if (!this.#element.open || this.#busy) return false;
		this.#closing = true;
		this.#element.close();
		this.#finish(value);
		return true;
	}

	/** A dismissal request: Escape, the close button or the backdrop. Honors the policy. */
	dismiss() {
		if (!this.#escape) return false;
		return this.close(null);
	}

	destroy() {
		this.#busy = false;
		if (this.#element.open) this.close(null);
		super.destroy();
	}

	#policy() {
		// `closedby` (where supported) keeps the browser itself from closing a dialog that must stay.
		this.#element.setAttribute('closedby', this.#busy || !this.#escape ? 'none' : 'closerequest');
	}

	#keys(event) {
		if (event.key === 'Escape') {
			// The policy decides; the browser's own close request would bypass a busy dialog.
			event.preventDefault();
			event.stopPropagation();
			this.dismiss();
		} else if (event.key === 'Tab') new Focus(this.#element).wrap(event);
	}

	#press(event) {
		if (event.target !== this.#element || !this.#backdrop) return;
		const box = this.#element.getBoundingClientRect();
		const inside = event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
		if (!inside) this.dismiss();
	}

	#closed() {
		if (this.#closing) {
			this.#closing = false;
			return;
		}
		// Closed by something other than this class, such as a `method="dialog"` form.
		if (this.#busy && !this.destroyed) {
			this.#element.showModal();
			return;
		}
		this.#finish(this.#element.returnValue || null);
	}

	#finish(value) {
		const opener = this.#opener;
		this.#opener = null;
		if (this.#adopted) {
			this.#element.remove();
			this.#adopted = false;
		}
		const target = opener?.isConnected ? opener : this.#restore;
		target?.focus?.();
		this.#onclose?.(value);
		this.#settle?.resolve(value);
	}

	static #resolvers() {
		let resolve;
		const promise = new Promise(done => (resolve = done));
		return { promise, resolve };
	}

	/** Appends children to the body. */
	append(children) {
		append(this.#body, children);
		return this;
	}
}
