/**
 * A notification adapter over in-memory items, shaped as a product's relay of
 * `beyond-notifications/1` answers. Switches: `down` (requests fail), `absent` (aggregation not
 * configured: `available: false`), `missing` (products whose items are hidden) and `gone` (ids the
 * producer no longer shows). `calls` records every call.
 *
 * `shape` selects how answers state reach: `relay` (default) names hidden products in
 * `unavailable`; `projects` answers as Beyond Projects does, with `sources: [{ product, state }]`
 * and a summary `{ unread, more, sources }` whose count stops at `bound` (`more: true` past it).
 */
export class Notices {
	down = false;
	absent = false;
	missing = [];
	gone = new Set();
	calls = [];
	shape = 'relay';
	bound = 99;
	items;

	constructor(now = Date.parse('2026-09-23T12:00:00Z')) {
		const at = minutes => new Date(now - minutes * 60000).toISOString();
		this.items = [
			{ id: 'n1', product: 'delegate', kind: 'request.commented', title: 'New comment on “Export invoices”', summary: 'Ana: can we include credit notes?', occurred: at(5), read: null, group: 'request:r1' },
			{ id: 'n2', product: 'delegate', kind: 'request.commented', title: 'New comment on “Export invoices”', summary: 'Luis: yes, next batch.', occurred: at(30), read: null, group: 'request:r1' },
			{ id: 'n3', product: 'cdn', kind: 'release.ready', title: 'Release 1.4.0 is prepared', occurred: at(90), read: at(60) },
			{ id: 'n4', product: 'projects', kind: 'project.shared', title: 'You were added to Storefront', occurred: at(600), read: null },
			...Array.from({ length: 12 }, (_, index) => ({ id: `m${index}`, product: 'delegate', kind: 'version.published', title: `Version ${index + 1} published`, occurred: at(1000 + index * 60), read: at(900) }))
		];
	}

	get adapter() {
		const call = (name, value) => {
			this.calls.push([name, value]);
			if (this.down) return Promise.reject(new Error('relay down'));
			return null;
		};
		return {
			summary: async () => call('summary') ?? (this.absent ? { available: false } : this.#summary()),
			list: async request => call('list', request) ?? this.#page(request),
			read: async target => call('read', target) ?? this.#mark(target, true),
			unread: async ids => call('unread', ids) ?? this.#mark(ids, false),
			open: async id => {
				const failed = call('open', id);
				if (failed) return failed;
				if (this.gone.has(id)) throw Object.assign(new Error('not found'), { code: 'NOT_FOUND' });
				this.#mark([id], true);
				return { destination: `/app/${id}` };
			}
		};
	}

	get visible() {
		return this.items.filter(item => !this.missing.includes(item.product));
	}

	/** How the answers state which products could not be reached, in the selected shape. */
	get reach() {
		if (this.shape !== 'projects') return { unavailable: this.missing };
		const products = [...new Set(this.items.map(item => item.product))];
		return { sources: products.map(product => ({ product, state: this.missing.includes(product) ? 'unavailable' : 'available' })) };
	}

	#summary() {
		const unread = this.visible.filter(item => !item.read).length;
		if (this.shape !== 'projects') return { unread, ...this.reach };
		return { unread: Math.min(unread, this.bound), more: unread > this.bound, ...this.reach };
	}

	#page({ state = 'all', product = null, cursor = null, limit = 20 }) {
		if (this.absent) return { available: false, items: [] };
		const found = this.visible.filter(item => (state === 'all' || !item.read) && (!product || item.product === product));
		const start = cursor ?? 0;
		return { items: found.slice(start, start + limit).map(item => ({ ...item })), next: start + limit < found.length ? start + limit : null, ...this.reach };
	}

	#mark(target, read) {
		const stamp = read ? new Date().toISOString() : null;
		const chosen = Array.isArray(target) ? this.items.filter(item => target.includes(item.id)) : this.items.filter(item => (!target.product || item.product === target.product) && item.occurred <= target.before);
		for (const item of chosen) item.read = read ? (item.read ?? stamp) : null;
		return { updated: chosen.length };
	}
}
