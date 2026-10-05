/**
 * The addresses the family bar links to, derived from the `beyond-family/1` descriptor.
 *
 * Nothing here grants anything: every address is navigation with context, and the destination signs
 * the person in and rechecks access. The links are the descriptor's, and each one it lacks (all of
 * them while it loads or is unavailable) comes from the product's `fallback.links`. Home is
 * `links.home` (Beyond Projects), or the product's own `brand.href` when neither names it.
 *
 * A project row goes to `here.url`, the address the relaying product gave for that project, when it
 * has one; otherwise to the current product's entry with `project=<id>` when that entry is available
 * (or its reason is advisory), inside a project or outside one; otherwise to the project in Projects. "All projects" goes to the product's own
 * projects page (`fallback.links.projects`) and only without one to the organization in Projects.
 * "Project overview" is Projects' page for the project, offered in every product but Projects.
 */
export class Places {
	static #keys = ['home', 'account', 'members', 'docs', 'projects', 'leave', 'github'];

	#descriptor;
	#brand;
	#product;
	#advisory;
	#links;

	/**
	 * @param {{descriptor: object|null, brand: {href: string}, product: string, advisory: string[], fallback?: object}} options
	 */
	constructor({ descriptor, brand, product, advisory, fallback = {} }) {
		this.#descriptor = descriptor && !descriptor.unavailable ? descriptor : null;
		const own = Places.#addresses(this.#descriptor?.links);
		this.#links = { ...Places.#addresses(fallback), ...own };
		const manage = Places.#manage(this.#descriptor?.links?.manage) ?? Places.#manage(fallback?.manage);
		if (manage) this.#links.manage = manage;
		this.#brand = brand;
		this.#product = product;
		this.#advisory = advisory;
	}

	get home() {
		return this.#links.home ?? this.#brand.href;
	}

	/** The product's own home (`brand.href`). */
	get own() {
		return this.#brand.href;
	}

	/**
	 * The addresses in effect: `home`, `account`, `members`, `docs`, `projects`, `leave` (Accounts'
	 * `/leave`, since 0.5.0), `github` (Projects' GitHub section of the organization in view, since 0.7.4)
	 * and `manage` when known.
	 */
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

	/** "All projects of the organization": the product's own projects page, else the organization in Projects. */
	catalog(id) {
		return this.#links.projects ?? this.organization(id);
	}

	/**
	 * Projects' page for the project in view ("Project overview"), or null. Null in Projects itself,
	 * where that page is the one the person is already on.
	 */
	get overview() {
		if (this.#product === 'projects') return null;
		const item = (this.#descriptor?.products ?? []).find(entry => entry.product === 'projects' && entry.url);
		return item?.url ?? null;
	}

	/**
	 * One project: `here.url` when given; in the current product when its entry is open, inside a
	 * project or outside one (its address with `project=<id>`: every signed-in product accepts that
	 * arrival, so choosing a project never leaves the product); otherwise in Projects.
	 */
	project(id, here = null) {
		if (typeof here?.url === 'string' && here.url) return here.url;
		const products = this.#descriptor?.products ?? [];
		const own = products.find(item => item.product === this.#product && this.open(item));
		const projects = products.find(item => item.product === 'projects' && item.url && Places.#carries(item.url));
		const base = own ?? projects;
		return Places.#with(base ? base.url : this.home, { project: id });
	}

	/** The given addresses that are set, of the keys the bar uses. */
	static #addresses(links) {
		const known = Places.#keys.map(key => [key, links?.[key]]);
		return Object.fromEntries(known.filter(([, value]) => typeof value === 'string' && value));
	}

	/** Accounts' management addresses that are set, or null when there are none. */
	static #manage(links) {
		if (!links || typeof links !== 'object') return null;
		const set = Object.entries(links).filter(([, value]) => typeof value === 'string' && value);
		return set.length ? Object.fromEntries(set) : null;
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
