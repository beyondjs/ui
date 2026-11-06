/**
 * The product's read of its own session, bounded (D40): an answer that is neither `signed` nor
 * `ended`, a rejection or no answer within `bound` is `unavailable`, which is never a sign-out. Since
 * 0.33.0 an unavailable answer carries who did not answer (`source`): the answer's or the error's own
 * `source`, else the product's `source` option (Beyond Accounts by default).
 *
 * Since 0.47.0 reads are single-flight: a read asked for while one runs gets that read, unless the
 * caller needs one started after a moment (`since`: after a renewal, nothing read before it counts).
 * `recent(fresh)` answers with the last `signed` answer while it is younger than `fresh` ms, so looks
 * that come close together (a live transport dropping again and again) never become a burst of reads.
 */
export class Reader {
	#read;
	#bound;
	#source;
	/** The read running now: `{ at, answer }`, `answer` its promise */
	#running = null;
	/** The last answer and when its read started: `{ at, answer }` */
	#kept = null;

	/**
	 * @param {() => Promise<object>} read
	 * @param {number} bound milliseconds a read may take
	 */
	constructor(read, bound, source = 'accounts') {
		this.#read = read;
		this.#bound = bound;
		this.#source = source;
	}

	/**
	 * Reads the session, or joins the read running now when it started at or after `since`.
	 * @param {number} [since] the earliest start, in ms, of a read that may answer (any by default)
	 */
	read(since = -Infinity) {
		if (this.#running && this.#running.at >= since) return this.#running.answer;
		const at = Date.now();
		const answer = this.#once().then(result => {
			if (!this.#kept || this.#kept.at <= at) this.#kept = { at, answer: result };
			if (this.#running?.answer === answer) this.#running = null;
			return result;
		});
		this.#running = { at, answer };
		return answer;
	}

	/**
	 * The last answer when it said `signed` less than `fresh` ms ago, else a read (joined when one runs).
	 * @param {number} fresh milliseconds a `signed` answer stands for a look
	 */
	recent(fresh) {
		const kept = this.#kept;
		if (kept?.answer.state === 'signed' && Date.now() - kept.at < fresh) return Promise.resolve(kept.answer);
		return this.read();
	}

	async #once() {
		let timer = null;
		try {
			const late = new Promise((resolve, reject) => (timer = setTimeout(() => reject(new Error('The session was not read in time')), this.#bound)));
			const answer = await Promise.race([this.#read(), late]);
			return answer?.state === 'signed' || answer?.state === 'ended' ? answer : { state: 'unavailable', source: answer?.source ?? this.#source };
		} catch (error) {
			return { state: 'unavailable', source: error?.source ?? this.#source };
		} finally {
			clearTimeout(timer);
		}
	}
}
