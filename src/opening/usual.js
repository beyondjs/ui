/**
 * How long each step of opening usually takes on this device (0.21.0), measured, never guessed: the
 * durations of the last `size` openings that finished, per step, kept in this origin's storage under
 * `<key>.opening`. "Usually" is the median and "longer than usual" starts past the 90th percentile
 * (D50), and only once `least` openings were measured. Durations only: no person, address or time.
 */
export class OpeningUsual {
	static size = 20;
	static least = 5;

	#key;
	#record;

	constructor(key) {
		this.#key = `${key}.opening`;
		this.#record = this.#read();
	}

	#read() {
		try {
			const record = JSON.parse(globalThis.localStorage?.getItem(this.#key) ?? 'null');
			return record && typeof record === 'object' && !Array.isArray(record) ? record : {};
		} catch {
			return {};
		}
	}

	/** `{ median, p90 }` in milliseconds for a step, or null while fewer than `least` were measured */
	of(step) {
		const samples = (Array.isArray(this.#record[step]) ? this.#record[step] : []).filter(value => Number.isFinite(value) && value >= 0);
		if (samples.length < OpeningUsual.least) return null;
		const sorted = [...samples].sort((a, b) => a - b);
		const at = share => sorted[Math.min(sorted.length - 1, Math.ceil(share * sorted.length) - 1)];
		return { median: at(0.5), p90: at(0.9) };
	}

	/** Keeps the durations of an opening that finished: `[{ step, ms }]` */
	keep(durations) {
		for (const { step, ms } of durations) {
			if (!step || !Number.isFinite(ms)) continue;
			const samples = Array.isArray(this.#record[step]) ? this.#record[step] : [];
			this.#record[step] = [...samples, Math.round(ms)].slice(-OpeningUsual.size);
		}
		try {
			globalThis.localStorage?.setItem(this.#key, JSON.stringify(this.#record));
		} catch {
			// Without storage nothing is measured; the opening says the time so far alone
		}
	}
}
