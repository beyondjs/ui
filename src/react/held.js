/**
 * The page's notice as a component that joins it sees it (0.33.0): `useRecovery` makes the notice once
 * mounted, so a list or a picker whose first read fails at once may fail before the notice exists. Its
 * symptoms wait here until the notice arrives (`flush()`), and go to it directly once it is there, so
 * an outage is never said as a component's own failure only because the page had not drawn yet.
 */
export class HeldNotice {
	#latest;
	#entries = new Map();

	/** @param {{current: {recovery?: {set: Function, delete: Function}|null}}} latest the latest props */
	constructor(latest) {
		this.#latest = latest;
	}

	set(key, entry) {
		const notice = this.#latest.current.recovery;
		if (notice) notice.set(key, entry);
		else this.#entries.set(key, entry);
	}

	delete(key) {
		this.#entries.delete(key);
		this.#latest.current.recovery?.delete(key);
	}

	/** Hands what waited to the notice, once there is one. */
	flush() {
		const notice = this.#latest.current.recovery;
		if (!notice) return;
		for (const [key, entry] of this.#entries) notice.set(key, entry);
		this.#entries.clear();
	}
}
