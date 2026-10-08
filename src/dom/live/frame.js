/**
 * At most one piece of work per animation frame: `request()` asks for the next frame and does nothing
 * while one is already asked for, so any number of changes between two frames costs one drawing.
 * Browsers do not run animation frames in a hidden tab, so the work waits until the tab is shown and
 * then runs once. Without `requestAnimationFrame` (a server, a test without one) a 16 ms timer stands
 * in for it.
 */
export class Frame {
	#work;
	#handle = null;
	#timer = false;

	/** @param {() => void} work what runs once per frame */
	constructor(work) {
		this.#work = work;
	}

	/** Whether a frame is asked for and has not run yet. */
	get pending() {
		return this.#handle !== null;
	}

	request() {
		if (this.#handle !== null) return;
		const run = () => {
			this.#handle = null;
			this.#work();
		};
		if (typeof globalThis.requestAnimationFrame === 'function') {
			this.#timer = false;
			this.#handle = globalThis.requestAnimationFrame(run);
		} else {
			this.#timer = true;
			this.#handle = setTimeout(run, 16);
		}
	}

	cancel() {
		if (this.#handle === null) return;
		if (this.#timer) clearTimeout(this.#handle);
		else globalThis.cancelAnimationFrame?.(this.#handle);
		this.#handle = null;
	}
}
