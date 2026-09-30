const interactive = 'a[href], button, input, select, textarea, summary, [tabindex], [contenteditable=""], [contenteditable="true"]';

/**
 * The element a person last pressed or typed on, per document.
 *
 * Safari and WebKit (and Firefox for some controls on macOS) do not focus a button that is clicked,
 * so at the moment a click opens something `document.activeElement` is the body. Components that
 * return focus when they close ask this tracker which element started them instead of trusting the
 * body. It listens once per window, in the capture phase and passively, to `pointerdown` and
 * `keydown`, keeps only a weak reference and never changes an event. It is installed when this module
 * loads in a browser and, for other documents, the first time one is asked about; it lives as long as
 * its window, one pair of listeners however many components exist.
 */
export class Interaction {
	static #trackers = new WeakMap();
	#last = null;
	#keyboard = false;

	constructor(view) {
		const note = event => this.#note(event);
		view.addEventListener('pointerdown', note, { capture: true, passive: true });
		view.addEventListener('keydown', note, { capture: true, passive: true });
	}

	/** The tracker of `document`, installed on first use. */
	static of(document) {
		const view = document?.defaultView;
		if (!view) return null;
		let tracker = Interaction.#trackers.get(view);
		if (!tracker) {
			tracker = new Interaction(view);
			Interaction.#trackers.set(view, tracker);
		}
		return tracker;
	}

	/** Whether focus rests nowhere in particular: on the body, the root or no element. */
	static adrift(document) {
		const active = document.activeElement;
		return !active || active === document.body || active === document.documentElement;
	}

	/**
	 * The element that started what happens now: the focused element, or, when focus is adrift, the
	 * interactive element of the last press or key that is still in the page. Never the body.
	 */
	static origin(document) {
		if (!Interaction.adrift(document)) return document.activeElement;
		return Interaction.of(document)?.last ?? null;
	}

	/** Whether `element` is what the person is using: focused, or last pressed while focus is adrift. */
	static used(element) {
		const document = element.ownerDocument;
		if (document.activeElement === element) return true;
		return Interaction.adrift(document) && Interaction.of(document)?.last === element;
	}

	/** Whether the last press or key was a key: focus that follows it was moved by the keyboard. */
	get keyboard() {
		return this.#keyboard;
	}

	/** The interactive element of the last press or key, while it is still in the page. */
	get last() {
		const element = this.#last?.deref() ?? null;
		return element?.isConnected ? element : null;
	}

	#note(event) {
		this.#keyboard = event.type === 'keydown';
		const element = event.target?.closest?.(interactive) ?? null;
		this.#last = element ? new WeakRef(element) : null;
	}
}

if (typeof document !== 'undefined') Interaction.of(document);
