/**
 * A composer's states and the marks its root carries for its stylesheet (0.26.0, D165): `disabled` (`{
 * reason }` while sending is unavailable, `data-disabled`) and the product's own `busy`; `data-busy` while a
 * send is in flight or the product works; `data-empty` while there is nothing to send (no words, no ready
 * file: Send reads quiet and, since 0.29.0, a press says nothing, D183); and `data-live` while the
 * product's work runs (the engine answering), which the box's edge shows. Since 0.35.0 (D183) a held Send
 * may say where the person can act (`disabled.place`): a press on it only puts them there.
 */
export class ComposerMarks {
	#root;
	#nothing;
	#onempty;

	/** Sending is unavailable, why, and where a press puts the person (0.35.0): `{ reason, place? }`, or null. */
	disabled = null;
	/** The product's own work: nothing is sent meanwhile. */
	busy = false;

	/**
	 * @param {HTMLElement} root the composer
	 * @param {() => boolean} nothing whether there is nothing to send now
	 * @param {((empty: boolean) => void)|null} [onempty] told each time it is drawn (Send's quiet state, 0.29.0)
	 */
	constructor(root, nothing, onempty = null) {
		this.#root = root;
		this.#nothing = nothing;
		this.#onempty = onempty;
	}

	/** Draws the marks as they are now; `busy` also counts a send in flight and a step that runs. */
	draw(busy) {
		this.#root.toggleAttribute('data-busy', Boolean(busy));
		this.#root.toggleAttribute('data-disabled', Boolean(this.disabled));
		this.empty();
	}

	/** Draws whether there is nothing to send, after a change of the text or the files, and tells `onempty`. */
	empty() {
		const nothing = this.#nothing();
		this.#root.toggleAttribute('data-empty', nothing);
		this.#onempty?.(nothing);
	}

	set live(value) {
		this.#root.toggleAttribute('data-live', Boolean(value));
	}

	/**
	 * Whether sending is held now (`disabled`). A press, never a key, on the held Send puts the person at
	 * `disabled.place()`, such as the chooser of what sending waits for, and says nothing more than the
	 * reason already beside it (0.35.0, D183); Enter in the field leaves focus where it is.
	 */
	held(pressed) {
		if (!this.disabled) return false;
		if (pressed) this.disabled.place?.()?.focus();
		return true;
	}
}
