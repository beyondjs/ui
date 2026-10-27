import { Paint } from './paint.js';

/**
 * Focus says what the keys do there (0.44.0, D187), checked while a product is developed. Each time an element
 * takes the focus (`focusin` on `root`), once its transitions have settled, it is named in a console warning,
 * once per element, when it draws against D187:
 * - a place reading starts (focused with `tabindex="-1"` and no interactive role) that draws an outline or a ring
 *   of shadow: it draws nothing;
 * - a box that takes typing (an `input` that takes text, a `textarea`, a `select`, or a `.bui-edge` box) that draws
 *   an outline, or whose border or shadow, or its `.bui-edge` box's, is in `--color-focus`, or in `--color-danger`
 *   while its value is not marked wrong (`aria-invalid="true"`, `data-invalid`, `.bui-field-invalid`): it lights
 *   its edge.
 * A forced-colors theme, where every form is a system outline, is not checked. It never changes the page.
 *
 * `Focus.enabled` is true in a development build (a bundler that defines `process.env.NODE_ENV` as
 * `development`), false otherwise; a `Page` starts one over its document by itself while it is true, and a product
 * may set it or start one over its own root.
 */
export class Focus {
	/**
	 * What the keys act on: a focused element matching it is not a place reading starts (focus.css's list, with a
	 * diff's hunk, the cursor its keys move through).
	 */
	static controls = 'a[href], area[href], button, input, select, textarea, summary, iframe, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="link"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="option"], [role="tab"], [role="treeitem"], [role="gridcell"], [role="row"], [role="checkbox"], [role="radio"], [role="switch"], [role="slider"], [role="spinbutton"], [role="combobox"], [role="textbox"], [role="searchbox"], [role="listbox"], [role="tree"], [role="treegrid"], [role="grid"], [role="menu"], [role="menubar"], [role="tablist"], [role="radiogroup"], [role="separator"], [role="application"], .bui-command, .bui-edge, .bui-diff-hunk';
	/** The boxes that take typing: a field and a box that lights its edge. */
	static fields = 'input:not([type="checkbox"], [type="radio"], [type="range"], [type="color"], [type="file"], [type="button"], [type="submit"], [type="reset"], [type="image"], [type="hidden"]), textarea, select, .bui-edge';
	/** A value marked wrong keeps the danger's edge. */
	static #wrong = '[aria-invalid="true"], [data-invalid], .bui-field-invalid *';
	/** Whether pages check themselves: in a development build. */
	static enabled = Focus.#development();
	/** An element is warned about once, whichever check found it. */
	static #warned = new WeakSet();
	/** The longest a check waits for the element's transitions to settle. */
	static #settle = 1000;

	#root;
	#warn;
	#measure;
	#listener = event => this.#heard(event);

	/**
	 * @param {object} options
	 * @param {Document|Element} options.root where focus is followed
	 * @param {(message: string, node: Element) => void} [options.warn] how an element is reported (`console.warn`)
	 * @param {(node: Element) => import('./paint.js').FocusPaint} [options.measure] how an element's paint is read
	 *   (its computed style by default)
	 */
	constructor({ root, warn = null, measure = null }) {
		this.#root = root;
		this.#warn = warn ?? ((message, node) => console.warn(message, node));
		this.#measure = measure ?? (node => Paint.read(node));
		root.addEventListener('focusin', this.#listener);
	}

	static #development() {
		try {
			return process.env.NODE_ENV === 'development';
		} catch {
			return false;
		}
	}

	/**
	 * What `node` draws against D187 now, reported once: `{ node, reason: 'reading' | 'field', drawn }`, where `drawn`
	 * names what it draws (`outline`, `ring`, `focus`, `danger`), or null when it draws as D187 asks.
	 */
	check(node) {
		const reason = Focus.#kind(node);
		if (!reason || Focus.#forced(node)) return null;
		const drawn = reason === 'reading' ? this.#reading(node) : this.#field(node);
		if (!drawn.length) return null;
		if (!Focus.#warned.has(node)) {
			Focus.#warned.add(node);
			this.#warn(Focus.#message(node, reason, drawn), node);
		}
		return { node, reason, drawn };
	}

	destroy() {
		this.#root.removeEventListener('focusin', this.#listener);
	}

	static #kind(node) {
		if (node?.nodeType !== 1) return null;
		if (node.matches(Focus.fields)) return 'field';
		if (node.getAttribute('tabindex') === '-1' && !node.matches(Focus.controls)) return 'reading';
		return null;
	}

	static #forced(node) {
		try {
			return Boolean(node.ownerDocument.defaultView?.matchMedia?.('(forced-colors: active)').matches);
		} catch {
			return false;
		}
	}

	/** A place reading starts draws nothing: no outline, no ring of shadow. */
	#reading(node) {
		const paint = this.#measure(node);
		return [Paint.outlined(paint) && 'outline', Paint.ringed(paint) && 'ring'].filter(Boolean);
	}

	/** A box that takes typing lights its edge: no outline, and neither the ring's coral nor, unless wrong, the danger. */
	#field(node) {
		const box = node.matches('.bui-edge') ? null : node.closest('.bui-edge');
		const wrong = node.matches(Focus.#wrong) || Boolean(box?.matches(Focus.#wrong));
		const drawn = new Set();
		for (const part of [node, box].filter(Boolean)) {
			const paint = this.#measure(part);
			if (Paint.outlined(paint)) drawn.add('outline');
			if (Paint.tinted(paint, paint.focus)) drawn.add('focus');
			if (!wrong && Paint.tinted(paint, paint.danger)) drawn.add('danger');
		}
		return [...drawn];
	}

	#heard(event) {
		const node = event.target;
		if (!Focus.#kind(node) || Focus.#warned.has(node)) return;
		this.#settled(node).then(() => {
			if (node.ownerDocument.activeElement === node) this.check(node);
		});
	}

	/** Once the element's transitions and animations, and its box's, have ended, at most `#settle` later. */
	#settled(node) {
		const view = node.ownerDocument.defaultView;
		const moving = [node, node.closest('.bui-edge')].filter(Boolean).flatMap(part => part.getAnimations?.() ?? []);
		const ended = Promise.all(moving.map(animation => animation.finished.catch(() => undefined)));
		const limit = new Promise(resolve => (view ? view.setTimeout(resolve, Focus.#settle) : setTimeout(resolve, Focus.#settle)));
		return Promise.race([ended, limit]);
	}

	static #message(node, reason, drawn) {
		const name = Focus.#name(node);
		if (reason === 'reading') {
			const what = drawn.length > 1 ? 'an outline and a ring' : drawn[0] === 'outline' ? 'an outline' : 'a ring';
			return `@beyond-js/ui: ${name}, focused for reading, draws ${what}; D187: a place reading starts draws nothing.`;
		}
		const what = drawn.map(each => ({ outline: 'an outline', focus: "the ring's coral (--color-focus)", danger: 'the danger (--color-danger) with no wrong value marked' })[each]);
		return `@beyond-js/ui: ${name} draws ${what.join(' and ')} when focused; D187: a box that takes typing lights its edge.`;
	}

	/** How an element is named in a warning: its tag with its accessible label, its words or its id. */
	static #name(node) {
		const tag = node.localName;
		const labelled = node.getAttribute('aria-labelledby')?.split(/\s+/).map(id => node.ownerDocument.getElementById(id)?.textContent ?? '').join(' ');
		const label = node.getAttribute('aria-label') || labelled || (node.labels?.[0]?.textContent ?? '') || (node.matches('input, textarea, select') ? '' : node.textContent);
		const words = label.replace(/\s+/g, ' ').trim().slice(0, 60);
		if (words) return `the ${tag} "${words}"`;
		return node.id ? `the ${tag} #${node.id}` : `a ${tag}`;
	}
}
