/**
 * Accounts' management addresses completed with the way back to the product (`links.manage`).
 *
 * Projects relays Accounts addresses without `product` or `return`; the bar completes each one with
 * `product=<the bar's product>` and `return=<the address the person is on>`, so Accounts shows
 * "Return to {product}" and brings the person back to the same place. The return address drops the
 * transient parameters first: `returned` and `from`, dialog markers (`dialog` and the product's own,
 * `transient`), and `project` or `organization` when the path already carries the same value (an
 * arrival such as `/o/org_1/apps?organization=org_1`). It then adds `returned=accounts`, which tells
 * the product to read the person's standing at Accounts again once. Accounts validates the return
 * against the product's origins; the bar decides nothing.
 */
export class Manage {
	static #always = ['returned', 'from', 'dialog'];
	static #context = ['project', 'organization'];

	#links;
	#product;
	#transient;

	/**
	 * @param {{links: Record<string, string>|null, product: string, transient?: string[]}} options
	 */
	constructor({ links, product, transient = [] }) {
		this.#links = links ?? null;
		this.#product = product;
		this.#transient = [...Manage.#always, ...transient.filter(key => typeof key === 'string' && key)];
	}

	/** Whether the descriptor (or the product's fallback) gave management addresses. */
	get present() {
		return Boolean(this.#links);
	}

	has(key) {
		return Boolean(this.#links?.[key]);
	}

	/** The address of `key` completed for the current page, or null when it is not given. */
	address(key, location = globalThis.location) {
		const base = this.#links?.[key];
		if (!base) return null;
		try {
			const url = new URL(base, globalThis.document?.baseURI);
			url.searchParams.set('product', this.#product);
			if (location?.href) url.searchParams.set('return', this.back(location.href));
			return url.href;
		} catch {
			return null;
		}
	}

	/** The address to come back to: `href` without its transient parameters, with `returned=accounts`. */
	back(href) {
		const url = new URL(this.clean(href));
		url.searchParams.set('returned', 'accounts');
		return url.href;
	}

	/**
	 * `href` without its transient parameters: `returned`, `from`, dialog markers and a `project` or
	 * `organization` the path already carries. Signing out of Beyond returns here (since 0.5.0).
	 */
	clean(href) {
		const url = new URL(href);
		for (const key of this.#transient) url.searchParams.delete(key);
		const segments = `${url.pathname}/${url.hash}`.split(/[/#?&=]/).filter(Boolean).map(Manage.#decode);
		for (const key of Manage.#context) {
			const value = url.searchParams.get(key);
			if (value && segments.includes(value)) url.searchParams.delete(key);
		}
		return url.href;
	}

	static #decode(segment) {
		try {
			return decodeURIComponent(segment);
		} catch {
			return segment;
		}
	}
}
