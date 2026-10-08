/** Types of the shared `Sidebar` (0.4.0; entries, search and a top action since 0.10.0), re-exported by `@beyond-js/ui/dom`. */
import type { Component, Content, Copy } from './dom.js';
import type { FamilyNavigation } from './family.js';
import type { IconName } from './icons.js';

/** One link of a product's sidebar. */
export interface SidebarItem {
	label: Content;
	href?: string | null;
	current?: boolean;
	/** A short count or note at the row's end. */
	meta?: string | number | null;
	/** Matches the link across updates (else `href`, else the label). */
	key?: string;
}
/** At most one mark in words of an entry (D47), such as "Needs you" or "Failed". */
export interface SidebarMark {
	label: string;
	tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'progress';
}
/** One of a product's own items, such as a conversation: its title on one line, cut only while shown whole on hover and focus. */
export interface SidebarEntry {
	key?: string;
	label: string;
	href: string;
	current?: boolean;
	mark?: SidebarMark | null;
}
/** A group of sections, as since 0.4.0. */
export interface SidebarGroup {
	kind?: 'sections';
	key?: string;
	heading?: Content | null;
	items: Array<SidebarItem | null | false>;
}
/** A group of entries (0.10.0): "Needs you", "Pinned", "Recent", with a `more` link ("All conversations"). */
export interface SidebarEntries {
	kind: 'entries';
	key?: string;
	heading?: Content | null;
	items: Array<SidebarEntry | null | false>;
	more?: { label: string; href: string } | null;
}
/** A top link, such as "New conversation" (0.10.0). */
export interface SidebarAction {
	label: string;
	href: string;
	/** A catalog glyph shown with the label (`plus` by default). */
	glyph?: IconName;
}
/** A bounded search of the product's entries (0.10.0); results replace the groups while a query is typed. */
export interface SidebarSearchOptions {
	/** The field's accessible name ("Search conversations"). */
	label: string;
	placeholder?: string | null;
	/** Answers the entries for a query: an array, or `{ items }`. Aborted past `bound`. */
	source: (request: { query: string; signal: AbortSignal }) => Promise<SidebarEntry[] | { items: SidebarEntry[] }>;
	/** Milliseconds the source may take (20000, D40). */
	bound?: number;
	/** Milliseconds after typing before asking (250). */
	delay?: number;
	/** The address of every result for a query ("See all results"; Enter in the field opens it). */
	all?: ((query: string) => string | null) | null;
}
export interface SidebarOptions {
	/** The product's display name: the drawer's heading and its name, "{product} sections". */
	product: string;
	groups?: Array<SidebarGroup | SidebarEntries>;
	/** What the sections belong to, as text: `"Storefront"` or `{ label: 'Project', name: 'Storefront' }`. */
	context?: string | { label?: string | null; name: string } | Node | null;
	/** The narrowest width, in CSS pixels, with a permanent sidebar: 1024, the family's one cut (D49); another only with a recorded measurement. */
	cut?: number;
	/** The row's text below the cut; the current item's label by default. */
	section?: string | null;
	action?: SidebarAction | null;
	search?: SidebarSearchOptions | null;
	onnavigate?: ((item: FamilyNavigation, event: MouseEvent) => void) | null;
	/** `sections`, `close`, and since 0.10.0 the search's `searching`, `none`, `unavailable`, `retry`, `results`, `all`, `count`. */
	labels?: Copy;
}
/** A product's own sections (0.4.0): permanent above the cut, a product row and a modal drawer below it. */
export class Sidebar extends Component {
	/** The copy in English and Spanish (0.7.2). */
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	constructor(options: SidebarOptions);
	readonly mode: 'permanent' | 'drawer';
	/** Whether the drawer is open. */
	readonly expanded: boolean;
	/** Patched by keys in both forms (0.10.0): focus stays where it is. */
	set groups(value: Array<SidebarGroup | SidebarEntries>);
	set context(value: SidebarOptions['context']);
	set section(value: string | null);
	set action(value: SidebarAction | null);
	set search(value: SidebarSearchOptions | null);
	open(): void;
	close(): void;
}

// Only the declarations marked `export` are public.
export {};
