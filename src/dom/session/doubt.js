/**
 * A request refused again within `pause` of a renewal (0.47.0): the session is read first, one read for
 * every refusal meanwhile. Ended, it is recovered as always. Still signed, the refusal was not the
 * session's: what waited is not sent again and nothing is renewed or announced, so a product that sends
 * a refused request again never loops through `Session`, and each read standing signed extends the pause.
 */
export class Doubt {
	#reader;
	#held;
	#pause;
	#hooks;
	#confirmed = -Infinity;
	#running = false;

	/**
	 * @param {object} options
	 * @param {import('./reader.js').Reader} options.reader the product's read of its session
	 * @param {import('./held.js').Held} options.held the requests that wait for the session
	 * @param {number} options.pause milliseconds after a renewal within which a refusal is doubted
	 * @param {{signed: () => boolean, recover: (reason: string|null) => void, known: (answer: object) => void}} options.hooks
	 */
	constructor({ reader, held, pause, hooks }) {
		this.#reader = reader;
		this.#held = held;
		this.#pause = pause;
		this.#hooks = hooks;
	}

	/** Whether a refusal now comes within `pause` of the session last confirmed signed. */
	get near() {
		return Date.now() - this.#confirmed < this.#pause;
	}

	/** The session was confirmed signed now: a renewal. */
	confirm() {
		this.#confirmed = Date.now();
	}

	/** Reads the session once for every refusal meanwhile, and answers them. */
	async run(reason) {
		if (this.#running) return;
		this.#running = true;
		const answer = await this.#reader.read(Date.now());
		this.#running = false;
		if (!this.#hooks.signed()) return;
		if (answer.state !== 'signed') return this.#hooks.recover(answer.reason ?? reason);
		this.confirm();
		this.#held.settle(false);
		this.#hooks.known(answer);
	}
}
