/** Responsive Sidebar ownership: one cut, a transient drawer and focus on the visible presentation. */
export class SidebarViewport {
	#scope;
	#cut;
	#query;
	#view;
	#change = () => this.#mode();

	constructor(scope, cut) {
		this.#scope = scope;
		this.#cut = Number.isFinite(cut) && cut > 0 ? cut : 1024;
		this.#view = scope.element.ownerDocument.defaultView;
		this.#query = this.#view.matchMedia?.(`(min-width: ${this.#cut}px)`) ?? null;
		this.#mode();
		this.#query?.addEventListener?.('change', this.#change);
		this.#view.addEventListener('resize', this.#change);
	}

	destroy() {
		this.#query?.removeEventListener?.('change', this.#change);
		this.#view.removeEventListener('resize', this.#change);
	}

	#mode() {
		const { element, panel, row, button, drawer, rail, merge, layout } = this.#scope;
		const wide = this.#query ? this.#query.matches : this.#view.innerWidth >= this.#cut;
		const mode = wide ? 'permanent' : 'drawer';
		if (element.dataset.mode === mode) return;
		const active = element.ownerDocument.activeElement;
		const focused = panel.contains(active) || rail.element.contains(active);
		const inside = drawer.element.contains(active);
		element.dataset.mode = mode;
		merge.mode(mode);
		layout();
		row.hidden = wide;
		if (!wide) {
			if (focused) (merge.trigger ?? button).focus({ preventScroll: true });
			return;
		}
		if (!drawer.shown) return;
		drawer.close({ refocus: false });
		const target = rail.enabled && !(rail.navigation.enabled && !rail.options && !rail.navigation.collapsed) ? rail.element : panel;
		if (inside) (target.querySelector('[aria-current="page"]') ?? target.querySelector('a[href], button'))?.focus({ preventScroll: true });
	}
}
