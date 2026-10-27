/** Types of an organization as the family shows it, re-exported by `@beyond-js/ui/dom`: the descriptor's organization and its mark (0.40.0). */

/** One organization of the person; `url` (0.4.0) is the product's own arrival for it. */
export interface FamilyOrganization {
	id: string;
	name: string;
	role?: string;
	current?: boolean;
	url?: string;
	/** Its short name (0.40.0, D195), drawn only where two of the person's organizations share a name. */
	slug?: string;
	/** Its logo's address (0.40.0, D195): every row starts with its mark when one organization has a logo. */
	logo?: string;
}

/**
 * An organization's mark (D195, 0.40.0): the initial of its name with its logo (an `https:` address, an
 * image `data:` one, or `http:` on a loopback host) laid over it once it loads, removed when it fails.
 */
export class OrganizationMark {
	constructor(options: { name: string; picture?: string | null });
	readonly element: HTMLElement;
	/** The initial of the name, upper case; '' without a name. */
	static initial(name: string | null | undefined): string;
	/** Whether a mark would show this logo's address. */
	static shows(picture: string | null | undefined): boolean;
}
