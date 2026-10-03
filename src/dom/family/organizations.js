import { entry } from './menu.js';

/**
 * The person's organizations as the bar shows them (decision D03: changing organization without
 * leaving the product).
 *
 * They come from the descriptor when it is ready, and from the product's `fallback.organizations`
 * (read from its Accounts standing) while it loads or is unavailable, so the organization menu works
 * without Beyond Projects. One organization is shown as its name alone; several make a menu headed
 * "Organizations", each row with its role. A row goes to `url`, the product's own arrival for that
 * organization, when the product declared one; otherwise to the organization in Projects, and the
 * row says "Opens in Beyond Projects". With no organization in view there is no location at all.
 */
export class Organizations {
	#list;
	#current;
	#places;
	#labels;

	/**
	 * @param {object} options
	 * @param {object|null} options.descriptor the descriptor when ready
	 * @param {{organization?: string|null, organizations?: Array<object>|null}} options.fallback
	 * @param {import('./places.js').Places} options.places
	 * @param {import('../core/labels.js').Labels} options.labels
	 */
	constructor({ descriptor, fallback, places, labels }) {
		this.#places = places;
		this.#labels = labels;
		const source = descriptor ? descriptor.organizations : fallback?.organizations;
		this.#list = (Array.isArray(source) ? source : []).filter(item => item && item.id && item.name);
		this.#current = descriptor ? Organizations.#view(descriptor.organization, this.#list) : Organizations.#guess(fallback, this.#list);
	}

	/** The organization in view (`{ id?, name, role? }`), or null. */
	get current() {
		return this.#current;
	}

	/** Whether the person has several organizations to choose among (a menu rather than a name). */
	get several() {
		return this.#list.length > 1;
	}

	/** Whether the person has any organization at all. */
	get any() {
		return this.#list.length > 0 || Boolean(this.#current);
	}

	/** A new section listing the organizations, for the organization or location menu (empty when none are known). */
	section() {
		const current = this.#current?.id ?? null;
		return {
			heading: this.#labels.text(this.several ? 'organizations' : 'single'),
			items: this.#list.map(item => this.#row(item, item.id === current))
		};
	}

	#row(item, current) {
		const labels = this.#labels;
		const role = item.role ? labels.text('role', { role: item.role }) : null;
		const own = typeof item.url === 'string' && item.url;
		const meta = own ? role : [role, labels.text('beyond')].filter(Boolean).join(' · ');
		return entry({ label: item.name, meta: meta || null, href: own ? item.url : this.#places.organization(item.id), current: current ? 'true' : null });
	}

	/** The descriptor's organization in view, with its role from the list when it lacks one. */
	static #view(organization, list) {
		if (!organization?.name) return null;
		const listed = list.find(item => item.id === organization.id);
		return { ...organization, role: organization.role ?? listed?.role ?? null };
	}

	/** Without a descriptor: the fallback organization marked current, else the name the product gave. */
	static #guess(fallback, list) {
		const marked = list.find(item => item.current);
		if (marked) return marked;
		const name = typeof fallback?.organization === 'string' ? fallback.organization : null;
		if (!name) return null;
		return list.find(item => item.name === name) ?? { name };
	}
}
