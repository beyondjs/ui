/**
 * A composer's states and the marks its root carries for its stylesheet (0.26.0, D165): `disabled` (`{
 * reason }` while sending is unavailable, `data-disabled`) and the product's own `busy`; `data-busy` while a
 * send is in flight or the product works; `data-empty` while there is nothing to send (no words, no ready
 * file: Send reads quiet, and a press still says why); and `data-live` while the product's work runs (the
 * engine answering), which the box's edge shows.
 */
export class ComposerMarks {
	#root;
	#nothing;

	/** Sending is unavailable, and why: `{ reason }`, or null. */
	disabled = null;
	/** The product's own work: nothing is sent meanwhile. */
	busy = false;

	/**
	 * @param {HTMLElement} root the composer
	 * @param {() => boolean} nothing whether there is nothing to send now
	 */
	constructor(root, nothing) {
		this.#root = root;
		this.#nothing = nothing;
	}

	/** Draws the marks as they are now; `busy` also counts a send in flight and a step that runs. */
	draw(busy) {
		this.#root.toggleAttribute('data-busy', Boolean(busy));
		this.#root.toggleAttribute('data-disabled', Boolean(this.disabled));
		this.empty();
	}

	/** Draws whether there is nothing to send, after a change of the text or the files. */
	empty() {
		this.#root.toggleAttribute('data-empty', this.#nothing());
	}

	set live(value) {
		this.#root.toggleAttribute('data-live', Boolean(value));
	}
}
