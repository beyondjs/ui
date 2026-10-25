/**
 * Who says "You're offline" among a page's outage notices (0.33.0). Offline is one cause for every read
 * of the page, so it is one incident, said once (D163): of the notices that wait for an answer and are
 * reached over the network, the first in the document's order says it, and the others wait hidden until
 * the browser is online again, when each says its own cause. A notice joins with the redraw it runs when
 * that choice may have changed.
 */
export class OfflineVoice {
	static #notices = new Map();

	/** Adds a notice (`{ element, size, local }`) and its redraw. */
	static join(notice, redraw) {
		OfflineVoice.#notices.set(notice, redraw);
	}

	/** Removes a notice; the others redraw, since one of them may speak now. */
	static leave(notice) {
		if (OfflineVoice.#notices.delete(notice)) OfflineVoice.tell(notice);
	}

	/** Whether `notice` is the one that says the page is offline. */
	static speaks(notice) {
		const waiting = [...OfflineVoice.#notices.keys()].filter(item => item.size && !item.local);
		// The document's order among notices on the page, then the order they were made
		const placed = waiting.filter(item => item.element.isConnected);
		const first = placed.reduce((best, item) => (best && best.element.compareDocumentPosition(item.element) & 2 ? item : best ?? item), null) ?? waiting[0];
		return first === notice;
	}

	/** Redraws every notice but `source`, after `source` changed what it waits for. */
	static tell(source = null) {
		for (const [notice, redraw] of OfflineVoice.#notices) if (notice !== source) redraw();
	}
}
