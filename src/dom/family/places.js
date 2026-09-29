/**
 * The addresses the family bar links to, derived from the `beyond-family/1` descriptor.
 *
 * Nothing here grants anything: every address is navigation with context, and the destination signs
 * the person in and rechecks access. The links are the descriptor's, and each one it lacks (all of
 * them while it loads or is unavailable) comes from the product's `fallback.links`. Home is
 * `links.home` (Beyond Projects), or the product's own `brand.href` when neither names it. Choosing a project goes to the current product's entry for it
 * when that entry is available (or its reason is advisory), otherwise to the project in Projects.
 */
export class Places {
	#descriptor;
	#brand;
	#product;
	#advisory;
	#links;

	/**
	 * @param {{descriptor: object|null, brand: {href: string}, product: string, advisory: string[], fallback?: {home?: string, account?: string, members?: string, docs?: string}}} options
	 */
	constructor({ descriptor, brand, product, advisory, fallback = {} }) {
		this.#descriptor = descriptor && !descriptor.unavailable ? descriptor : null;
		const own = Object.entries(this.#descriptor?.links ?? {}).filter(([, value]) => value);
		this.#links = { ...Places.#addresses(fallback), ...Object.fromEntries(own) };
		this.#brand = brand;
		this.#product = product;
		this.#advisory = advisory;
	}

	get home() {
		return this.#links.home ?? this.#brand.href;
	}

	get links() {
		return this.#links;
	}

	/** Whether an entry is followed: available, or unavailable for an advisory reason, with an address. */
	open(item) {
		return Boolean(item?.url) && (item.available !== false || this.#advisory.includes(item.reason));
	}

	/** Projects home for one organization. */
	organization(id) {
		return Places.#with(this.home, { organization: id });
	}

	/** One project: in the current product when its entry is open, otherwise in Projects. */
	project(id) {
		const products = this.#descriptor?.products ?? [];
		const own = products.find(item => item.product === this.#product && this.open(item) && Places.#carries(item.url));
		const projects = products.find(item => item.product === 'projects' && item.url && Places.#carries(item.url));
		const base = own ?? projects;
		return Places.#with(base ? base.url : this.home, { project: id });
	}

	/** The fallback's addresses that are set, of the keys the bar uses. */
	static #addresses(links) {
		const known = ['home', 'account', 'members', 'docs'].map(key => [key, links?.[key]]);
		return Object.fromEntries(known.filter(([, value]) => typeof value === 'string' && value));
	}

	static #carries(address) {
		try {
			return new URL(address, globalThis.document?.baseURI).searchParams.has('project');
		} catch {
			return false;
		}
	}

	static #with(address, values) {
		const url = new URL(address, globalThis.document?.baseURI);
		for (const [key, value] of Object.entries(values)) url.searchParams.set(key, value);
		return url.href;
	}
}
