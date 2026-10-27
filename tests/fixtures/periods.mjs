/** Usage records of two months, read by a source that keeps only the chosen period's range (0.44.0). */
import { Period } from '@beyond-js/ui/dom';

/** The clock of the period tests: 27 October 2026, 15:30 UTC */
export const clock = () => new Date(Date.UTC(2026, 9, 27, 15, 30));

export const usage = [
	{ id: 'atlas-10', name: 'Atlas', month: '2026-10', at: '2026-10-03T10:00:00Z' },
	{ id: 'cedar-09', name: 'Cedar', month: '2026-09', at: '2026-09-14T09:00:00Z' },
	{ id: 'birch-09', name: 'Birch', month: '2026-09', at: '2026-09-02T18:00:00Z' }
];

export class UsageSource {
	#requests = [];
	get requests() { return this.#requests; }
	read = async request => {
		this.#requests.push(request);
		const range = Period.range(request.filters.period, { now: clock() });
		const rows = usage.filter(row => !range || (Date.parse(row.at) >= range.start.getTime() && Date.parse(row.at) < range.end.getTime()));
		return { rows, total: rows.length };
	};
}
