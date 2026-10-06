/**
 * The product's read of its own session, bounded (D40): an answer that is neither `signed` nor
 * `ended`, a rejection or no answer within `bound` is `unavailable`, which is never a sign-out.
 */
export class Reader {
	#read;
	#bound;

	/**
	 * @param {() => Promise<object>} read
	 * @param {number} bound milliseconds a read may take
	 */
	constructor(read, bound) {
		this.#read = read;
		this.#bound = bound;
	}

	async read() {
		let timer = null;
		try {
			const late = new Promise((resolve, reject) => (timer = setTimeout(() => reject(new Error('The session was not read in time')), this.#bound)));
			const answer = await Promise.race([this.#read(), late]);
			return answer?.state === 'signed' || answer?.state === 'ended' ? answer : { state: 'unavailable' };
		} catch {
			return { state: 'unavailable' };
		} finally {
			clearTimeout(timer);
		}
	}
}
