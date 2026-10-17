import { ChoiceMenu } from './menu.js';

/**
 * A compact choice (0.11.0), built on `ChoiceMenu`: a chip that shows a muted label, its value and,
 * when there is one, a state in words with its tone ("Model Opus 5.5", "Environment My first VM ·
 * Stopped"), and opens the same menu of options, each with its label, its description (`detail`), its
 * state in words and, when it cannot be chosen, its reason. A dot never stands alone for a state.
 *
 * It fits a composer's settings slot and a form alike; keyboard and screen reader behavior are
 * `ChoiceMenu`'s (the ARIA menu pattern with `menuitemradio` options, type-ahead, a search past the
 * threshold, one option stated). `state` (`[label, tone]`) is the chip's own state, shown over the
 * chosen option's, such as an engine that needs a sign-in whatever model is chosen.
 *
 * Since 0.15.0 (DQ-02) a chip with nothing chosen shows its slot's name ("Machine") with its `glyph`
 * instead of the generic "Choose", unless the product gives a `placeholder`; its menu is placed by
 * `Floating` and `open()` returns whether it opened.
 */
export class ChoiceChip extends ChoiceMenu {
	#face;

	/**
	 * @param {ConstructorParameters<typeof ChoiceMenu>[0] & {state?: [string, string]|null, glyph?: string|null}} options
	 *   `glyph` (0.15.0): the slot's icon from the catalog, drawn before its words
	 */
	constructor({ state = null, glyph = null, ...options }) {
		const face = { state, glyph };
		super({ ...options, face });
		this.#face = face;
	}

	/** The chip's own state in words, `[label, tone]`, or null for the chosen option's. */
	get state() {
		return this.#face.state;
	}

	set state(state) {
		this.#face.state = state ?? null;
		// Setting the value draws the face again without calling `onchange`
		this.value = this.value;
	}
}
