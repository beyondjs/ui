/**
 * Trying again by itself while Beyond Accounts does not answer: after 5, 15, 30 and then every 60
 * seconds, until `reset()`.
 */
export class Retry {
	static DELAYS = Object.freeze([5_000, 15_000, 30_000, 60_000]);

	#run;
	#count = 0;
	#timer = null;

	/** @param {() => void} run */
	constructor(run) {
		this.#run = run;
	}

	schedule() {
		clearTimeout(this.#timer);
		const delay = Retry.DELAYS[Math.min(this.#count, Retry.DELAYS.length - 1)];
		this.#count += 1;
		this.#timer = setTimeout(() => this.#run(), delay);
	}

	reset() {
		clearTimeout(this.#timer);
		this.#timer = null;
		this.#count = 0;
	}
}
