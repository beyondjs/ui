import { el } from '../core/element.js';
import { DiffRows } from './rows.js';

/**
 * One file's lines in their own box: long lines scroll sideways inside it (never the page), it is
 * reachable by the keyboard (`tabindex="0"`) and named "Lines of {path}". Its rows are drawn at once, or
 * in chunks of `chunk` rows per animation frame for a large file so the page never stops answering
 * (`aria-busy` while it draws); `destroy()` cancels the next frame.
 */
export class DiffLines {
	#element;
	#rows = el('div', { class: 'bui-diff-rows' });
	#builder;
	#plan;
	#frame = null;
	#view;
	#done = false;

	/**
	 * @param {DiffRows} builder
	 * @param {object[]} plan the rows as `DiffRows.plan` gives them
	 * @param {string} label the box's accessible name
	 */
	constructor(builder, plan, label) {
		this.#builder = builder;
		this.#plan = plan;
		this.#element = el('div', { class: 'bui-diff-lines', role: 'group', tabindex: '0', 'aria-label': label }, [this.#rows]);
		this.#element.style.setProperty('--bui-diff-digits', String(DiffRows.digits(plan)));
	}

	get element() {
		return this.#element;
	}

	/** Whether every row is drawn. */
	get done() {
		return this.#done;
	}

	/** Draws every row now. */
	draw() {
		this.#rows.append(...this.#plan.map(row => this.#node(row)));
		this.#done = true;
		return this;
	}

	/**
	 * Draws `chunk` rows per animation frame (a timer stands in where there are no frames), the first
	 * chunk at once. Resolves when every row is drawn, or never after `destroy()`.
	 */
	stream(chunk) {
		this.#view = this.#element.ownerDocument.defaultView ?? globalThis;
		this.#element.setAttribute('aria-busy', 'true');
		const size = Math.max(1, Math.floor(chunk));
		let at = 0;
		return new Promise(resolve => {
			const step = () => {
				this.#frame = null;
				const part = this.#plan.slice(at, at + size);
				at += part.length;
				this.#rows.append(...part.map(row => this.#node(row)));
				if (at < this.#plan.length) this.#frame = this.#schedule(step);
				else {
					this.#done = true;
					this.#element.removeAttribute('aria-busy');
					resolve(this);
				}
			};
			step();
		});
	}

	/** Cancels a drawing in progress. */
	destroy() {
		if (this.#frame) this.#frame.cancel();
		this.#frame = null;
	}

	#schedule(step) {
		const view = this.#view;
		if (typeof view.requestAnimationFrame === 'function') {
			const id = view.requestAnimationFrame(step);
			return { cancel: () => view.cancelAnimationFrame(id) };
		}
		const id = setTimeout(step, 16);
		return { cancel: () => clearTimeout(id) };
	}

	#node(row) {
		return this.#builder.node(row, (folded, node) => this.#reveal(folded, node));
	}

	/** Puts a folded run's lines in place of its button and keeps focus in the box. */
	#reveal(folded, node) {
		const moved = node.contains(this.#element.ownerDocument.activeElement);
		node.replaceWith(...folded.rows.map(row => this.#node(row)));
		if (moved) this.#element.focus();
	}
}
