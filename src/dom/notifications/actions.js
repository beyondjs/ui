/**
 * What a person can do with shown notifications: open one and mark some read or unread.
 *
 * Opening asks the adapter, which rechecks access at the producer and marks the item read, and then
 * hands the destination to the product (`onopen`). An item that is no longer visible — access was
 * revoked or the resource is gone — is removed with a plain message instead of opening. Marking is
 * idempotent and never a business action. Every outcome ends in `changed`, which redraws.
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

	async open(item) {
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
		this.#feed.update(item.id, { read: item.read || new Date().toISOString() });
		this.#changed();
		this.#onopen(destination, item);
	}

	async mark(items, read) {
		const ids = items.map(item => item.id);
		try {
			if (read) await this.#adapter.read(ids);
			else await this.#adapter.unread(ids);
		} catch {
			this.#say('update');
			return;
		}
		for (const id of ids) this.#feed.update(id, { read: read ? new Date().toISOString() : null });
		this.#changed();
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
