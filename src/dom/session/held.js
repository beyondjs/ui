/**
 * The requests that came back `UNAUTHENTICATED` and wait for the session: each resolves once with
 * whether its caller sends it again (`replay` `read` or `write` after a renewal; never `false`).
 */
export class Held {
	#entries = [];

	get size() {
		return this.#entries.length;
	}

	/** @param {'read'|'write'|false} replay */
	add(replay) {
		return new Promise(resolve => this.#entries.push({ replay, resolve }));
	}

	/** Resolves everything that waited: `true` only after a renewal, and never for `replay: false`. */
	settle(renewed) {
		const entries = this.#entries;
		this.#entries = [];
		for (const { replay, resolve } of entries) resolve(renewed && Boolean(replay));
	}
}
