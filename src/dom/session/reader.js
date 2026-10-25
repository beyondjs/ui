/**
 * The product's read of its own session, bounded (D40): an answer that is neither `signed` nor
 * `ended`, a rejection or no answer within `bound` is `unavailable`, which is never a sign-out. Since
 * 0.33.0 an unavailable answer carries who did not answer (`source`): the answer's or the error's own
 * `source`, else the product's `source` option (Beyond Accounts by default).
 */
export class Reader {
	#read;
	#bound;
	#source;

	/**
	 * @param {() => Promise<object>} read
	 * @param {number} bound milliseconds a read may take
	 */
	constructor(read, bound, source = 'accounts') {
		this.#read = read;
		this.#bound = bound;
		this.#source = source;
	}

	async read() {
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
