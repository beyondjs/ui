/**
 * Listeners a component registers outside its own element (on `document`, `window` or another
 * component's element), so that destroying the component releases every one of them.
 */
export class Listeners {
	#entries = [];

	/** Adds a listener and remembers it for release. */
	add(target, type, handler, options) {
		target.addEventListener(type, handler, options);
		this.#entries.push([target, type, handler, options]);
	}

	/** Removes one listener registered here. */
	remove(target, type, handler, options) {
		target.removeEventListener(type, handler, options);
		this.#entries = this.#entries.filter(entry => entry[0] !== target || entry[1] !== type || entry[2] !== handler);
	}

	/** Removes every registered listener. */
	release() {
		for (const [target, type, handler, options] of this.#entries) target.removeEventListener(type, handler, options);
		this.#entries = [];
	}

	get size() {
		return this.#entries.length;
	}
}

/**
 * The lifecycle every component shares: an element, mounting into a parent and a complete
 * `destroy()`.
 *
 * A subclass builds its element and exposes it through `element`. Timers go through `later` and
 * outside listeners through `listen`, so `destroy()` can cancel and release them; it then removes
 * the element. Destroying twice is harmless, and a destroyed component ignores late results.
 */
export class Component {
	#listeners = new Listeners();
	#timers = new Set();
	#destroyed = false;

	/** The component's root element. Subclasses define it. */
	get element() {
		throw new Error(`${this.constructor.name} defines no element`);
	}

	get destroyed() {
		return this.#destroyed;
	}

	/** Listeners registered outside the element, released by `destroy()`. */
	get listeners() {
		return this.#listeners;
	}

	/** Registers a listener on another target; `destroy()` removes it. */
	listen(target, type, handler, options) {
		this.#listeners.add(target, type, handler, options);
		return () => this.#listeners.remove(target, type, handler, options);
	}

	/** Schedules work that `destroy()` cancels. Returns the cancellation. */
	later(work, delay) {
		const timer = setTimeout(() => {
			this.#timers.delete(timer);
			if (!this.#destroyed) work();
		}, delay);
		this.#timers.add(timer);
		return () => {
			clearTimeout(timer);
			this.#timers.delete(timer);
		};
	}

	/** Appends the element to `parent`, or inserts it before `before`. */
	mount(parent, before = null) {
		parent.insertBefore(this.element, before);
		return this;
	}

	/** Releases listeners and timers and removes the element. */
	destroy() {
		if (this.#destroyed) return;
		this.#destroyed = true;
		this.#listeners.release();
		for (const timer of this.#timers) clearTimeout(timer);
		this.#timers.clear();
		this.element.remove();
	}
}
