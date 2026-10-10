/**
 * The entry and exit of a surface the person opens and closes in place (0.14.0, D95), such as a page's
 * panel kept in view: `enter()` marks it `data-motion="in"` and `leave(done)` marks it
 * `data-motion="out"`, inert, and calls `done` once its exit has played, so whoever hides it changes the
 * layout once, at the end. The stylesheet decides what moves (transform and opacity only, `--motion-*`);
 * where it declares no animation for the mark (reduced motion, or a page without the styles) the exit
 * ends at once. An exit that never reports its end is ended by a bound.
 */
export class Motion {
	/** Milliseconds after which an exit counts as ended even without its `animationend`. */
	static bound = 400;

	#element;
	#later;
	#done = null;
	#cancel = null;
	#listener = null;

	/**
	 * @param {HTMLElement} element the surface
	 * @param {(work: () => void, delay: number) => () => void} later a component's `later`, so a destroy cancels the bound
	 */
	constructor(element, later) {
		this.#element = element;
		this.#later = later;
	}

	/** Whether an exit is playing. */
	get leaving() {
		return this.#done !== null;
	}

	/** Plays the entry, when the stylesheet declares one. */
	enter() {
		this.stop();
		this.#mark('in');
		if (!this.#moving()) return this.#clear();
		this.#await(() => this.#clear());
	}

	/** Plays the exit, then calls `done`; at once when nothing animates. */
	leave(done) {
		this.stop();
		this.#mark('out');
		if (!this.#moving()) {
			this.#clear();
			return done();
		}
		this.#element.inert = true;
		this.#done = done;
		this.#await(() => this.#finish());
	}

	/** Stops what plays without calling an exit's `done` (an opening that interrupts a closing). */
	stop() {
		this.#release();
		this.#done = null;
		this.#element.inert = false;
		this.#clear();
	}

	#finish() {
		const done = this.#done;
		this.#done = null;
		this.#element.inert = false;
		this.#clear();
		done?.();
	}

	#await(end) {
		this.#release();
		this.#listener = event => event.target === this.#element && (this.#release(), end());
		this.#element.addEventListener('animationend', this.#listener);
		this.#cancel = this.#later(() => (this.#release(), end()), Motion.bound);
	}

	#release() {
		if (this.#listener) this.#element.removeEventListener('animationend', this.#listener);
		this.#listener = null;
		this.#cancel?.();
		this.#cancel = null;
	}

	#mark(kind) {
		this.#element.dataset.motion = kind;
	}

	#clear() {
		delete this.#element.dataset.motion;
	}

	/** Whether the stylesheet animates the mark now (none under reduced motion, or without the styles). */
	#moving() {
		const view = this.#element.ownerDocument.defaultView;
		if (!this.#element.isConnected || this.#element.hidden || !view?.getComputedStyle) return false;
		const name = view.getComputedStyle(this.#element).animationName;
		return Boolean(name) && name !== 'none';
	}
}
