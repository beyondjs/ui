import { Component } from './component.js';
import { el } from './element.js';

/**
 * The visible name of a component's icon-only controls (decision D11): a glyph on the closed list
 * stands alone only with an accessible name and a tooltip that shows it.
 *
 * One hint serves every control inside `root` that carries `data-bui-hint`; its text is the control's
 * `aria-label` read when it shows, plus ` · {data-bui-shortcut}` when the control names a shortcut. The
 * accessible name already says it, so the hint is hidden from assistive technology and describes
 * nothing: a screen reader hears the name once. It shows on hover after a short delay, at once on
 * keyboard focus, and on a touch press for a moment; a click, leaving, blur and Escape hide it.
 * It listens on `root` only (and on the document for Escape while it shows), and lives in the dialog
 * that holds `root` or else in the body, so it is drawn above a modal dialog.
 */
export class Hint extends Component {
	#root;
	#element = el('span', { class: 'bui-tooltip bui-hint', 'aria-hidden': 'true', hidden: true });
	#target = null;
	#cancel = null;
	#escape = null;

	/** @param {Element} root the component's element */
	constructor(root) {
		super();
		this.#root = root;
		root.setAttribute('data-bui-hints', '');
		// A control belongs to the nearest hint root, so nested components never show two hints.
		const find = event => {
			const target = event.target.closest?.('[data-bui-hint]');
			return target?.closest('[data-bui-hints]') === root ? target : null;
		};
		root.addEventListener('pointerover', event => {
			const target = find(event);
			if (!target || event.pointerType === 'touch' || target === this.#target) return;
			this.#soon(target);
		});
		root.addEventListener('pointerout', event => {
			const target = find(event);
			if (target && !target.contains(event.relatedTarget)) this.hide();
		});
		root.addEventListener('focusin', event => {
			const target = find(event);
			if (target && Hint.#visible(target)) this.show(target);
		});
		root.addEventListener('focusout', event => find(event) && this.hide());
		// The control's own handler has run: a press hides the hint, and so does a control it removed.
		root.addEventListener('click', event => {
			const target = event.target.closest?.('[data-bui-hint]');
			if (target && (event.pointerType !== 'touch' || !target.isConnected)) this.hide();
		});
		root.addEventListener('keydown', event => find(event) && event.key !== 'Tab' && event.key !== 'Escape' && this.hide());
		root.addEventListener('pointerdown', event => {
			const target = find(event);
			if (!target || event.pointerType !== 'touch') return;
			this.show(target);
			this.#cancel = this.later(() => this.hide(), 1500);
		});
	}

	/** The hint element, placed in the page when it first shows. */
	get element() {
		return this.#element;
	}

	get shown() {
		return !this.#element.hidden;
	}

	/** Shows the name of `target`, a control inside the root. */
	show(target) {
		this.#cancel?.();
		const name = target.getAttribute('aria-label');
		// An open menu or panel already says what the control does; the hint would cover it.
		if (!name || !target.isConnected || target.getAttribute('aria-expanded') === 'true') return this.hide();
		const shortcut = target.getAttribute('data-bui-shortcut');
		const host = this.#root.closest('dialog') ?? target.ownerDocument.body;
		if (this.#element.parentNode !== host) host.append(this.#element);
		this.#element.textContent = shortcut ? `${name} · ${shortcut}` : name;
		this.#element.hidden = false;
		this.#target = target;
		this.#place(target);
		this.#escape ??= this.listen(target.ownerDocument, 'keydown', event => event.key === 'Escape' && this.hide());
	}

	hide() {
		this.#cancel?.();
		this.#cancel = null;
		this.#target = null;
		this.#element.hidden = true;
		this.#escape?.();
		this.#escape = null;
	}

	/** Hides the hint when its control is inside `node`, which the component is about to remove. */
	release(node) {
		if (this.#target && node.contains(this.#target)) this.hide();
	}

	destroy() {
		this.hide();
		super.destroy();
	}

	#soon(target) {
		this.#cancel?.();
		this.#cancel = this.later(() => this.show(target), 300);
	}

	#place(target) {
		const view = target.ownerDocument.defaultView;
		const box = target.getBoundingClientRect();
		const own = this.#element.getBoundingClientRect();
		const margin = 8;
		const left = Math.min(Math.max(margin, box.left + box.width / 2 - own.width / 2), view.innerWidth - own.width - margin);
		const below = box.bottom + margin + own.height <= view.innerHeight;
		this.#element.style.left = `${Math.max(margin, left)}px`;
		this.#element.style.top = `${below ? box.bottom + margin : box.top - own.height - margin}px`;
	}

	/** Keyboard focus shows the hint; focus a page moves by code after a press does not. */
	static #visible(target) {
		try {
			return target.matches(':focus-visible');
		} catch {
			return true;
		}
	}
}
