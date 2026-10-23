/**
 * The keyboard of a block of lanes (0.22.0): one lane in the tab order (a roving tabindex), and the
 * arrows between lanes. The lane in the tab order is the one that holds focus, else the current one (the
 * lane whose detail is open), else the one focused last, else the first. ArrowDown and ArrowUp move to the
 * next and previous lane and Home and End to the first and last, without wrapping; Enter and Space are
 * each lane's own, as a button. It never moves focus by itself: only a key the person pressed does.
 */
export class LaneKeys {
	#list;
	#lanes;
	#stop = null;

	/**
	 * @param {HTMLElement} list the element that holds the lanes
	 * @param {{lanes: () => Array<import('./lane.js').Lane>}} options the lanes in their order
	 */
	constructor(list, { lanes }) {
		this.#list = list;
		this.#lanes = lanes;
		list.addEventListener('keydown', event => this.#press(event));
		list.addEventListener('focusin', event => this.#enter(event));
	}

	/** Makes `lane` the one in the tab order. */
	set stop(lane) {
		this.#stop = lane?.key ?? null;
		this.settle();
	}

	/** Gives the tab order to one lane again, after the lanes or their current one changed. */
	settle() {
		const lanes = this.#lanes();
		const active = this.#list.ownerDocument.activeElement;
		const stop = lanes.find(lane => lane.element === active) ?? lanes.find(lane => lane.current) ?? lanes.find(lane => lane.key === this.#stop) ?? lanes[0] ?? null;
		this.#stop = stop?.key ?? null;
		for (const lane of lanes) {
			const index = lane === stop ? '0' : '-1';
			if (lane.element.getAttribute('tabindex') !== index) lane.element.setAttribute('tabindex', index);
		}
	}

	#press(event) {
		if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
		const lanes = this.#lanes();
		const index = lanes.findIndex(lane => lane.element === event.target);
		const goal = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: lanes.length - 1 }[event.key];
		if (index < 0 || goal === undefined) return;
		event.preventDefault();
		const lane = lanes[Math.min(Math.max(goal, 0), lanes.length - 1)];
		if (lane === lanes[index]) return;
		this.#stop = lane.key;
		this.settle();
		lane.focus();
	}

	#enter(event) {
		const lane = this.#lanes().find(item => item.element === event.target);
		if (!lane || lane.key === this.#stop) return;
		this.#stop = lane.key;
		this.settle();
	}
}
