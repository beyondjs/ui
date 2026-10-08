import { el } from '../core/element.js';

/**
 * A product's work surface that takes dropped files for a composer (0.11.2, the family proposal "a drop
 * target covers the work surface"): files dragged anywhere over `element` (a conversation's thread and
 * its dock) show one target over the surface's visible part, "Drop files to attach", and a drop there
 * hands them to the composer as a drop on it would. A near miss never leaves the page: the browser does
 * not open a file dropped on the surface. Dragged text is left alone (a drop of text into a field still
 * works). The target hides when the drag leaves, ends or stops moving (no `dragover` for half a second,
 * as when the drag left the window), so it never stays drawn.
 */
export class ComposerZone {
	static #quiet = 500;

	#element = null;
	#target;
	#give;
	#depth = 0;
	#timer = 0;
	#handlers = {
		dragenter: event => this.#enter(event),
		dragover: event => this.#over(event),
		dragleave: event => this.#leave(event),
		drop: event => this.#drop(event)
	};

	/**
	 * @param {object} options
	 * @param {string} options.words what the target says ("Drop files to attach")
	 * @param {(files: File[]) => void} options.give hands dropped files to the composer
	 */
	constructor({ words, give }) {
		this.#give = give;
		this.#target = el('div', { class: 'bui-composer-zone', 'aria-hidden': 'true', hidden: true }, [el('span', { text: words })]);
	}

	/** The surface, or null. */
	get element() {
		return this.#element;
	}

	/** Whether files are dragged over the surface now. */
	get dragging() {
		return !this.#target.hidden;
	}

	/** Takes drops on `element` (null for none), leaving any earlier surface. */
	set element(element) {
		if (element === this.#element) return;
		this.#release();
		this.#element = element ?? null;
		for (const [type, handler] of Object.entries(this.#handlers)) this.#element?.addEventListener(type, handler);
	}

	destroy() {
		this.#release();
		this.#target.remove();
	}

	#release() {
		for (const [type, handler] of Object.entries(this.#handlers)) this.#element?.removeEventListener(type, handler);
		this.#hide();
	}

	static #files(event) {
		return [...(event.dataTransfer?.types ?? [])].includes('Files');
	}

	#enter(event) {
		if (!ComposerZone.#files(event)) return;
		event.preventDefault();
		this.#depth += 1;
		this.#show();
	}

	#over(event) {
		if (!ComposerZone.#files(event)) return;
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
		this.#show();
	}

	#leave(event) {
		if (!ComposerZone.#files(event)) return;
		this.#depth = Math.max(0, this.#depth - 1);
		if (!this.#depth) this.#hide();
	}

	#drop(event) {
		const files = [...(event.dataTransfer?.files ?? [])];
		if (!ComposerZone.#files(event) && !files.length) return;
		const taken = event.defaultPrevented;
		event.preventDefault();
		this.#hide();
		// A drop on the composer inside the surface was already handed over by the composer itself
		if (!taken && files.length) this.#give(files);
	}

	/** Draws the target over the surface's part inside the viewport, and keeps it while the drag moves. */
	#show() {
		const view = this.#element?.ownerDocument.defaultView;
		if (!view) return;
		if (this.#target.parentNode !== view.document.body) view.document.body.append(this.#target);
		const box = this.#element.getBoundingClientRect();
		const top = Math.max(0, box.top);
		const left = Math.max(0, box.left);
		const bottom = Math.min(view.innerHeight, box.bottom);
		const right = Math.min(view.innerWidth, box.right);
		Object.assign(this.#target.style, { top: `${top}px`, left: `${left}px`, width: `${Math.max(0, right - left)}px`, height: `${Math.max(0, bottom - top)}px` });
		this.#target.hidden = false;
		view.clearTimeout(this.#timer);
		this.#timer = view.setTimeout(() => this.#hide(), ComposerZone.#quiet);
	}

	#hide() {
		this.#depth = 0;
		this.#target.hidden = true;
		this.#element?.ownerDocument.defaultView?.clearTimeout(this.#timer);
		this.#timer = 0;
	}
}
