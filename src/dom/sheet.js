import { Component } from './core/component.js';
import { el, fill, content } from './core/element.js';
import { glyph } from './core/icons.js';
import { Hint } from './core/hint.js';
import { Ids } from './core/ids.js';
import { Labels } from './core/labels.js';
import { Focus } from './core/focus.js';
import { Interaction } from './core/interaction.js';

const widths = Object.freeze(['form', 'standard']);

/**
 * A side sheet (LR-07, FAM-40): a task or an item opened from the inline end of the window while the
 * page it came from stays in view behind it, such as Projects' add task hosted by Conduict.
 *
 * It is a native modal `<dialog>` (the page behind is inert), named by its title, as tall as the
 * window, `--layout-form` wide (`width: 'standard'` for `--layout-standard`) and the whole width
 * below the family cut (1024 px). Opening moves focus to `[data-autofocus]` inside it, else to its
 * title; Tab and Shift+Tab stay inside; closing returns focus to `restore` (given to `open`), else to
 * the element that opened it, else to the constructor's `restore`, never to the page's body.
 *
 * A task sheet never closes on a press outside. Escape and the close button close it, except while
 * `busy` (the hosted task is working): then nothing closes it. `error(node)` shows a failure at its
 * top, such as "Beyond Projects didn't answer" with Try again, without closing it or losing what the
 * person did. It slides in with `--motion-standard`, and appears at once under reduced motion.
 * `open()` resolves with the value given to `close(value)`; a dismissal gives null.
 */
export class SideSheet extends Component {
	/** The copy in English and Spanish. */
	static labels = Object.freeze({ en: Object.freeze({ close: 'Close' }), es: Object.freeze({ close: 'Cerrar' }) });
	static widths = widths;

	#element;
	#heading;
	#body;
	#problem;
	#footer;
	#closer;
	#hint;
	#restore;
	#onclose;
	#busy = false;
	#opener = null;
	#given = null;
	#adopted = false;
	#settle = null;
	#overflow = null;
	#closing = false;

	/**
	 * @param {object} options
	 * @param {string|Node} options.title what the sheet is for ("Add repositories to Storefront")
	 * @param {string} [options.label] its accessible name, when it should differ from the title
	 * @param {string|Node} [options.description] one line under the title
	 * @param {Node[]} [options.children] the body
	 * @param {Node[]} [options.actions] the footer's actions, which stay in view
	 * @param {'form'|'standard'} [options.width]
	 * @param {Element} [options.restore] focus target after closing when nothing better is known
	 * @param {(value: unknown) => void} [options.onclose]
	 */
	constructor({ title, label = null, description = null, children = [], actions = [], width = 'form', restore = null, onclose = null, labels = {} }) {
		super();
		if (!widths.includes(width)) throw new TypeError(`A side sheet's width is one of ${widths.join(', ')}`);
		const text = new Labels(SideSheet.labels.en, labels);
		this.#restore = restore;
		this.#onclose = onclose;
		const id = Ids.next('bui-sheet');
		this.#heading = el('h2', { id: `${id}-title`, class: 'bui-sheet-title', tabindex: '-1' }, [content(title)]);
		this.#closer = el('button', { type: 'button', class: 'bui-icon-button bui-sheet-close', 'aria-label': text.text('close'), 'data-bui-hint': true, onclick: () => this.dismiss() }, [glyph('close')]);
		this.#problem = el('div', { class: 'bui-sheet-problem', role: 'alert', hidden: true });
		this.#body = el('div', { class: 'bui-sheet-body' }, children);
		this.#footer = el('div', { class: 'bui-sheet-actions', hidden: !actions.length }, actions);
		this.#element = el('dialog', { class: `bui-sheet bui-sheet-${width}`, 'aria-labelledby': label ? null : `${id}-title`, 'aria-label': label, 'aria-describedby': description ? `${id}-description` : null, closedby: 'closerequest' }, [
			el('div', { class: 'bui-sheet-head' }, [this.#heading, this.#closer]),
			description ? el('p', { id: `${id}-description`, class: 'bui-sheet-description' }, [content(description)]) : null,
			this.#problem,
			this.#body,
			this.#footer
		]);
		this.#element.addEventListener('keydown', event => this.#keys(event));
		this.#element.addEventListener('cancel', event => {
			event.preventDefault();
			this.dismiss();
		});
		this.#element.addEventListener('close', () => this.#closed());
		this.#hint = new Hint(this.#element);
	}

	get element() {
		return this.#element;
	}

	/** The body, for the content a product mounts into it (a hosted task, React portals). */
	get body() {
		return this.#body;
	}

	/** The footer holding the actions. */
	get footer() {
		return this.#footer;
	}

	get shown() {
		return this.#element.open;
	}

	get busy() {
		return this.#busy;
	}

	/** While busy, Escape and the close button do nothing; the close button is marked unavailable. */
	set busy(value) {
		this.#busy = Boolean(value);
		this.#element.setAttribute('aria-busy', String(this.#busy));
		this.#element.toggleAttribute('data-busy', this.#busy);
		this.#element.setAttribute('closedby', this.#busy ? 'none' : 'closerequest');
		if (this.#busy) this.#closer.setAttribute('aria-disabled', 'true');
		else this.#closer.removeAttribute('aria-disabled');
	}

	set title(value) {
		fill(this.#heading, [content(value)]);
	}

	/** Replaces the footer's actions. */
	set actions(nodes) {
		fill(this.#footer, nodes);
		this.#footer.hidden = !this.#footer.childElementCount;
	}

	/** Replaces the body. */
	fill(children) {
		fill(this.#body, children);
		return this;
	}

	/** Shows a failure at the top (a node, such as a callout with Try again), or clears it with null. */
	error(node) {
		fill(this.#problem, node ? [node.element ?? node] : []);
		this.#problem.hidden = !node;
	}

	/** Opens the sheet. Resolves with the value it closes with; `restore` receives focus afterwards. */
	open({ restore = null } = {}) {
		if (this.destroyed) return Promise.resolve(null);
		if (this.#element.open) return this.#settle.promise;
		const document = this.#element.ownerDocument;
		this.#opener = Interaction.origin(document);
		this.#given = restore;
		if (!this.#element.isConnected) {
			document.body.append(this.#element);
			this.#adopted = true;
		}
		this.#settle = SideSheet.#resolvers();
		this.#element.showModal();
		this.#overflow = document.documentElement.style.overflow;
		document.documentElement.style.overflow = 'hidden';
		this.focus();
		return this.#settle.promise;
	}

	/** Moves focus to `[data-autofocus]` in the sheet, else to its title. */
	focus() {
		const chosen = this.#element.querySelector('[data-autofocus]') ?? this.#heading;
		chosen.focus({ preventScroll: true });
	}

	/** Closes with a value, unless busy. Returns whether it closed. */
	close(value = null) {
		if (!this.#element.open || this.#busy) return false;
		this.#closing = true;
		this.#element.close();
		this.#closing = false;
		this.#finish(value);
		return true;
	}

	/** A dismissal (Escape, the close button): closes with null unless busy. */
	dismiss() {
		return this.close(null);
	}

	destroy() {
		this.#busy = false;
		if (this.#element.open) this.close(null);
		this.#hint.destroy();
		super.destroy();
	}

	#keys(event) {
		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			this.dismiss();
		} else if (event.key === 'Tab') this.#cycle(event);
	}

	/** Keeps Tab inside, moving focus itself so WebKit's Tab, which skips links by default, never leaves for the page behind. */
	#cycle(event) {
		const targets = new Focus(this.#element).targets;
		event.preventDefault();
		if (!targets.length) return;
		const document = this.#element.ownerDocument;
		const step = event.shiftKey ? -1 : 1;
		let index = this.#place(targets, document.activeElement, step);
		// A target that does not take focus (not rendered, or refused by the engine) is passed over (0.7.4)
		for (let tried = 0; tried < targets.length; tried++) {
			index = (index + step + targets.length) % targets.length;
			targets[index].focus({ preventScroll: true });
			if (document.activeElement === targets[index]) return;
		}
	}

	/**
	 * Where Tab starts from: the active target, or for an element inside that is not one (a menu's
	 * option) the place just before the next target after it in document order (0.7.4).
	 */
	#place(targets, active, step) {
		const index = targets.indexOf(active);
		if (index >= 0) return index;
		if (!active || !this.#element.contains(active)) return step > 0 ? -1 : 0;
		const after = targets.findIndex(node => active.compareDocumentPosition(node) & 4);
		const next = after < 0 ? targets.length : after;
		return step > 0 ? next - 1 : next;
	}

	// Closed by something other than this class, such as a form with `method="dialog"`.
	#closed() {
		if (this.#closing || !this.#settle) return;
		if (this.#busy && !this.destroyed) {
			this.#element.showModal();
			return;
		}
		this.#finish(this.#element.returnValue || null);
	}

	#finish(value) {
		const settle = this.#settle;
		if (!settle) return;
		this.#settle = null;
		const document = this.#element.ownerDocument;
		document.documentElement.style.overflow = this.#overflow ?? '';
		this.#overflow = null;
		if (this.#adopted) {
			this.#element.remove();
			this.#adopted = false;
		}
		const target = [this.#given, this.#opener, this.#restore].find(node => node?.isConnected && node !== document.body);
		this.#given = null;
		this.#opener = null;
		target?.focus?.({ preventScroll: true });
		this.#onclose?.(value);
		settle.resolve(value);
	}

	static #resolvers() {
		if (Promise.withResolvers) return Promise.withResolvers();
		let resolve;
		const promise = new Promise(done => (resolve = done));
		return { promise, resolve };
	}
}
