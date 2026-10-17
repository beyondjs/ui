/**
 * One primary action per region (0.16.0, the audit's DQ-09), checked while a product is developed: a
 * page header, a section, a dialog, a side sheet, a composer, an approval card, an empty state or any
 * element marked `data-bui-region` should hold at most one shown `.bui-button-primary` of its own (a
 * nested region counts its own). Two or more read as no hierarchy at all, so a console warning names the
 * region, once per region. It watches `root` for changes, once per frame, and never changes the page.
 *
 * `Primaries.enabled` is true in a development build (a bundler that defines `process.env.NODE_ENV` as
 * `development`), false otherwise; a `Page` starts one by itself while it is true, and a product may set
 * it or start one over its own root.
 */
export class Primaries {
	/** The regions that each take one primary action. */
	static regions = '.bui-page-header, .bui-section, .bui-dialog, .bui-sheet, .bui-composer, .bui-command, .bui-empty, [data-bui-region]';
	/** Whether pages check themselves: in a development build. */
	static enabled = Primaries.#development();

	#root;
	#warn;
	#warned = new WeakSet();
	#observer = null;
	#frame = 0;

	/**
	 * @param {object} options
	 * @param {Element} options.root what is checked, with what is added to it later
	 * @param {(message: string, region: Element) => void} [options.warn] how a region is reported (`console.warn`)
	 */
	constructor({ root, warn = null }) {
		this.#root = root;
		this.#warn = warn ?? ((message, region) => console.warn(message, region));
		const view = root.ownerDocument?.defaultView;
		if (typeof view?.MutationObserver === 'function') {
			this.#observer = new view.MutationObserver(() => this.#soon(view));
			this.#observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });
		}
		this.check();
	}

	static #development() {
		try {
			return process.env.NODE_ENV === 'development';
		} catch {
			return false;
		}
	}

	/** The regions holding more than one shown primary action, each reported once: `[{ region, count }]`. */
	check() {
		const found = [];
		const regions = [...(this.#root.matches?.(Primaries.regions) ? [this.#root] : []), ...this.#root.querySelectorAll(Primaries.regions)];
		for (const region of regions) {
			const count = [...region.querySelectorAll('.bui-button-primary')].filter(button => button.closest(Primaries.regions) === region && !button.closest('[hidden]')).length;
			if (count < 2) continue;
			found.push({ region, count });
			if (this.#warned.has(region)) continue;
			this.#warned.add(region);
			this.#warn(`@beyond-js/ui: ${count} primary actions in one region (${region.className || region.localName}); a region takes at most one (DQ-09).`, region);
		}
		return found;
	}

	destroy() {
		this.#observer?.disconnect();
		this.#observer = null;
		if (this.#frame) this.#root.ownerDocument?.defaultView?.cancelAnimationFrame?.(this.#frame);
	}

	#soon(view) {
		if (this.#frame) return;
		const frame = view.requestAnimationFrame ?? (work => view.setTimeout(work, 16));
		this.#frame = frame(() => {
			this.#frame = 0;
			if (this.#observer) this.check();
		});
	}
}
