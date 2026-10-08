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
 */
export class ChoiceChip extends ChoiceMenu {
	#face;

	/** @param {ConstructorParameters<typeof ChoiceMenu>[0] & {state?: [string, string]|null}} options */
	constructor({ state = null, ...options }) {
		const face = { state };
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
