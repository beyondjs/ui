/**
 * The tabs of one product, and the sign-in window's landing, telling each other that a session was
 * renewed (`beyond-session`, same origin only). Only `renewed` for this product, or for no product
 * named, is heard; the message carries no credential, so the hearer reads its own session.
 */
export class Channel {
	#channel = null;
	#product;

	/**
	 * @param {Window|null} view
	 * @param {string} product
	 * @param {() => void} onrenewed
	 */
	constructor(view, product, onrenewed) {
		this.#product = product;
		if (typeof view?.BroadcastChannel !== 'function') return;
		this.#channel = new view.BroadcastChannel('beyond-session');
		this.#channel.onmessage = event => {
			const data = event.data;
			if (data?.type === 'beyond-session' && data.outcome === 'renewed' && (!data.product || data.product === product)) onrenewed();
		};
	}

	post() {
		this.#channel?.postMessage({ type: 'beyond-session', outcome: 'renewed', product: this.#product });
	}

	close() {
		this.#channel?.close();
		this.#channel = null;
	}
}
