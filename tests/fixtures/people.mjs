/** People a picker chooses from: 45 entries across three teams; one is disabled with a reason. */
export const people = Array.from({ length: 45 }, (_, index) => ({
	id: `p${index + 1}`,
	label: `Person ${String(index + 1).padStart(2, '0')}`,
	description: ['Design', 'Delivery', 'Support'][index % 3],
	team: ['design', 'delivery', 'support'][index % 3],
	...(index === 2 ? { disabled: true, reason: 'Already in another batch' } : {})
}));

/**
 * A paged source over `people` with switches a test flips: `fail` rejects the next requests,
 * `delay` holds answers, and `requests` records what was asked.
 */
export class People {
	fail = false;
	delay = 0;
	requests = [];

	get source() {
		return async ({ query, filters = {}, cursor, limit, signal }) => {
			this.requests.push({ query, filters, cursor, limit });
			if (this.delay) await new Promise(resolve => setTimeout(resolve, this.delay));
			if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
			if (this.fail) throw new Error('source down');
			const found = people.filter(person => person.label.toLowerCase().includes((query ?? '').toLowerCase()) && (!filters.team || person.team === filters.team));
			const start = cursor ?? 0;
			const next = start + limit < found.length ? start + limit : null;
			return { items: found.slice(start, start + limit), next, total: found.length };
		};
	}
}
