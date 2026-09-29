/** Types of the family patterns (0.2.0), re-exported by `@beyond-js/ui/dom`: FamilyBar, ProductNav, Unavailable and availability. */
import type { Component, Content, Copy, Tone } from './dom.js';

/** Why a product entry is unavailable, as Beyond Projects reports it; other codes read "Not available". */
export type FamilyReason = 'UNCONFIGURED' | 'NOT_ADMITTED' | 'ARCHIVED' | (string & {});

/** One entry of the product menu. */
export interface FamilyProduct {
	product: string;
	url?: string | null;
	available: boolean;
	reason?: FamilyReason;
	mapped?: number;
}

/** The `beyond-family/1` descriptor a product relays from Beyond Projects (`GET /v1/family`). */
export interface FamilyDescriptor {
	protocol?: 'beyond-family/1';
	person?: { id?: string; name: string; email?: string; locale?: string } | null;
	organizations?: Array<{ id: string; name: string; role?: string; current?: boolean }>;
	organization?: { id: string; name: string; role?: string } | null;
	projects?: Array<{ id: string; name: string; current?: boolean }>;
	project?: { id: string; name: string } | null;
	products?: FamilyProduct[];
	links?: { home?: string; account?: string; members?: string; docs?: string };
	unavailable?: false;
}

/** The relay could not answer: the bar shows the product's `fallback` names. */
export interface FamilyUnavailable {
	unavailable: true;
}

/** Names the product knows itself, shown while the descriptor loads or is unavailable. */
export interface FamilyFallback {
	person?: string | { name: string; email?: string } | null;
	organization?: string | null;
	project?: string | null;
}

export interface FamilyNavigation {
	/** The link's `href` attribute as written. */
	href: string;
	/** The absolute address. */
	url: string;
	label: string;
}

export interface FamilyAccount {
	/** What signing out does: a callback, or a link. */
	signout?: (() => void) | { href: string } | null;
	/** The product's own entries, before Sign out. */
	items?: Array<{ label: string; href?: string | null; run?: (() => void) | null } | null | false>;
	/** Replaces "Sign out" for a product that asks how to leave. */
	label?: string | null;
}

/**
 * Labels of the family bar (English defaults): `header` "Beyond", `context` "Where you are", `open`/`close`
 * the toggle, `home` "Beyond home", `product` "Product: {name}. Change product", `products` "Products",
 * `entries` "This project in each product", `overview` "Project overview", `entry` "This project in {product}",
 * `area({ product })` the product's summary outside a project, `back` "Your organizations and projects",
 * `UNCONFIGURED` "Not set up here", `NOT_ADMITTED` "Not open to you yet", `ARCHIVED` "Project archived",
 * `unavailable` "Not available", `organization` "Organization: {name}. Change organization",
 * `organizations` "Organizations", `role({ role })`, `project` "Project: {name}. Change project",
 * `projects` "Projects of {organization}", `all` "All projects",
 * `location` "Location: {place}. Change organization or project", `loading` "Loading where you are",
 * `docs` "Docs", `account` "Account: {name}", `anonymous` "Account", `yours` "Your account",
 * `members` "Members of this organization", `signout` "Sign out".
 */
export type FamilyLabels = Copy;

export interface FamilyBarOptions {
	/** The current product id: `delegate`, `workspace`, `cdn`, `snapshots`, `conduict`, `projects`, `accounts`… */
	product: string;
	/** The wordmark asset the product carries, and its own home address (used without a descriptor). */
	brand: { src: string; href: string };
	descriptor?: FamilyDescriptor | FamilyUnavailable | null;
	fallback?: FamilyFallback | null;
	/** Display names by product id, added to the family's (never translated). */
	products?: Record<string, string>;
	notifications?: Node | null;
	account?: FamilyAccount;
	toggle?: { controls: string; expanded: boolean; onchange?: (expanded: boolean) => void } | null;
	onnavigate?: ((item: FamilyNavigation, event: MouseEvent) => void) | null;
	/** Reasons whose entries stay links when they carry an address (default `['NOT_ADMITTED']`). */
	advisory?: string[];
	labels?: FamilyLabels;
}

/** The family bar every signed-in product renders. */
export class FamilyBar extends Component {
	constructor(options: FamilyBarOptions);
	readonly state: 'loading' | 'unavailable' | 'ready';
	descriptor: FamilyDescriptor | FamilyUnavailable | null;
	set fallback(value: FamilyFallback | null);
	expanded: boolean;
}

export interface ProductNavItem {
	label: Content;
	href: string;
	current?: boolean;
}
/** A product's own navigation as a row of tabs under the family bar. */
export class ProductNav extends Component {
	constructor(options: { items?: Array<ProductNavItem | null | false>; label?: string | null; sticky?: boolean; onnavigate?: ((item: ProductNavItem, event: MouseEvent) => void) | null; labels?: { nav?: string } });
	set items(items: Array<ProductNavItem | null | false>);
}

export type UnavailableKind = 'access' | 'association' | 'capability';
export interface UnavailableOptions {
	title: Content;
	reason: Content;
	owner?: Content | null;
	action?: Node | null;
	secondary?: Node | null;
	kind?: UnavailableKind;
	code?: string | null;
	level?: 2 | 3 | 4 | 5 | 6;
	/** `owner`: "Who can change this: " */
	labels?: { owner?: string };
}
/** "Not available here", explained in place. */
export class Unavailable extends Component {
	constructor(options: UnavailableOptions);
	static level(value: unknown): 2 | 3 | 4 | 5 | 6;
}

export interface AvailabilityState {
	readonly key: 'available' | 'closed' | 'preparation' | 'planned' | 'retired';
	readonly label: string;
	readonly tone: Tone;
}
/** The family's one availability vocabulary, in order. */
export const availability: readonly AvailabilityState[];

/** The consequence a confirmation states under its message. */
export interface Consequence {
	lost?: Content | Content[] | null;
	kept?: Content | Content[] | null;
	recovery?: Content | Content[] | null;
}
