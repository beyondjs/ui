/**
 * Loads one page of a collection at a time. Only the latest request may publish: a newer request
 * aborts the older one and a late answer is ignored.
 */
export class Loader {
	#source;
	#sequence = 0;
	#controller = null;

	constructor(source) {
		this.#source = source;
	}

	/** Resolves `{ answer }`, `{ error }`, or `{ stale: true }` when a newer request replaced it. */
	async load(request) {
		this.cancel();
		const sequence = this.#sequence;
		const controller = new AbortController();
		this.#controller = controller;
		try {
			const answer = await this.#source({ ...request, signal: controller.signal });
			return sequence === this.#sequence ? { answer } : { stale: true };
		} catch (error) {
			return sequence === this.#sequence ? { error } : { stale: true };
		}
	}

	cancel() {
		this.#sequence += 1;
		this.#controller?.abort();
		this.#controller = null;
	}
}

/**
 * A source over rows already in memory, for small collections and tests: it filters with `match`,
 * counts and slices the page the collection asks for.
 */
export function local(rows, match = (row, query) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase())) {
	return async ({ query = '', filters = {}, page = 1, limit = 20 }) => {
		const found = rows.filter(row => match(row, query, filters));
		const start = (page - 1) * limit;
		return { rows: found.slice(start, start + limit), total: found.length };
	};
}
