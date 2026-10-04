/**
 * Repositories a resource picker chooses from, by account: what Projects' picker route answers in the
 * repository connection review (rows with visibility, default branch, update time and marks). One
 * account is suspended. `Repositories` is a paged source a test can make fail or stall, and records
 * what was asked; `recognize` reads a pasted GitHub address the way a product would.
 */
const hour = 3_600_000;
const now = Date.now();

export const accounts = [
	{ id: 'con_acme', label: 'acme', detail: 'GitHub organization · Selected repositories' },
	{ id: 'con_ada', label: 'ada-gh', detail: 'Personal account · All repositories' },
	{ id: 'con_old', label: 'old-org', detail: 'GitHub organization', disabled: true, reason: 'Suspended on GitHub' }
];

export const repositories = {
	con_acme: [
		{ id: '101', label: 'acme/web', full: 'acme/web', visibility: 'private', meta: 'main', updated: now - 2 * hour },
		{ id: '102', label: 'acme/api', full: 'acme/api', visibility: 'private', meta: 'main', updated: now - 26 * hour },
		{ id: '103', label: 'acme/docs', full: 'acme/docs', visibility: 'public', meta: 'main', updated: now - 72 * hour, marks: [{ label: 'In Website', reason: 'Also in Website' }] },
		{ id: '104', label: 'acme/site', full: 'acme/site', visibility: 'public', meta: 'main', disabled: true, reason: 'Already in Storefront', marks: [{ label: 'Already here' }] },
		{ id: '105', label: 'acme/legacy', full: 'acme/legacy', visibility: 'private', meta: 'master', marks: [{ label: 'Archived on GitHub', tone: 'warning', reason: 'Read only' }] }
	],
	con_ada: [{ id: '201', label: 'ada-gh/notes', full: 'ada-gh/notes', visibility: 'private', meta: 'main', updated: now - hour }]
};

/** `owner/name`, `https://github.com/owner/name(.git)` or `git@github.com:owner/name.git`, as `{ label, query, match, value }`. */
export function recognize(text) {
	const found = /^(?:https:\/\/github\.com\/|git@github\.com:)?([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/.exec(text.trim());
	if (!found) return null;
	const full = `${found[1]}/${found[2]}`;
	return { label: full, query: found[2], match: item => item.full === full, value: { owner: found[1], name: found[2] } };
}

export class Repositories {
	fail = false;
	stall = false;
	requests = [];

	get source() {
		return async ({ query, account, cursor, limit, signal }) => {
			this.requests.push({ query, account, cursor, limit });
			if (this.stall) await new Promise(() => {});
			if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
			if (this.fail) throw new Error('Projects did not answer');
			const rows = (repositories[account] ?? []).filter(row => row.label.toLowerCase().includes((query ?? '').toLowerCase()));
			const suggested = !query && account === 'con_acme' ? { label: 'Recent', items: [rows[0]] } : null;
			return { items: rows, suggested, total: rows.length };
		};
	}
}
