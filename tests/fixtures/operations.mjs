/**
 * A fictional long operation for the D50 components: an environment's preparation as its record
 * says it at `start`, with steps measured in minutes. Times are absolute, so a component drawn from
 * them shows the same whatever page drew it first (a reload).
 */
export const start = Date.parse('2026-10-03T19:47:00Z');
export const minute = 60_000;
export const at = minutes => new Date(start + minutes * minute).toISOString();

/** The usual times: the machine 1 min (90th percentile 2 min), its startup 3 min (5 min). */
export const usual = { machine: { median: minute, p90: 2 * minute }, startup: { median: 3 * minute, p90: 5 * minute } };

/** The machine done in 1 min 24 s, its startup in progress since minute 2 with a phase, then two steps not begun. */
export const preparing = [
	{ id: 'machine', label: 'Machine', state: 'done', since: at(0), until: new Date(start + 84_000).toISOString(), expected: usual.machine },
	{ id: 'startup', label: 'Startup', state: 'progress', since: at(2), expected: usual.startup, phase: { label: 'Installing tools', since: at(3) } },
	{ id: 'connect', label: 'Connection to Conduict', state: 'waiting' },
	{ id: 'signin', label: 'Sign-in', state: 'waiting' }
];

/** The startup finished; the connection is blocked by something else, with the dial's own words. */
export const blocked = [
	preparing[0],
	{ id: 'startup', label: 'Startup', state: 'done', since: at(2), until: at(4) },
	{
		id: 'connect',
		label: 'Connection to Conduict',
		state: 'stalled',
		since: at(4),
		reason: { text: 'Conduict cannot reach the machine: its address is not admitted.', details: { text: 'dial tcp 203.0.113.7:443: i/o timeout', request: 'req_7Hq2', time: at(5) } }
	},
	{ id: 'signin', label: 'Sign-in', state: 'waiting' }
];
