import { el } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Ids } from '../core/ids.js';
import { Hint } from '../core/hint.js';

/**
 * A composer's **Options** (0.11.1): when the toolbar cannot keep one row even with its chips shortened
 * to their value (`ComposerFit`, measured since 0.11.2; below 30rem of composer in 0.11.1), the turn's
 * settings fold behind one control, the `more` glyph named "Options" with the family tooltip
 * (D11's closed list), so the toolbar keeps one row and the dock does not grow. When the toolbar fits,
 * the control is not shown and nothing is folded.
 *
 * It is a disclosure, not a menu: its contents are controls of their own (chips with their own menus),
 * so the button says `aria-expanded` and controls them, and pressing it shows them in the
 * toolbar's start, beside Options from the first row (wrapping as they need), the actions taking the
 * next row.
 * Focus stays on the button; Tab moves into what it showed. Escape on any of them (not taken by an open
 * menu) folds them and returns focus to Options, and so does sending a message. Since 0.26.0 (D165) the
 * composer's **+** is one target wide and never folds: only the settings do (Attach folded before).
 *
 * Since 0.11.2 a `summary` (the model that will run, "Opus 5.5") shows beside the glyph, so a folded
 * composer still says what sending uses; the control's name then says both ("Options · Opus 5.5").
 *
 * Since 0.15.0 a chip asked to open while it is folded (a product's `/model` command calling
 * `chip.open()`) is not a silent no-op (DQ-01): the chip's `bui-refused` shows what Options holds and the
 * chip opens.
 *
 * The control exists only while there is something to fold (at least one setting); a
 * product passes `compact: false` to keep the wrapped toolbar of 0.11.0.
 */
export class ComposerFold {
	#root;
	#bar;
	#button;
	#hint;
	#parts = [];
	#enabled;
	#name;
	#onchange;
	#summary = el('span', { class: 'bui-composer-summary' });

	/**
	 * @param {object} options
	 * @param {HTMLElement} options.root the composer, which carries `data-compact` and `data-options`
	 * @param {HTMLElement} options.bar the toolbar, where the control goes first, before its start
	 * @param {import('../core/labels.js').Labels} options.labels the composer's copy (`options`)
	 * @param {boolean} options.enabled whether the composer folds at all (`compact`)
	 * @param {Array<HTMLElement|null|undefined>} options.parts what it folds: the settings' holder
	 * @param {((open: boolean) => void)|null} [options.onchange] it showed or folded what it holds
	 */
	constructor({ root, bar, labels, enabled, parts, onchange = null }) {
		this.#root = root;
		this.#onchange = onchange;
		this.#bar = bar;
		this.#enabled = enabled;
		this.#name = labels.text('options');
		this.#button = el('button', { type: 'button', class: 'bui-icon-button bui-composer-more', 'aria-label': this.#name, 'aria-expanded': 'false', 'data-bui-hint': true, onclick: () => this.toggle() }, [glyph('more'), this.#summary]);
		this.#hint = new Hint(this.#button);
		bar.addEventListener('keydown', this.#escape);
		root.addEventListener('bui-refused', this.#unfold);
		this.#controls(parts);
	}

	/** The control, for a product that measures it. */
	get button() {
		return this.#button;
	}

	/** Whether what it folds is shown. */
	get open() {
		return this.#root.hasAttribute('data-options');
	}

	/** What it folds and controls, each given an id for `aria-controls`. */
	#controls(parts) {
		this.#parts = parts.filter(Boolean);
		for (const part of this.#parts) part.id ||= Ids.next('bui-composer-part');
		this.#button.setAttribute('aria-controls', this.#parts.map(part => part.id).join(' '));
	}

	/** Whether there is something to fold (the control is in the toolbar, shown when the toolbar folds). */
	get available() {
		return this.#button.parentNode === this.#bar;
	}

	/** What sending uses, shown beside the glyph while folded ("Opus 5.5"), or null (0.11.2). */
	set summary(text) {
		const words = text === null || text === undefined ? '' : String(text).trim();
		this.#summary.textContent = words;
		this.#button.toggleAttribute('data-summary', Boolean(words));
		this.#button.setAttribute('aria-label', words ? `${this.#name} · ${words}` : this.#name);
	}

	/** Whether there is something to fold: the control is placed first in the toolbar, or removed. */
	set available(value) {
		const shown = this.#enabled && Boolean(value);
		this.#root.toggleAttribute('data-compact', shown);
		if (shown && this.#button.parentNode !== this.#bar) this.#bar.prepend(this.#button);
		if (!shown) {
			this.#hint.hide();
			this.#button.remove();
			this.toggle(false);
		}
	}

	/** Shows (`true`), folds (`false`) or switches what it folds. */
	toggle(open = !this.open) {
		const changed = Boolean(open) !== this.open;
		this.#root.toggleAttribute('data-options', Boolean(open));
		this.#button.setAttribute('aria-expanded', String(Boolean(open)));
		if (open) this.#hint.hide();
		if (changed) this.#onchange?.(Boolean(open));
	}

	destroy() {
		this.#bar.removeEventListener('keydown', this.#escape);
		this.#root.removeEventListener('bui-refused', this.#unfold);
		this.#hint.destroy();
	}

	/** A folded control asked to open: show what Options holds, then let it open. */
	#unfold = event => {
		if (this.open || !this.available || !this.#parts.some(part => part.contains(event.target))) return;
		event.preventDefault();
		this.toggle(true);
		event.detail?.retry?.();
	};

	/** Escape on Options or on what it shows folds it again, unless an open menu took the key. */
	#escape = event => {
		if (event.key !== 'Escape' || event.defaultPrevented || !this.open || !this.#button.isConnected) return;
		const inside = event.target === this.#button || this.#parts.some(part => part.contains(event.target));
		if (!inside || !this.#button.getClientRects().length) return;
		event.preventDefault();
		event.stopPropagation();
		this.toggle(false);
		this.#button.focus();
	};
}
