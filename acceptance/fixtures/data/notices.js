/**
 * A notification adapter for the fixture pages, in one of the modes a check selects with
 * `?notices=`: `ready` (default), `empty`, `failed` (every call fails until `recover()`),
 * `unavailable` (aggregation not configured), `partial` (CDN did not answer) and `bound` (the
 * summary stops counting at 2, `more: true`). `ready` answers as a product relay (`unavailable`);
 * `partial` and `bound` answer as Beyond Projects does (`sources: [{ product, state }]`).
 */
export class Notices {
	#mode;
	items;

	constructor(mode = 'ready') {
		this.#mode = mode || 'ready';
		const now = Date.now();
		const at = minutes => new Date(now - minutes * 60000).toISOString();
		this.items = this.#mode === 'empty' ? [] : [
			{ id: 'n1', product: 'delegate', title: 'New comment on “Export invoices”', summary: 'Ana: can we include credit notes?', occurred: at(5), read: null, group: 'request:r1' },
			{ id: 'n2', product: 'delegate', title: 'New comment on “Export invoices”', summary: 'Luis: yes, next batch.', occurred: at(30), read: null, group: 'request:r1' },
			{ id: 'n3', product: 'cdn', title: 'Release 1.4.0 is prepared', occurred: at(90), read: null },
			{ id: 'n4', product: 'projects', title: 'You were added to Storefront', occurred: at(600), read: null },
			...Array.from({ length: 24 }, (_, index) => ({ id: `m${index}`, product: 'delegate', title: `Version ${index + 1} published`, occurred: at(1000 + index * 60), read: at(900) }))
		];
	}

	recover() {
		this.#mode = 'ready';
	}

	get #hidden() {
		return this.#mode === 'partial' ? ['cdn'] : [];
	}

	get #reach() {
		if (this.#mode !== 'partial' && this.#mode !== 'bound') return { unavailable: this.#hidden };
		return { sources: ['delegate', 'cdn', 'projects'].map(product => ({ product, state: this.#hidden.includes(product) ? 'unavailable' : 'available' })) };
	}

	get adapter() {
		const wait = () => new Promise(resolve => setTimeout(resolve, 80));
		const guard = async () => {
			await wait();
			if (this.#mode === 'failed') throw new Error('relay down');
		};
		return {
			summary: async () => {
				await guard();
				if (this.#mode === 'unavailable') return { available: false };
				const unread = this.#visible.filter(item => !item.read).length;
				if (this.#mode === 'bound') return { unread: Math.min(unread, 2), more: unread > 2, ...this.#reach };
				return { unread, ...this.#reach };
			},
			list: async ({ state, product, cursor, limit }) => {
				await guard();
				if (this.#mode === 'unavailable') return { available: false, items: [] };
				const found = this.#visible.filter(item => (state === 'all' || !item.read) && (!product || item.product === product));
				const start = cursor ?? 0;
				return { items: found.slice(start, start + limit).map(item => ({ ...item })), next: start + limit < found.length ? start + limit : null, ...this.#reach };
			},
			read: async target => {
				await guard();
				const chosen = Array.isArray(target) ? this.items.filter(item => target.includes(item.id)) : this.items.filter(item => (!target.product || item.product === target.product) && item.occurred <= target.before);
				for (const item of chosen) item.read = item.read ?? new Date().toISOString();
			},
			unread: async ids => {
				await guard();
				for (const item of this.items.filter(entry => ids.includes(entry.id))) item.read = null;
			},
			open: async id => {
				await guard();
				const item = this.items.find(entry => entry.id === id);
				item.read = item.read ?? new Date().toISOString();
				return { destination: `#/opened/${id}` };
			}
		};
	}

	get #visible() {
		return this.items.filter(item => !this.#hidden.includes(item.product));
	}
}
