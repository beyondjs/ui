/**
 * Trying again by itself while Beyond Accounts does not answer: after 5, 15, 30 and then every 60
 * seconds, until `reset()`. Since 0.47.0 a try that falls due while the page is hidden waits for the
 * page to be shown and runs then, once, as `Again` does: a hidden page is not read for nobody.
 */
export class Retry {
	static DELAYS = Object.freeze([5_000, 15_000, 30_000, 60_000]);

	#run;
	#document;
	#count = 0;
	#timer = null;
	#shown = () => {
		if (this.#document.visibilityState === 'hidden') return;
		this.#document.removeEventListener('visibilitychange', this.#shown);
		this.#run();
	};

	/**
	 * @param {() => void} run
	 * @param {Document|null} [document] what says whether the page is hidden
	 */
	constructor(run, document = null) {
		this.#run = run;
		this.#document = document;
	}

	schedule() {
		this.#clear();
		const delay = Retry.DELAYS[Math.min(this.#count, Retry.DELAYS.length - 1)];
		this.#count += 1;
		this.#timer = setTimeout(() => this.#due(), delay);
	}

	reset() {
		this.#clear();
		this.#count = 0;
	}

	#due() {
		this.#timer = null;
		if (this.#document?.visibilityState !== 'hidden') return this.#run();
		this.#document.addEventListener('visibilitychange', this.#shown);
	}

	#clear() {
		clearTimeout(this.#timer);
		this.#timer = null;
		this.#document?.removeEventListener('visibilitychange', this.#shown);
	}
}
