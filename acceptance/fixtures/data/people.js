/** People the fixture pickers choose from: 45 across three teams; person 3 is disabled with a reason. */
export const people = Array.from({ length: 45 }, (_, index) => ({
	id: `p${index + 1}`,
	label: `Person ${String(index + 1).padStart(2, '0')}`,
	description: ['Design', 'Delivery', 'Support'][index % 3],
	team: ['design', 'delivery', 'support'][index % 3],
	...(index === 2 ? { disabled: true, reason: 'Already in another batch' } : {})
}));

/** A paged, filterable source with a failure switch the browser checks flip through `window.fixture`. */
export class People {
	fail = false;
	delay = 60;

	get source() {
		return async ({ query = '', filters = {}, cursor, limit }) => {
			await new Promise(resolve => setTimeout(resolve, this.delay));
			if (this.fail) throw new Error('source down');
			const found = people.filter(person => person.label.toLowerCase().includes(query.toLowerCase()) && (!filters.team || person.team === filters.team));
			const start = cursor ?? 0;
			return { items: found.slice(start, start + limit), next: start + limit < found.length ? start + limit : null, total: found.length };
		};
	}
}

export const teams = [
	{ value: '', label: 'All teams' },
	{ value: 'design', label: 'Design' },
	{ value: 'support', label: 'Support' }
];
