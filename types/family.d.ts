/** Types of the family patterns, re-exported by `@beyond-js/ui/dom`: FamilyBar, productNames (0.4.1), ProductNav, Unavailable and availability (`Sidebar` is in `sidebar.d.ts`). */
import type { Component, Content, Copy, Tone } from './dom.js';
import type { FamilyOrganization } from './organizations.js';

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
	/**
	 * `email` (0.13.0) heads the profile menu under the name; `avatar` (0.13.0, D81) is the person's
	 * picture, an `https:` or image `data:` address laid over the initials once it loads.
	 */
	person?: { id?: string; name: string; email?: string; locale?: string; avatar?: string } | null;
	organizations?: FamilyOrganization[];
	organization?: { id: string; name: string; role?: string } | null;
	/** `state: 'archived'` (0.16.1) marks an archived project in the menu. */
	projects?: Array<{ id: string; name: string; current?: boolean; here?: FamilyHere; state?: 'archived' | (string & {}) | null }>;
	/** `state: 'archived'` (0.16.1) draws an "Archived" mark beside the project's name. */
	project?: { id: string; name: string; state?: 'archived' | (string & {}) | null } | null;
	products?: FamilyProduct[];
	/**
	 * `leave` (0.5.0): the absolute address of Accounts' `/leave` page, with no query. `github` (0.7.4):
	 * Projects' GitHub section of the organization in view, complete as given; the profile menu offers it
	 * as "GitHub" to every member.
	 */
	links?: { home?: string; account?: string; members?: string; docs?: string; leave?: string; github?: string; manage?: FamilyManage };
	unavailable?: false;
}

/** The relay could not answer: the bar shows the product's `fallback` names. */
export interface FamilyUnavailable {
	unavailable: true;
}

/** Names the product knows itself, shown while the descriptor loads or is unavailable. */
export interface FamilyFallback {
	person?: string | { name: string; email?: string; avatar?: string } | null;
	organization?: string | null;
	project?: string | null;
	/** The person's organizations from the product's Accounts standing (0.4.0), for the organization menu without a descriptor. */
	organizations?: FamilyOrganization[] | null;
	/**
	 * Addresses used when the descriptor names none (all of them while it loads or is unavailable);
	 * `projects` (0.4.0) is the product's own projects page, the destination of "All projects".
	 */
	links?: { home?: string; account?: string; members?: string; docs?: string; projects?: string; leave?: string; github?: string; manage?: FamilyManage } | null;
}

/** One line at the top of the project menu (0.4.0), with an optional address and action. */
export interface FamilyNotice {
	text: string;
	href?: string | null;
	action?: { label: string; href?: string | null; run?: (() => void) | null } | null;
	/** The notice says an outage (0.44.0, D132): the warning tone and the outage's mark, and with `moments` (from `Again` or React's `useAgain`) "Last tried {time}" under its words. */
	outage?: true | FamilyOutage | null;
}

/** When an outage the bar's notice says last tried (0.44.0): `AgainLine`'s words in `locale`, `labels` its `AgainLine.labels.es` for Spanish. */
export interface FamilyOutage {
	moments?: Pick<import('./again.js').AgainMoments, 'active' | 'trying' | 'last' | 'offline'> | null;
	locale?: string;
	labels?: import('./notifications.js').Copy;
}

export interface FamilyNavigation {
	/** The link's `href` attribute as written. */
	href: string;
	/** The absolute address. */
	url: string;
	label: string;
}

/**
 * Signing out of Beyond (0.5.0, Q09): `before()` may cancel (a product holding unsaved work returns
 * false), `end()` ends the product's own session under `bound` ms (5000; a failure or no answer does
 * not block), then the bar goes to `links.leave` with `product` and `return`; without that address it
 * calls `after()`, the product's own signed-out page.
 */
export interface FamilySignout {
	end?: (() => unknown) | null;
	before?: (() => boolean | void | Promise<boolean | void>) | null;
	after?: (() => unknown) | null;
	bound?: number;
}

export interface FamilyAccount {
	/** What signing out does: `{ end, before, after }` (0.5.0), or the earlier callback or link. */
	signout?: FamilySignout | (() => void) | { href: string } | null;
	/** The product's own entries, before Sign out. */
	items?: Array<{ label: string; href?: string | null; run?: (() => void) | null } | null | false>;
	/** Replaces "Sign out" for a product that asks how to leave. */
	label?: string | null;
	/** "Language and appearance" first in the product's group, opening one `PreferencesDialog` (0.6.0, D54). */
	preferences?: import('./page.js').FamilyPreferences | null;
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
 * Since 0.5.0: `signout` "Sign out of Beyond", `leaving` "Signing out…".
 */
export type FamilyLabels = Copy;

export interface FamilyBarOptions {
	/** The current product id: `delegate`, `workspace`, `cdn`, `snapshots`, `conduict`, `projects`, `accounts`… */
	product: string;
	/** The wordmark asset the product carries, and its own home address (used without a descriptor). */
	brand: { src: string; href: string };
	/** `{ context: 'none' }` (0.15.0): nothing to load, no placeholder; null loads for `bound` milliseconds at most. */
	descriptor?: FamilyDescriptor | FamilyUnavailable | FamilyNone | null;
	fallback?: FamilyFallback | null;
	/** False for a product without projects (Accounts): no project crumb or chooser (0.15.0). */
	projects?: boolean;
	/** Milliseconds a null descriptor is drawn as loading before it is drawn as unavailable (0.15.0; default 15000, 0 for never). */
	bound?: number;
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

/** A product with no place to load yet (0.15.0, PKG-14): the bar draws no placeholder. */
export interface FamilyNone {
	context: 'none';
}

/** The id of a product of the family, as `productNames` keys it (`packages` since 0.15.0). */
export type FamilyProductId = 'projects' | 'packages' | 'workspace' | 'delegate' | 'cdn' | 'snapshots' | 'conduict' | 'accounts' | 'home' | 'desktop' | 'docs';

/**
 * Display names by product id: every family product is named. It is a `Record<string, string>`, so it
 * passes as any component's `products` option; an id outside the family reads as absent at run time.
 */
export type FamilyProductNames = Readonly<Record<FamilyProductId, string>> & Readonly<Record<string, string>>;

/**
 * The family's display names of its products by id (0.4.1), never translated: the names the family
 * bar draws. A product names another one with them instead of keeping its own copy. Frozen.
 */
export const productNames: FamilyProductNames;

/** The family bar every signed-in product renders. */
export class FamilyBar extends Component {
	/** The copy in English and Spanish (0.7.2). */
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	constructor(options: FamilyBarOptions);
	/** The bar an element draws (0.16.0). */
	static of(element: Element | null): FamilyBar | null;
	/** A region of the product's own the menu button opens (0.16.0, a merged sidebar), or null. */
	set toggle(value: { controls: string; expanded?: boolean; onchange?: (expanded: boolean) => void } | null);
	readonly state: 'loading' | 'unavailable' | 'none' | 'ready';
	descriptor: FamilyDescriptor | FamilyUnavailable | FamilyNone | null;
	set fallback(value: FamilyFallback | null);
	/** `notice` replaces the project menu's notice (0.4.0). */
	notice: FamilyNotice | null;
	/** Replaces the wordmark and home address in place, keeping an open menu (0.17.1). */
	set brand(value: FamilyBarOptions['brand']);
	/** Replaces the account menu's options in place, keeping an open menu (0.17.1). */
	set account(value: NonNullable<FamilyBarOptions['account']>);
	expanded: boolean;
}


export interface ProductNavItem {
	label: Content;
	href: string;
	current?: boolean;
}
/** A product's own navigation as a row of tabs under the family bar. */
export class ProductNav extends Component {
	/** The copy in English and Spanish (0.7.2). */
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	constructor(options: { items?: Array<ProductNavItem | null | false>; label?: string | null; sticky?: boolean; onnavigate?: ((item: ProductNavItem, event: MouseEvent) => void) | null; labels?: { nav?: string } });
	set items(items: Array<ProductNavItem | null | false>);
	/** Which ends of the row hold tabs it does not show (0.15.0): a fade and a chevron say so. */
	readonly more: Array<'start' | 'end'>;
}

/** `outage` (0.15.0): a service that does not answer, drawn with a globe, never as a denial. */
export type UnavailableKind = 'access' | 'association' | 'capability' | 'outage';
/** Technical details of a failure or a refusal (D43, 0.15.0): the request identifier and the time, copyable. */
export interface FailureDetails { request?: string | null; time?: string | number | Date | null; text?: string; locale?: string; labels?: Copy }
export interface UnavailableOptions {
	title: Content;
	reason: Content;
	owner?: Content | null;
	action?: Node | null;
	secondary?: Node | null;
	kind?: UnavailableKind;
	code?: string | null;
	level?: 2 | 3 | 4 | 5 | 6;
	/** Technical details shown closed under it (0.15.0, D43). */
	details?: FailureDetails | null;
	/** An outage's read, or `Again`'s options: it tries again by itself and says when it last tried (0.17.1, D132); ignored for every other kind. */
	again?: (() => Promise<unknown>) | import('./again.js').AgainOptions | null;
	/** The language of the line's time of day (0.17.1). */
	locale?: string;
	/** `owner`: "Who can change this: "; `retry`, `tried`, `trying` (0.17.1) */
	labels?: { owner?: string; retry?: string; tried?: string; trying?: string };
}
/** "Not available here", explained in place. */
export class Unavailable extends Component {
	/** The copy in English and Spanish (0.7.1). */
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	constructor(options: UnavailableOptions);
	/** The technical details shown, or null (0.15.0). */
	readonly details: import('./dom.js').TechnicalDetails | null;
	/** What tries an outage again, or null (0.17.1). */
	readonly again: import('./again.js').Again | null;
	static level(value: unknown): 2 | 3 | 4 | 5 | 6;
}

export interface AvailabilityState {
	readonly key: 'available' | 'closed' | 'preparation' | 'planned' | 'retired';
	readonly label: string;
	readonly tone: Tone;
	/** The label in English and Spanish (0.7.2) */
	readonly labels: { readonly en: string; readonly es: string };
}
/** The family's one availability vocabulary, in order. */
export const availability: readonly AvailabilityState[];

/** The consequence a confirmation states under its message. */
export interface Consequence {
	/** The work it affects: running conversations, deliveries in progress (0.7.2) */
	affected?: Content | Content[] | null;
	lost?: Content | Content[] | null;
	kept?: Content | Content[] | null;
	/** What keeps being charged (0.7.2) */
	costing?: Content | Content[] | null;
	recovery?: Content | Content[] | null;
}
/** The consequence list for a product's own confirmation dialog (0.7.2); null when nothing is stated. */
export function consequence(parts: Consequence | null, labels?: Copy): HTMLElement | null;
export namespace consequence {
	const order: readonly ['affected', 'lost', 'kept', 'costing', 'recovery'];
	const labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
}
