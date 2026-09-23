import { Window } from 'happy-dom';

/**
 * A DOM for one test file: a happy-dom window whose globals the components read (`document`,
 * `window`, element and event constructors). `close()` releases the window and restores the globals.
 * happy-dom implements `<dialog>`, constraint validation and events well enough for contract tests;
 * layout, focus rings, media queries and real keyboard handling are proved in the browser acceptance.
 */
export class Page {
	static #names = ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'Node', 'Event', 'KeyboardEvent', 'MouseEvent', 'PointerEvent', 'FocusEvent', 'CustomEvent', 'FormData', 'SubmitEvent', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame'];

	#window;
	#saved = new Map();

	constructor() {
		this.#window = new Window({ url: 'http://localhost/', width: 1024, height: 768 });
		for (const name of Page.#names) {
			this.#saved.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
			const value = name === 'window' ? this.#window : this.#window[name];
			Object.defineProperty(globalThis, name, { value: typeof value === 'function' && /^[a-z]/.test(name) ? value.bind(this.#window) : value, configurable: true, writable: true });
		}
	}

	get window() {
		return this.#window;
	}

	get document() {
		return this.#window.document;
	}

	/** Dispatches a key press on a target (keydown only, like a browser's first event). */
	key(target, key, options = {}) {
		const event = new this.#window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options });
		target.dispatchEvent(event);
		return event;
	}

	/** Clicks a target. */
	click(target) {
		target.click();
	}

	/** Waits until `check()` is truthy, polling the microtask and timer queues. */
	async until(check, limit = 2000) {
		const start = Date.now();
		while (!check()) {
			if (Date.now() - start > limit) throw new Error(`Timed out waiting for ${check}`);
			await new Promise(resolve => setTimeout(resolve, 5));
		}
	}

	/** Clears the body between tests. */
	reset() {
		this.document.body.replaceChildren();
	}

	async close() {
		await this.#window.happyDOM.close();
		for (const [name, descriptor] of this.#saved) {
			if (descriptor) Object.defineProperty(globalThis, name, descriptor);
			else delete globalThis[name];
		}
	}
}
