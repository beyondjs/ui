/**
 * One bar on a phone (0.16.0, the audit's DQ-19): below the sidebar's cut the family bar's menu button
 * opens the sidebar's drawer and the sidebar's own product row goes, so the page starts 44 px from the
 * top instead of 88. `sidebar.merge(bar)` gives the bar its toggle (or a product passes `sidebar.toggle`
 * as FamilyBar's option): the bar's button is shown only while the sidebar is a drawer, says whether the
 * drawer is open, and gets focus back when it closes.
 */
export class SidebarMerge {
	#bar = null;

	/** The bar's `toggle` option for a drawer of that id; `run(open)` opens or closes it. */
	toggle(controls, run) {
		return { controls, expanded: false, onchange: expanded => run(Boolean(expanded)) };
	}

	/** Merges with the bar, giving it `toggle`: both carry `data-merged`, which the stylesheet reads. */
	attach(bar, root, toggle) {
		this.#bar = bar ?? null;
		root.toggleAttribute('data-merged', Boolean(this.#bar));
		if (!this.#bar) return;
		this.#bar.element.setAttribute('data-merged', '');
		this.#bar.toggle = toggle;
	}

	/** Whether the sidebar is merged with a bar. */
	get merged() {
		return Boolean(this.#bar);
	}

	/** The bar's menu button, which opens the drawer and gets focus back; null when not merged. */
	get trigger() {
		return this.#bar?.element.querySelector('.bui-header-toggle') ?? null;
	}

	/** The sidebar's mode: the bar shows its button only while the sidebar is a drawer. */
	mode(mode) {
		this.#bar?.element.toggleAttribute('data-drawer', mode === 'drawer');
	}

	/** The drawer closed by itself (Escape, a choice): the bar's button says so. */
	closed() {
		if (this.#bar?.expanded) this.#bar.expanded = false;
	}
}
