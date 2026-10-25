/**
 * What a press on a `ChoiceMenu`'s button does: a click, Enter or Space opens the list or closes it, and
 * ArrowDown or ArrowUp opens it.
 *
 * Since 0.35.0 (D183) a choice may wait for an earlier one, such as a branch until a repository is chosen.
 * While it waits the button is quiet (`aria-disabled`, the family's quiet look) and still reachable by Tab,
 * and a press only puts the person at `place()`, saying nothing: the list does not open. Without `place`
 * a press while it waits does nothing. Becoming waiting closes an open list, focus that was in it going
 * back to the quiet button. Native `disabled` stays the choice's that can never be made.
 */
export class ChoicePress {
	#button;
	#menu;
	#place;
	#waiting = false;

	/**
	 * @param {HTMLButtonElement} button the choice's button
	 * @param {object} options
	 * @param {{readonly expanded: boolean, open(): boolean, close(refocus?: boolean): void}} options.menu the choice whose list it opens
	 * @param {boolean} [options.waiting] whether the choice waits for an earlier one
	 * @param {(() => HTMLElement|null|undefined)|null} [options.place] where a press puts the person while it waits
	 */
	constructor(button, { menu, waiting = false, place = null }) {
		this.#button = button;
		this.#menu = menu;
		this.#place = place;
		this.waiting = waiting;
	}

	get waiting() {
		return this.#waiting;
	}

	/**
	 * Waits quiet for an earlier choice (true), or acts (false). Becoming waiting closes an open list; a person
	 * whose focus was in it is put back on the quiet button, never on the page's body.
	 */
	set waiting(value) {
		this.#waiting = Boolean(value);
		// Its own wait is marked, as a package Button's, so a Quiet over the button never frees it (0.35.0)
		this.#button.toggleAttribute('data-bui-waiting', this.#waiting);
		if (!this.#waiting) return void this.#button.removeAttribute('aria-disabled');
		this.#button.setAttribute('aria-disabled', 'true');
		const active = this.#button.ownerDocument.activeElement;
		this.#menu.close(active !== this.#button && Boolean(this.#button.parentElement?.contains(active)));
	}

	/** A click, or Enter or Space on the button: opens or closes the list, or, while it waits, only goes to `place`. */
	click() {
		if (this.#hold()) return;
		if (this.#menu.expanded) this.#menu.close(true);
		else this.#menu.open();
	}

	/** ArrowDown or ArrowUp on the button open the list, or, while it waits, only go to `place`. */
	key(event) {
		if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
		event.preventDefault();
		if (!this.#hold()) this.#menu.open();
	}

	/** Holds a press while the choice waits, putting the person at `place()` and saying nothing; true when it held it. */
	#hold() {
		if (!this.#waiting) return false;
		this.#place?.()?.focus();
		return true;
	}
}
