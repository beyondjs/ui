import { Backdrop } from './core/backdrop.js';
import { Component } from './core/component.js';
import { el, fill, content } from './core/element.js';
import { glyph } from './core/icons.js';
import { Hint } from './core/hint.js';
import { Ids } from './core/ids.js';
import { Labels } from './core/labels.js';
import { Focus } from './core/focus.js';
import { Interaction } from './core/interaction.js';
import { Motion } from './core/motion.js';
import { Hierarchy } from './core/hierarchy.js';

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
 * A pointer gesture starting and ending outside dismisses by default; inside presses and drags
 * from inside do not. `backdrop: false` is an explicit exception, not a form default. `guard(reason)`
 * must return true to permit dismissal; otherwise it preserves the sheet while the consumer explains
 * or confirms unsaved work. A confirmed discard or successful task calls `close(value)` directly.
 * Escape and the close button close it, except while
 * `busy` (the hosted task is working): then nothing closes it. `error(node)` shows a failure at its
 * top, such as "Beyond Projects didn't answer" with Try again, without closing it or losing what the
 * person did. It slides in with `--motion-standard` and, since 0.14.0 (D95), slides back out with
 * `--motion-exit` with its native backdrop, keeping the modal until its exit finishes; it appears
 * and goes at once under reduced motion.
 * `open()` resolves with the value given to `close(value)`; a dismissal gives null.
 */
export class SideSheet extends Component {
	/** The copy in English and Spanish. */
	static labels = Object.freeze({ en: Object.freeze({ close: 'Close' }), es: Object.freeze({ close: 'Cerrar' }) });
	static widths = widths;

	#element;
	#backdrop = null;
	#guard;
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
	#motion;
	#value = null;
	#hierarchy = null;

	/**
	 * @param {object} options
	 * @param {string|Node} options.title what the sheet is for ("Add repositories to Storefront")
	 * @param {string} [options.label] its accessible name, when it should differ from the title
	 * @param {string|Node} [options.description] one line under the title
	 * @param {Node[]} [options.children] the body
	 * @param {Node[]} [options.actions] the footer's actions, which stay in view
	 * @param {'form'|'standard'} [options.width]
	 * @param {boolean} [options.backdrop] Outside gestures dismiss (default true); false is an explicit exception
	 * @param {(reason: 'backdrop'|'escape'|'close') => boolean} [options.guard] Return true to dismiss; otherwise preserve the sheet and explain or confirm the unsaved work
	 * @param {Element} [options.restore] focus target after closing when nothing better is known
	 * @param {(value: unknown) => void} [options.onclose]
	 */
	constructor({ title, label = null, description = null, children = [], actions = [], width = 'form', backdrop = true, guard = null, restore = null, onclose = null, labels = {} }) {
		super();
		if (!widths.includes(width)) throw new TypeError(`A side sheet's width is one of ${widths.join(', ')}`);
		const text = new Labels(SideSheet.labels.en, labels);
		this.#restore = restore;
		this.#guard = guard;
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
			this.dismiss('escape');
		});
		this.#element.addEventListener('close', () => this.#closed());
		this.#hint = new Hint(this.#element);
		this.#motion = new Motion(this.#element, (work, delay) => this.later(work, delay));
		if (backdrop) this.#backdrop = new Backdrop(this.#element, () => this.dismiss('backdrop'));
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
		if (this.#element.open) {
			if (this.#motion.leaving) {
				this.#paint('entry');
				this.#motion.stop();
				this.#value = null;
				this.focus();
			}
			return this.#settle.promise;
		}
		const document = this.#element.ownerDocument;
		this.#opener = Interaction.origin(document);
		this.#given = restore;
		if (!this.#element.isConnected) {
			document.body.append(this.#element);
			this.#adopted = true;
		}
		this.#settle = SideSheet.#resolvers();
		this.#motion.stop();
		this.#element.style.removeProperty('--bui-sheet-from');
		this.#element.style.removeProperty('--bui-sheet-veil-from');
		this.#backdrop?.reset();
		this.#element.showModal();
		// Its headings outrank what they name, warned in a development build (0.19.0, D158)
		if (Hierarchy.enabled) this.#hierarchy ??= new Hierarchy({ root: this.#element });
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

	/** Requests a close unless busy or already leaving; the opening settles after the bounded exit. */
	close(value = null) {
		if (!this.#element.open || this.#busy || this.#motion.leaving) return false;
		this.#value = value;
		this.#paint('exit');
		this.#motion.leave(() => this.#end(value));
		return true;
	}

	/** Continue from the painted frame when a person reverses an entry or an exit. */
	#paint(direction) {
		const view = this.#element.ownerDocument.defaultView;
		const suffix = direction === 'entry' ? 'from' : 'exit-from';
		this.#element.style.setProperty(`--bui-sheet-${suffix}`, view.getComputedStyle(this.#element).transform || 'none');
		this.#element.style.setProperty(`--bui-sheet-veil-${suffix}`, view.getComputedStyle(this.#element, '::backdrop').opacity || '1');
	}

	#end(value) {
		this.#closing = true;
		this.#element.close();
		this.#finish(value);
	}

	/** Requests dismissal, honoring busy state and the consumer's synchronous preservation guard. */
	dismiss(reason = 'close') {
		if (this.#busy || this.#motion.leaving || !this.#element.open) return false;
		if (this.#guard && this.#guard(reason) !== true) return false;
		return this.close(null);
	}

	destroy() {
		this.#busy = false;
		this.#motion.stop();
		if (this.#element.open) this.#end(this.#value);
		this.#hint.destroy();
		this.#backdrop?.destroy();
		super.destroy();
	}

	#keys(event) {
		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			this.dismiss('escape');
		} else if (event.key === 'Tab') new Focus(this.#element).cycle(event);
	}


	// Closed by something other than this class, such as a form with `method="dialog"`.
	#closed() {
		if (this.#closing) {
			this.#closing = false;
			return;
		}
		if (!this.#settle || this.#element.open) return;
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
		this.#motion.stop();
		this.#value = null;
		this.#backdrop?.reset();
		this.#hierarchy?.destroy();
		this.#hierarchy = null;
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
