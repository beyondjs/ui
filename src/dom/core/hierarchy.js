/**
 * A heading outranks what it names (0.19.0, D158), checked while a product is developed: every shown
 * heading (`h1`–`h6`) is semibold, and no text in the region it names is larger than it, or as large and
 * heavier. The region is the element whose `aria-labelledby` names the heading, else its nearest
 * `main`, `section`, `article`, `aside`, dialog, region or `[data-bui-region]`. A heading that is a label
 * by design (it groups the items of a list or a menu, or names one item of a list, such as a diff's
 * file) is quieter than its rows and says so with `data-bui-label`: it is not checked. A console warning
 * names the heading and what outranks it, once per heading. It watches `root` for changes, at most once
 * a second, and never changes the page.
 *
 * `Hierarchy.enabled` is true in a development build (a bundler that defines `process.env.NODE_ENV` as
 * `development`), false otherwise; a `Page`, a `SideSheet` and a `Dialog` start one by themselves while
 * it is true, and a product may set it or start one over its own root.
 */
export class Hierarchy {
	/** The elements that name a region. */
	static headings = 'h1, h2, h3, h4, h5, h6, [role="heading"]';
	/** The regions a heading names when no `aria-labelledby` points at it. */
	static regions = 'main, section, article, aside, dialog, [role="dialog"], [role="region"], [data-bui-region]';
	/** The weight every heading takes (`--weight-semibold`). */
	static weight = 600;
	/** Whether pages, sheets and dialogs check themselves: in a development build. */
	static enabled = Hierarchy.#development();
	/** The most text elements read in one region before it is passed as checked. */
	static #most = 600;
	/** A heading is warned about once, whichever check found it. */
	static #warned = new WeakSet();

	#root;
	#warn;
	#measure;
	#observer = null;
	#timer = 0;
	#wait;

	/**
	 * @param {object} options
	 * @param {Element} options.root what is checked, with what is added to it later
	 * @param {(message: string, heading: Element) => void} [options.warn] how a heading is reported (`console.warn`)
	 * @param {(node: Element) => { size: number, weight: number, shown: boolean }} [options.measure] how an
	 *   element's text is read (its computed style and boxes by default)
	 * @param {number} [options.wait] milliseconds between a change and the next check
	 */
	constructor({ root, warn = null, measure = null, wait = 1000 }) {
		this.#root = root;
		this.#warn = warn ?? ((message, heading) => console.warn(message, heading));
		this.#measure = measure ?? (node => Hierarchy.#paint(node));
		this.#wait = wait;
		const view = root.ownerDocument?.defaultView;
		if (typeof view?.MutationObserver === 'function') {
			this.#observer = new view.MutationObserver(() => this.#soon(view));
			this.#observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class', 'hidden', 'open', 'style'] });
		}
		if (view) this.#soon(view);
	}

	static #development() {
		try {
			return process.env.NODE_ENV === 'development';
		} catch {
			return false;
		}
	}

	static #paint(node) {
		const view = node.ownerDocument.defaultView;
		const paint = view.getComputedStyle(node);
		const box = node.getBoundingClientRect();
		return { size: parseFloat(paint.fontSize) || 0, weight: Number(paint.fontWeight) || 400, shown: paint.visibility !== 'hidden' && node.getClientRects().length > 0 && !(box.width <= 1 && box.height <= 1) };
	}

	/** The headings that fail, each reported once: `[{ heading, reason: 'weight' | 'outranked', by }]`. */
	check() {
		const found = [];
		const headings = [...(this.#root.matches?.(Hierarchy.headings) ? [this.#root] : []), ...this.#root.querySelectorAll(Hierarchy.headings)];
		for (const heading of headings) {
			if (heading.hasAttribute('data-bui-label') || heading.closest('[hidden]')) continue;
			const face = Hierarchy.#face(heading);
			if (!face) continue;
			const own = this.#measure(face);
			if (!own.shown) continue;
			const by = own.weight < Hierarchy.weight ? null : this.#outranking(heading, own);
			if (own.weight >= Hierarchy.weight && !by) continue;
			const reason = by ? 'outranked' : 'weight';
			found.push({ heading, reason, by });
			if (Hierarchy.#warned.has(heading)) continue;
			Hierarchy.#warned.add(heading);
			this.#warn(this.#message(heading, own, reason, by), heading);
		}
		return found;
	}

	destroy() {
		this.#observer?.disconnect();
		this.#observer = null;
		if (this.#timer) this.#root.ownerDocument?.defaultView?.clearTimeout(this.#timer);
		this.#timer = 0;
	}

	/** The region a heading names: the element labelled by it, else its nearest region. */
	#region(heading) {
		const id = heading.id;
		for (let node = heading.parentElement; id && node; node = node.parentElement) if (node.getAttribute('aria-labelledby')?.split(/\s+/).includes(id)) return node;
		return heading.parentElement?.closest(Hierarchy.regions) ?? null;
	}

	/** The first shown text in the heading's region that is larger than it, or as large and heavier */
	#outranking(heading, own) {
		const region = this.#region(heading);
		if (!region) return null;
		const walker = region.ownerDocument.createTreeWalker(region, 1);
		let read = 0;
		for (let node = walker.nextNode(); node && read < Hierarchy.#most; node = walker.nextNode()) {
			if (heading.contains(node) || !(heading.compareDocumentPosition(node) & 4)) continue;
			// A subgroup ends at its next peer or ancestor heading; its parent title precedes it.
			if (node.matches(Hierarchy.headings) && Hierarchy.#level(node) <= Hierarchy.#level(heading)) break;
			if (!Hierarchy.#text(node)) continue;
			read += 1;
			const paint = this.#measure(node);
			if (!paint.shown) continue;
			if (paint.size > own.size + 0.5 || (Math.abs(paint.size - own.size) <= 0.5 && paint.weight > own.weight)) return { node, text: Hierarchy.#text(node), size: paint.size, weight: paint.weight };
		}
		return null;
	}

	/** The semantic level of native and ARIA headings. */
	static #level(node) {
		return Number(node.getAttribute('aria-level') ?? node.tagName.slice(1)) || 2;
	}

	/** What draws a heading's words: the heading, or the first element inside it that holds text itself */
	static #face(heading) {
		if (Hierarchy.#text(heading)) return heading;
		const walker = heading.ownerDocument.createTreeWalker(heading, 1);
		for (let node = walker.nextNode(); node; node = walker.nextNode()) if (Hierarchy.#text(node)) return node;
		return null;
	}

	/** The text an element holds itself, not its children's */
	static #text(node) {
		let text = '';
		for (const child of node.childNodes) if (child.nodeType === 3) text += child.textContent;
		return text.trim();
	}

	#message(heading, own, reason, by) {
		const name = Hierarchy.#cut(heading.textContent);
		const size = value => `${Math.round(value * 10) / 10} px`;
		if (reason === 'weight') return `@beyond-js/ui: the heading "${name}" is ${own.weight}; a heading is semibold (${Hierarchy.weight}) so it reads above its text (D127, D158).`;
		return `@beyond-js/ui: the heading "${name}" (${size(own.size)}, ${own.weight}) is outranked in the region it names by "${Hierarchy.#cut(by.text)}" (${size(by.size)}, ${by.weight}); a heading outranks what it names, and a heading that groups a list's items says so with data-bui-label (D158).`;
	}

	static #cut(text) {
		const flat = String(text).replace(/\s+/g, ' ').trim();
		return flat.length > 48 ? `${flat.slice(0, 47)}…` : flat;
	}

	#soon(view) {
		if (this.#timer) return;
		this.#timer = view.setTimeout(() => {
			this.#timer = 0;
			if (this.#observer) this.check();
		}, this.#wait);
	}
}
