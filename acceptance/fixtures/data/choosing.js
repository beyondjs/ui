// The "Choose, never type" fixture's data, shared by the DOM and React consumers: GitHub accounts and
// repositories for the resource picker (with a recognizer for pasted addresses), branches, the
// organization's projects and a collection whose columns have priorities. `?sheet=1` opens the side
// sheet at load; `?detail=1` opens the list-detail's item.
const query = new URLSearchParams(location.search);
export const shape = { sheet: query.get('sheet') === '1', detail: query.get('detail') === '1' };

const hour = 3_600_000;
export const accounts = [
	{ id: 'con_acme', label: 'acme', detail: 'GitHub organization · Selected repositories' },
	{ id: 'con_ada', label: 'ada-gh', detail: 'Personal account · All repositories' },
	{ id: 'con_old', label: 'old-org', detail: 'GitHub organization', disabled: true, reason: 'Suspended on GitHub' }
];
const rows = {
	con_acme: [
		{ id: '101', full: 'acme/web', visibility: 'private', meta: 'main', age: 2 * hour },
		{ id: '102', full: 'acme/api', visibility: 'private', meta: 'main', age: 26 * hour },
		{ id: '103', full: 'acme/docs', visibility: 'public', meta: 'main', age: 72 * hour, marks: [{ label: 'In Website', reason: 'Also in Website' }] },
		{ id: '104', full: 'acme/site', visibility: 'public', meta: 'main', disabled: true, reason: 'Already in Storefront', marks: [{ label: 'Already here' }] }
	],
	con_ada: [{ id: '201', full: 'ada-gh/notes', visibility: 'private', meta: 'main', age: hour }]
};

/** A source over the rows of the account in view; `fixture.stall` holds it. */
export function source(log) {
	return async ({ query: text = '', account }) => {
		log.push(`source:${account}:${text}`);
		if (window.fixture?.stall) await new Promise(() => {});
		const items = (rows[account] ?? []).filter(row => row.full.includes(text)).map(({ age, full, ...row }) => ({ ...row, full, label: full, updated: Date.now() - (age ?? 0) }));
		return { items, total: items.length };
	};
}

/** `owner/name`, a GitHub address or an SSH remote, as what the product recognizes. */
export function recognize(text) {
	const found = /^(?:https:\/\/github\.com\/|git@github\.com:)?([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/.exec(text.trim());
	if (!found) return null;
	const full = `${found[1]}/${found[2]}`;
	return { label: full, query: found[2], match: item => item.full === full, value: { owner: found[1], name: found[2] } };
}

export const branches = ['develop', 'feature/billing', 'feature/login-page', 'feature/search', 'fix/login-redirect', 'fix/typo', 'gh-pages', 'main', 'release/2026.10', 'renovate/react-19', 'spike/agents', 'staging', 'topic/a', 'topic/b', 'topic/c', 'wip'].map(name => ({ name, ...(name === 'main' ? { default: true } : {}) }));

export const projects = [
	{ id: 'prj_s', name: 'Storefront', here: { state: 'used' } },
	{ id: 'prj_a', name: 'Atlas', here: { state: 'unset' } },
	{ id: 'prj_b', name: 'Billing', here: { state: 'denied' } }
];

export const repositories = [
	{ id: 'r1', name: 'acme/web', state: 'Ready', branch: 'main', updated: '2 h ago', size: '12 MB', cloned: 'Cloned 3 Oct' },
	{ id: 'r2', name: 'acme/api', state: 'Cloning', branch: 'main', updated: 'yesterday', size: '4 MB', cloned: 'Cloned 1 Oct' }
];
export const columns = [
	{ key: 'name', label: 'Repository', primary: true },
	{ key: 'state', label: 'State' },
	{ key: 'branch', label: 'Default branch of the repository', priority: 1 },
	{ key: 'updated', label: 'Updated on GitHub', priority: 2 },
	{ key: 'cloned', label: 'Cloned on this environment', priority: 3 },
	{ key: 'size', label: 'Size on disk', priority: 4 }
];
