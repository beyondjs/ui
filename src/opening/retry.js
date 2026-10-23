/**
 * One reload by itself when the product's code could not load (0.25.0). A failure that passes, such as
 * a request that did not arrive or a page whose code changed while it loaded, is then never seen. The
 * same address reloads by itself at most once per `window` milliseconds, kept in this tab's session
 * storage, so a failure that persists is said instead of looping. Without that storage it never reloads
 * by itself.
 */
export class OpeningRetry {
	static window = 30000;

	#key;

	constructor(key) {
		this.#key = `${key}.opening.reload`;
	}

	/** Reloads and returns true when this address has not reloaded by itself within the window */
	run() {
		try {
			const storage = globalThis.sessionStorage;
			const last = JSON.parse(storage.getItem(this.#key) ?? 'null');
			const address = globalThis.location.href;
			if (last?.address === address && Date.now() - last.at < OpeningRetry.window) return false;
			storage.setItem(this.#key, JSON.stringify({ address, at: Date.now() }));
		} catch {
			return false;
		}
		globalThis.location.reload();
		return true;
	}
}
