/**
 * A crew of subagents for `Lanes` (0.22.0), as Conduict's crew block gives it: started at 10:42:05 local
 * time on 23 October 2026, read at `start` + 102 s, one finished, one failed, two working (one nested under
 * another), one waiting for the person, with the product's own words for each state and tokens as facts.
 */
export const start = new Date(2026, 9, 23, 10, 42, 5).getTime();

/** The crew as `Lanes.update({ lanes })` takes it: a fresh copy each time. */
export function crew() {
	return [
		{ key: 'explore', state: 'running', stateLabel: 'Working', title: 'Explore the auth module', kind: 'Explore', now: 'Reading src/auth/session.ts', facts: [{ text: '48k', label: 'tokens' }], since: start },
		{ key: 'map', state: 'done', stateLabel: 'Finished', title: 'Map the payments API', kind: 'Explore', now: 'Finished · 31 steps', facts: ['61k'], since: start, until: start + 95_000 },
		{ key: 'plan', state: 'running', stateLabel: 'Working', title: 'Review the migration plan', kind: 'Plan', now: 'Searching "lease"', facts: [{ text: '22k', label: 'tokens' }], since: start + 44_000 },
		{ key: 'index', depth: 1, state: 'running', stateLabel: 'Working', title: 'Check index usage', now: 'Running psql -c "explain …"', facts: ['8k'], since: start + 82_000 },
		{ key: 'fix', state: 'waiting', stateLabel: 'Waiting for you', title: 'Fix the flaky test', now: 'Waiting for you · run npm test', facts: ['11k'], since: start + 69_000 },
		{ key: 'bench', state: 'failed', stateLabel: 'Failed', title: 'Benchmark the cache', now: 'Failed · exit 1', facts: ['15k'], since: start + 10_000, until: start + 51_000 }
	];
}

/**
 * What assistive technology reads of a node, approximately: its text without what is hidden from it
 * (`hidden`, `aria-hidden="true"`), visually hidden words included, spaces collapsed.
 */
export function spoken(node) {
	const walk = current => {
		if (current.nodeType === 3) return current.data;
		if (current.nodeType !== 1 || current.hidden || current.getAttribute('aria-hidden') === 'true') return '';
		return [...current.childNodes].map(walk).join('');
	};
	return walk(node).replace(/\s+/g, ' ').trim();
}
