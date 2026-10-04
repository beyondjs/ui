// A fictional long operation for the operations pages, as its record says it: an environment
// starting since 19:47 with its steps, measured against a clock the page sets from `?at=<minutes>`
// (and window.fixture.at(minutes)), so a reload with the same address shows the same.
export const start = Date.parse('2026-10-03T19:47:00Z');
export const minute = 60_000;
export const at = minutes => new Date(start + minutes * minute).toISOString();
const query = new URLSearchParams(location.search);

/** The minutes since the start the page's clock reads at first (`?at=`). */
export const minutes = Number(query.get('at') ?? 0);

/** The usual time of the whole wait, and of its startup step. */
export const expected = { median: 2 * minute, p90: 4 * minute };

export const steps = [
	{ id: 'machine', label: 'Machine', state: 'done', since: at(0), until: new Date(start + 24_000).toISOString() },
	{ id: 'startup', label: 'Startup', state: 'progress', since: new Date(start + 24_000).toISOString(), expected: { median: minute, p90: 2 * minute }, phase: { label: 'Installing tools', since: at(0.5) } },
	{ id: 'connect', label: 'Connection to Conduict', state: 'waiting' },
	{ id: 'signin', label: 'Sign-in', state: 'waiting' }
];

/** The reason a check may bring: the machine is there and Conduict cannot reach it. */
export const reason = { text: 'Conduict cannot reach the machine.', way: 'Check its firewall rule, then check again.', details: { text: 'dial tcp 203.0.113.7:443: i/o timeout', request: 'req_7Hq2', time: at(3) } };

/** How the sign-out behaves, from `?signout=`: `leave` (default), `cancel` (before() says no), `silent` (end() never answers). */
export const signout = query.get('signout') ?? 'leave';
