/**
 * What a person can do with shown notifications: open one and mark some read or unread.
 *
 * Opening asks the adapter, which rechecks access at the producer and marks the item read, and then
 * hands the destination to the product (`onopen`). An item that is no longer visible — access was
 * revoked or the resource is gone — is removed with a plain message instead of opening. Marking is
 * idempotent and never a business action. Every outcome ends in `changed`, which redraws.
 *
 * Since 0.15.0 (X-07) a whole matter is read at once when the adapter has `readGroup(group, { product })`
 * (Beyond Projects' `POST /v1/notifications/read` with `{ group, product }`): opening a matter, or marking
 * it read, reads every update of it, also those no page has loaded. Without it, or when it fails, the
 * loaded updates are marked one by one as before.
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
			else await this.#adapter.unread(ids);
		} catch {
			this.#say('update');
			return;
		}
		const now = new Date().toISOString();
		for (const item of items) this.#feed.update(item.id, read ? { read: now, ...Actions.#settled(item) } : { read: null });
		this.#changed();
	}

	/**
	 * Reads a matter: the whole of it through `readGroup` when the adapter has it and the items share one
	 * group, else `ids` one by one; a failed `readGroup` falls back to the ids.
	 */
	async #read(items, unread) {
		const [first] = items;
		const group = first?.group;
		if (group && typeof this.#adapter.readGroup === 'function' && items.every(item => item.group === group && item.product === first.product)) {
			try {
				return await this.#adapter.readGroup(group, { product: first.product });
			} catch {
				// The relay or Projects does not read by matter yet: the loaded updates instead
			}
		}
		const ids = unread.map(item => item.id);
		if (ids.length) await this.#adapter.read(ids);
	}

	/** A matter read whole has no unread update left. */
	static #settled(item) {
		return item.matter ? { matter: { ...item.matter, unread: 0 } } : {};
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
