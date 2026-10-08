import { el } from '../core/element.js';

const levels = Object.freeze(['full', 'short', 'fold']);

/**
 * Keeps a composer's toolbar on one row whenever it can (0.11.2, the family proposal "a composer keeps
 * one toolbar row"), by measured fit, never by a fixed width. It tries, in order, until everything
 * shares one row:
 *
 * 1. `full`: as written (each chip's label, value and state);
 * 2. `short`: the settings' chips say their value only — the label and a calm state go to the chip's
 *    accessible name and to the family tooltip, a state that asks for attention keeps its word, and a
 *    long value is cut with an ellipsis while the tooltip and the open menu say it whole (D44);
 * 3. `fold`: the settings and Attach fold behind Options (`ComposerFold`), as a narrow composer did in
 *    0.11.1. Only when there is something to fold.
 *
 * The actions keep their words at every level. The level is the root's `data-fit` (absent for `full`).
 * It is measured when the composer's width changes (a zero-height gauge across the composer, so a
 * change of level never resizes what is observed), when the toolbar's content changes and when fonts
 * finish loading. While Options is open or holds focus the level stays, so nothing focused is hidden.
 */
export class ComposerFit {
	static levels = levels;

	#root;
	#bar;
	#fold;
	#enabled;
	#gauge = el('span', { class: 'bui-composer-gauge', 'aria-hidden': 'true' });
	#resize = null;
	#mutation = null;
	#fonts = null;
	#done = false;
	#frame = 0;
	#leave = event => event.target === this.#fold.button && queueMicrotask(() => this.measure());

	/**
	 * @param {object} options
	 * @param {HTMLElement} options.root the composer (`.bui-composer`), which carries `data-fit`
	 * @param {HTMLElement} options.bar the toolbar whose items must share one row
	 * @param {import('./fold.js').ComposerFold} options.fold the Options control, used at the last level
	 * @param {boolean} options.enabled whether the composer adapts at all (`compact`)
	 */
	constructor({ root, bar, fold, enabled }) {
		this.#root = root;
		this.#bar = bar;
		this.#fold = fold;
		this.#enabled = enabled;
		if (!enabled) return;
		root.append(this.#gauge);
		const view = root.ownerDocument.defaultView;
		if (view?.ResizeObserver) {
			let width = null;
			this.#resize = new view.ResizeObserver(entries => {
				const next = entries.at(-1)?.contentRect.width ?? null;
				if (next === width) return;
				width = next;
				// Decided in the next frame: a change of layout inside an observer's callback is a loop other
				// observers of the page (a panel's, WebKit's own) report
				this.#later();
			});
			this.#resize.observe(this.#gauge);
		}
		if (view?.MutationObserver) {
			this.#mutation = new view.MutationObserver(() => this.measure());
			this.#mutation.observe(bar, { childList: true, subtree: true, characterData: true });
		}
		// A trial is never made while Options holds focus: once focus leaves it, the fit is decided again
		root.addEventListener('focusout', this.#leave);
		const fonts = root.ownerDocument.fonts;
		if (fonts?.addEventListener) {
			this.#fonts = () => this.measure();
			fonts.addEventListener('loadingdone', this.#fonts);
		}
	}

	/** The level in use: `full`, `short` or `fold`. */
	get level() {
		return this.#root.dataset.fit ?? 'full';
	}

	/** Decides the level now (a product that moved or resized the composer itself may call it). */
	measure() {
		if (!this.#enabled || this.#done || !this.#root.isConnected) return;
		if (!this.#root.getClientRects().length || !this.#bar.getBoundingClientRect().width) return;
		// Options open or focused: its contents or itself would be hidden by a trial, so the level stays
		const focused = this.#root.ownerDocument.activeElement;
		if (this.#fold.open || (focused && focused === this.#fold.button)) return;
		for (const level of levels) {
			if (level === 'fold' && !this.#fold.available) break;
			this.#set(level);
			if (level === 'fold' || this.#fits()) return;
		}
	}

	destroy() {
		this.#done = true;
		if (this.#frame) this.#root.ownerDocument.defaultView?.cancelAnimationFrame?.(this.#frame);
		this.#root.removeEventListener('focusout', this.#leave);
		this.#resize?.disconnect();
		this.#mutation?.disconnect();
		if (this.#fonts) this.#root.ownerDocument.fonts?.removeEventListener?.('loadingdone', this.#fonts);
		this.#gauge.remove();
	}

	#later() {
		const view = this.#root.ownerDocument.defaultView;
		if (this.#frame || !view?.requestAnimationFrame) return void (this.#frame || this.measure());
		this.#frame = view.requestAnimationFrame(() => {
			this.#frame = 0;
			this.measure();
		});
	}

	#set(level) {
		if (level === 'full') delete this.#root.dataset.fit;
		else this.#root.dataset.fit = level;
	}

	/** Whether every shown item of the toolbar shares one horizontal band. */
	#fits() {
		const boxes = this.#items().map(node => node.getBoundingClientRect()).filter(box => box.width || box.height);
		if (boxes.length < 2) return true;
		const top = Math.max(...boxes.map(box => box.top));
		const bottom = Math.min(...boxes.map(box => box.bottom));
		return top < bottom - 1;
	}

	/** The toolbar's leaves: each control, chip, tool, reason and action, through `display: contents` holders. */
	#items() {
		const view = this.#root.ownerDocument.defaultView;
		const groups = new Set(['bui-composer-start', 'bui-composer-settings', 'bui-composer-tools', 'bui-composer-end', 'bui-composer-extras']);
		const found = [];
		const walk = node => {
			for (const child of node.children) {
				if (child.matches('input, .bui-hidden, [hidden]')) continue;
				// A group's own box says nothing: its leaves are measured, shown or not
				if ([...child.classList].some(name => groups.has(name)) || view.getComputedStyle(child).display === 'contents') walk(child);
				else if (child.getClientRects().length) found.push(child);
			}
		};
		walk(this.#bar);
		return found;
	}
}
