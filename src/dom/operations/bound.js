/**
 * A check with a time limit (D40, 0.7.4): `Bound.run(work, ms)` settles as `work` does, or rejects with
 * a `TimeoutError` once `ms` passed, so a check that never settles cannot leave "Check again" disabled.
 */
export class Bound {
	/** The default limit of a check, in milliseconds. */
	static limit = 20_000;

	/** Runs `work` and resolves or rejects as it does, or rejects after `ms`. */
	static run(work, ms = Bound.limit) {
		let timer = null;
		const late = new Promise((resolve, reject) => {
			timer = setTimeout(() => reject(Object.assign(new Error('The check did not finish in time.'), { name: 'TimeoutError' })), ms);
		});
		// `work` starts at once, as an unbounded call did; a throw is its rejection
		let started;
		try {
			started = Promise.resolve(work());
		} catch (error) {
			started = Promise.reject(error);
		}
		return Promise.race([started, late]).finally(() => clearTimeout(timer));
	}
}
