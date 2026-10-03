/** Types of the family patterns, re-exported by `@beyond-js/ui/dom`: FamilyBar, productNames (0.4.1), ProductNav, Sidebar (0.4.0), Unavailable and availability. */
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

/**
 * A project's state in the product that relays the descriptor, as the product annotates it: `used`
 * (no mark), `unset` ("Not set up in {product}"), `denied` ("No access in {product}") or `only` (a row
 * the product adds, grouped as "Only in {product}"). Other values show no mark.
 */
export type FamilyProjectState = 'used' | 'unset' | 'denied' | 'only' | (string & {});

/** `projects[i].here` (0.4.0): the project in the relaying product. */
export interface FamilyHere {
	/** The product's own mappings of the project (Projects); without `state`, more than 0 is `used` and 0 `unset`. */
	mapped?: number;
	/** The product's arrival for the project; the row links here. */
	url?: string;
	/** Written by the product before passing the descriptor to the bar. */
	state?: FamilyProjectState;
}

/** One organization of the person; `url` (0.4.0) is the product's own arrival for it. */
export interface FamilyOrganization {
	id: string;
	name: string;
	role?: string;
	current?: boolean;
	url?: string;
}

/** Accounts' management addresses (0.4.0), without `product` or `return`: the bar completes them. */
export interface FamilyManage {
	account?: string;
	organizations?: string;
	create?: string;
	members?: string;
	invitations?: string;
	settings?: string;
}

/** The `beyond-family/1` descriptor a product relays from Beyond Projects (`GET /v1/family`). */
export interface FamilyDescriptor {
	protocol?: 'beyond-family/1';
	person?: { id?: string; name: string; email?: string; locale?: string } | null;
	organizations?: FamilyOrganization[];
	organization?: { id: string; name: string; role?: string } | null;
	projects?: Array<{ id: string; name: string; current?: boolean; here?: FamilyHere }>;
	project?: { id: string; name: string } | null;
	products?: FamilyProduct[];
	links?: { home?: string; account?: string; members?: string; docs?: string; manage?: FamilyManage };
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
	/** The person's organizations from the product's Accounts standing (0.4.0), for the organization menu without a descriptor. */
	organizations?: FamilyOrganization[] | null;
	/**
	 * Addresses used when the descriptor names none (all of them while it loads or is unavailable);
	 * `projects` (0.4.0) is the product's own projects page, the destination of "All projects".
	 */
	links?: { home?: string; account?: string; members?: string; docs?: string; projects?: string; manage?: FamilyManage } | null;
}

/** One line at the top of the project menu (0.4.0), with an optional address and action. */
export interface FamilyNotice {
	text: string;
	href?: string | null;
	action?: { label: string; href?: string | null; run?: (() => void) | null } | null;
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
 * `members` "Members of this organization", `signout` "Sign out". Since 0.4.0: `UNCONFIGURED` "Not offered here",
 * `all` "All projects of {organization}", `single` "Organization", `beyond` "Opens in Beyond Projects",
 * `choose` "Choose a project", `none` "{organization} has no projects yet", `search` "Search projects",
 * `nomatch` 'No projects match "{query}"', `find` "Search all projects of {organization}",
 * `unset` "Not set up in {product}", `denied` "No access in {product}", `only` "Only in {product}",
 * `access` "Account and sign-in", `mine` "Your organizations", `create` "Create an organization",
 * `group` "{organization} · {role}", `team` "Members and invitations", `settings` "Organization settings".
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
	/** One line at the top of the project menu (0.4.0). */
	notice?: FamilyNotice | null;
	/** The product's own dialog markers, left out of the address Accounts returns to (0.4.0). */
	transient?: string[];
	labels?: FamilyLabels;
}

/** The id of a product of the family, as `productNames` keys it. */
export type FamilyProductId = 'projects' | 'workspace' | 'delegate' | 'cdn' | 'snapshots' | 'conduict' | 'accounts' | 'desktop' | 'docs';

/** Display names by product id: every family product is named; any other id may be absent. */
export type FamilyProductNames = { readonly [id in FamilyProductId]: string } & { readonly [id: string]: string | undefined };

/**
 * The family's display names of its products by id (0.4.1), never translated: the names the family
 * bar draws. A product names another one with them instead of keeping its own copy. Frozen.
 */
export const productNames: FamilyProductNames;

/** The family bar every signed-in product renders. */
export class FamilyBar extends Component {
	constructor(options: FamilyBarOptions);
	readonly state: 'loading' | 'unavailable' | 'ready';
	descriptor: FamilyDescriptor | FamilyUnavailable | null;
	set fallback(value: FamilyFallback | null);
	/** Replaces the project menu's notice (0.4.0). */
	notice: FamilyNotice | null;
	expanded: boolean;
}

/** One link of a product's sidebar. */
export interface SidebarItem {
	label: Content;
	href?: string | null;
	current?: boolean;
	/** A short count or note at the row's end. */
	meta?: string | number | null;
}
export interface SidebarGroup {
	heading?: Content | null;
	items: Array<SidebarItem | null | false>;
}
export interface SidebarOptions {
	/** The product's display name: the drawer's heading and its name, "{product} sections". */
	product: string;
	groups?: SidebarGroup[];
	/** What the sections belong to, as text: `"Storefront"` or `{ label: 'Project', name: 'Storefront' }`. */
	context?: string | { label?: string | null; name: string } | Node | null;
	/** The narrowest width, in CSS pixels, with a permanent sidebar (default 1024). */
	cut?: number;
	/** The row's text below the cut; the current item's label by default. */
	section?: string | null;
	onnavigate?: ((item: FamilyNavigation, event: MouseEvent) => void) | null;
	/** `sections` "{product} sections", `close` "Close". */
	labels?: { sections?: string; close?: string };
}
/** A product's own sections (0.4.0): permanent above the cut, a product row and a modal drawer below it. */
export class Sidebar extends Component {
	constructor(options: SidebarOptions);
	readonly mode: 'permanent' | 'drawer';
	/** Whether the drawer is open. */
	readonly expanded: boolean;
	set groups(value: SidebarGroup[]);
	set context(value: SidebarOptions['context']);
	set section(value: string | null);
	open(): void;
	close(): void;
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
