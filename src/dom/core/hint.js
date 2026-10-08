import { Component } from './component.js';
import { el } from './element.js';
import { Interaction } from './interaction.js';

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
 *
 * Public since 0.11.1 for a product's own glyph-only controls: `new Hint(root)` over the element that
 * holds them, each with `data-bui-hint` and an `aria-label` (and `data-bui-shortcut` to add a key);
 * `destroy()` releases every listener and leaves `root` as it was. One hint per root.
 *
 * Since 0.11.2 a control whose visible words are shortened (a composer's chip that shows only its
 * value) carries its whole text in `data-bui-tip`; the hint shows that text instead of the name, and
 * only while `when(target)` answers true (the words are shortened now).
 */
export class Hint extends Component {
	#root;
	#element = el('span', { class: 'bui-tooltip bui-hint', 'aria-hidden': 'true', hidden: true });
	#target = null;
	#cancel = null;
	#escape = null;
	#when;

	/**
	 * @param {Element} root the component's element
	 * @param {{when?: ((target: Element) => boolean)|null}} [options] when a `data-bui-tip` text shows (0.11.2)
	 */
	constructor(root, { when = null } = {}) {
		super();
		this.#root = root;
		this.#when = when;
		root.setAttribute('data-bui-hints', '');
		// A control belongs to the nearest hint root, so nested components never show two hints.
		const find = event => {
			const target = event.target.closest?.('[data-bui-hint], [data-bui-tip]');
			return target?.closest('[data-bui-hints]') === root ? target : null;
		};
		this.listen(root, 'pointerover', event => {
			const target = find(event);
			if (!target || event.pointerType === 'touch' || target === this.#target) return;
			this.#soon(target);
		});
		this.listen(root, 'pointerout', event => {
			const target = find(event);
			if (target && !target.contains(event.relatedTarget)) this.hide();
		});
		this.listen(root, 'focusin', event => {
			const target = find(event);
			if (target && Hint.#visible(target)) this.show(target);
		});
		this.listen(root, 'focusout', event => find(event) && this.hide());
		// The control's own handler has run: a press hides the hint, and so does a control it removed.
		this.listen(root, 'click', event => {
			const target = event.target.closest?.('[data-bui-hint], [data-bui-tip]');
			if (target && (event.pointerType !== 'touch' || !target.isConnected)) this.hide();
		});
		this.listen(root, 'keydown', event => find(event) && event.key !== 'Tab' && event.key !== 'Escape' && this.hide());
		this.listen(root, 'pointerdown', event => {
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
		const tip = target.getAttribute('data-bui-tip');
		const name = tip ? ((this.#when?.(target) ?? false) ? tip : null) : target.getAttribute('aria-label');
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
		if (!this.destroyed) this.#root.removeAttribute('data-bui-hints');
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

	/**
	 * Keyboard focus shows the hint; focus a page moves by code after a press does not. WebKit does not
	 * match `:focus-visible` when a focus trap moves focus on Tab, so the last key counts too.
	 */
	static #visible(target) {
		if (Interaction.of(target.ownerDocument)?.keyboard) return true;
		try {
			return target.matches(':focus-visible');
		} catch {
			return true;
		}
	}
}
