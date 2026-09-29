/**
 * The listeners a page holds on `document` and `window`, measured the same way in every engine.
 *
 * `install(context)` runs before any page script: it wraps `EventTarget.prototype.addEventListener`
 * and `removeEventListener` and keeps, for those two targets only, each listener that is registered
 * and not yet removed, with the browser's own identity rules (target, type, handler and capture;
 * adding the same one twice keeps one). A `once` listener is kept until it is removed, so the count
 * can only err towards a leak. `snapshot(page)` marks the listeners present now; `added(page)` lists
 * those added since that snapshot and `present(page)` every one still registered, as `target:type`.
 * In Chromium the teardown check also reads the document's listeners through the DevTools protocol,
 * independently of this wrapper.
 */
export class PageListeners {
	static install(context) {
		return context.addInitScript(() => {
			const kept = [];
			const place = target => (target === document ? 'document' : target === window ? 'window' : null);
			const capture = options => (typeof options === 'boolean' ? options : Boolean(options?.capture));
			const add = EventTarget.prototype.addEventListener;
			const remove = EventTarget.prototype.removeEventListener;
			const find = (target, type, handler, options) => kept.findIndex(entry => entry.target === target && entry.type === type && entry.handler === handler && entry.capture === capture(options));
			EventTarget.prototype.addEventListener = function (type, handler, options) {
				if (place(this) && handler && find(this, type, handler, options) < 0) kept.push({ target: this, type, handler, capture: capture(options), marked: false });
				return add.call(this, type, handler, options);
			};
			EventTarget.prototype.removeEventListener = function (type, handler, options) {
				const index = place(this) ? find(this, type, handler, options) : -1;
				if (index >= 0) kept.splice(index, 1);
				return remove.call(this, type, handler, options);
			};
			window.fixtureListeners = {
				snapshot() {
					for (const entry of kept) entry.marked = true;
					return kept.length;
				},
				added() {
					return kept.filter(entry => !entry.marked).map(entry => `${place(entry.target)}:${entry.type}`);
				},
				present() {
					return kept.map(entry => `${place(entry.target)}:${entry.type}`);
				}
			};
		});
	}

	/** Marks the listeners present now; returns how many there are. */
	static snapshot(page) {
		return page.evaluate(() => window.fixtureListeners.snapshot());
	}

	/** `target:type` of every listener added since the last snapshot and still registered. */
	static added(page) {
		return page.evaluate(() => window.fixtureListeners.added());
	}

	/** `target:type` of every listener still registered on `document` and `window`. */
	static present(page) {
		return page.evaluate(() => window.fixtureListeners.present());
	}
}
