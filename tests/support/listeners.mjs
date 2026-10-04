/**
 * The listeners a happy-dom page holds on its `document` and `window`, by the browser's identity
 * rules (target, type, handler and capture; adding the same one twice keeps one), for tests that
 * assert a component releases what it registered. `install()` wraps `addEventListener` and
 * `removeEventListener` of those two targets; `present()` lists what is registered, as
 * `target:type`; `uninstall()` restores them.
 */
export class Listeners {
	#window;
	#kept = [];
	#saved = [];

	constructor(window) {
		this.#window = window;
	}

	install() {
		const kept = this.#kept;
		const capture = options => (typeof options === 'boolean' ? options : Boolean(options?.capture));
		const find = (target, type, handler, options) => kept.findIndex(entry => entry.target === target && entry.type === type && entry.handler === handler && entry.capture === capture(options));
		for (const target of [this.#window, this.#window.document]) {
			const { addEventListener: add, removeEventListener: remove } = target;
			this.#saved.push([target, add, remove]);
			target.addEventListener = function (type, handler, options) {
				if (handler && find(target, type, handler, options) < 0) kept.push({ target, type, handler, capture: capture(options) });
				return add.call(this, type, handler, options);
			};
			target.removeEventListener = function (type, handler, options) {
				const index = find(target, type, handler, options);
				if (index >= 0) kept.splice(index, 1);
				return remove.call(this, type, handler, options);
			};
		}
		return this;
	}

	/** Every listener still registered, as `document:type` or `window:type`. */
	present() {
		return this.#kept.map(entry => `${entry.target === this.#window ? 'window' : 'document'}:${entry.type}`).sort();
	}

	uninstall() {
		for (const [target] of this.#saved) {
			delete target.addEventListener;
			delete target.removeEventListener;
		}
		this.#saved = [];
		this.#kept.length = 0;
	}
}
