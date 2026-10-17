/**
 * What a person can do with shown notifications: open one and mark some read or unread.
 *
 * Opening asks the adapter, which rechecks access at the producer and marks the item read, and then
 * hands the destination to the product (`onopen`). An item that is no longer visible — access was
 * revoked or the resource is gone — is removed with a plain message instead of opening. Marking is
 * idempotent and never a business action. Every outcome ends in `changed`, which redraws.
 *
 * Since 0.15.0 (X-07) a matter is a product's `group` (an item without a group is a matter of its own), and
 * a whole matter is read or made unread at once when the adapter has `readGroup({ product, group })` and
 * `unreadGroup({ product, group })` (Beyond Projects' `POST /v1/notifications/read` and `/unread` with the
 * body `{ product, group }`): opening a matter, or marking it, reaches every update of it, also those no
 * page has loaded. Without them, or when they fail, the loaded updates are marked by their ids as before.
 */
export class Actions {
	#adapter;
	#feed;
	#onopen;
	#changed;
	#say;

	constructor({ adapter, feed, onopen, changed, say }) {
		this.#adapter = adapter;
		this.#feed = feed;
		this.#onopen = onopen;
		this.#changed = changed;
		this.#say = say;
	}

	/**
	 * Opens `item`; `members` are the updates of its matter (0.13.1), all marked read once it opens, so a
	 * matter the person opened is no longer unread. A failure to mark the others leaves them as they were
	 * and never holds the opening back.
	 */
	async open(item, members = [item]) {
		let answer;
		try {
			answer = await this.#adapter.open(item.id);
		} catch (error) {
			if (Actions.gone(error)) return this.#gone(item);
			this.#say('update');
			return;
		}
		const destination = answer?.destination ?? null;
		if (!destination) return this.#gone(item);
		const now = new Date().toISOString();
		this.#feed.update(item.id, { read: item.read || now });
		const others = members.filter(member => member.id !== item.id && !member.read);
		if (others.length || item.group) {
			try {
				await this.#read(members, others);
				for (const member of members) this.#feed.update(member.id, { read: member.read || now, ...Actions.#settled(member) });
			} catch {
				// The opened item is read at its producer; the matter's other updates stay unread
			}
		}
		this.#changed();
		this.#onopen(destination, item);
	}

	async mark(items, read) {
		const ids = items.map(item => item.id);
		try {
			if (read) await this.#read(items, items);
			else await this.#whole('unreadGroup', items, () => this.#adapter.unread(ids));
		} catch {
			this.#say('update');
			return;
		}
		const now = new Date().toISOString();
		for (const item of items) this.#feed.update(item.id, read ? { read: now, ...Actions.#settled(item) } : { read: null, ...Actions.#reopened(item) });
		this.#changed();
	}

	/** Reads a matter: the whole of it through `readGroup`, else the unread `ids` one by one. */
	#read(items, unread) {
		const ids = unread.map(item => item.id);
		return this.#whole('readGroup', items, () => (ids.length ? this.#adapter.read(ids) : undefined));
	}

	/**
	 * Calls the adapter's `kind` (`readGroup` or `unreadGroup`) with the matter `{ product, group }` when it
	 * has it and the items are one matter with a group; otherwise, or when it fails (a relay or a Projects
	 * that does not answer by matter yet), `fallback`.
	 */
	async #whole(kind, items, fallback) {
		const [first] = items;
		const group = first?.group;
		if (group && typeof this.#adapter[kind] === 'function' && items.every(item => item.group === group && item.product === first.product)) {
			try {
				return await this.#adapter[kind]({ product: first.product, group });
			} catch {
				// Not answered by matter: the loaded updates instead
			}
		}
		return fallback();
	}

	/** A matter read whole has no unread update left. */
	static #settled(item) {
		return item.updates ? { updates: { ...item.updates, unread: 0 } } : {};
	}

	/** A matter made unread counts its updates unread again. */
	static #reopened(item) {
		return item.updates ? { updates: { ...item.updates, unread: item.updates.count ?? 1 } } : {};
	}

	/** Whether an adapter failure means the item is not (or no longer) visible to this person. */
	static gone(error) {
		const code = error?.code ?? error?.error ?? error?.status;
		return code === 'NOT_FOUND' || code === 'not_found' || code === 404;
	}

	#gone(item) {
		this.#feed.update(item.id, null);
		this.#say('gone');
		this.#changed();
	}
}
