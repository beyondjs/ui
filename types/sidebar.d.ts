/** Types of the shared `Sidebar` (0.4.0; entries, search and a top action since 0.10.0; objects, folds and the shortcut since 0.14.0), re-exported by `@beyond-js/ui/dom`. */
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
	/**
	 * Its age at its end (0.11.0): a moment (a Date, milliseconds or an ISO string) said in short words
	 * ("now", "5 min", "2 h", "3 d", "2 w", then the day) with the full moment read and in its tooltip, or
	 * the product's own `{ label, title }`.
	 */
	age?: Date | number | string | SidebarAge | null;
}
/** An entry's age in the product's own words (0.11.0): `label` shown, `title` read and in the tooltip. */
export interface SidebarAge {
	label: string;
	title?: string | null;
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
	/** How many items the group holds, beside its heading ("Recent, 12"; 0.11.0). */
	count?: number | string | null;
	items: Array<SidebarEntry | null | false>;
	more?: { label: string; href: string } | null;
	/** `false` keeps a plain heading; otherwise a group with a heading folds under a disclosure (0.14.0, D97). */
	fold?: boolean;
	/** Its items need the person: folded it keeps its tone, and it opens by itself when one arrives (0.14.0). */
	attention?: boolean;
}
/**
 * The product's own objects (0.14.0, D97): after the sections and a divider, their heading line with the
 * primary action (a word and `plus`) and the search as its icon, their groups of entries and their `more`.
 */
export interface SidebarObject {
	kind: 'object';
	key?: string;
	/** What the objects are ("Conversations"). */
	heading: Content;
	/** The primary action ("New"); `row: true` also ends the product row with it below the cut (SB-07). */
	action?: (SidebarAction & { row?: boolean }) | null;
	/** Drawn as the `search` icon that expands into the field over the heading line. */
	search?: SidebarSearchOptions | null;
	groups: Array<SidebarEntries | null | false>;
	/** The objects' `more` link ("All conversations"). */
	more?: { label: string; href: string } | null;
}
/** Which groups the person folded, per device and product (`bui-sidebar:{product}:{group}` in `localStorage`; 0.14.0). */
export interface SidebarFolds {
	key(group: string): string;
	folded(group: string): boolean;
	keep(group: string, folded: boolean): void;
	subscribe(listener: (group: string, folded: boolean) => void): () => void;
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
	groups?: Array<SidebarGroup | SidebarEntries | SidebarObject>;
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
	/** ⌘K / Ctrl+K opens the search (0.14.0): an option a product enables; off by default. */
	shortcut?: boolean;
}
/** A product's own sections (0.4.0): permanent above the cut, a product row and a modal drawer below it. */
export class Sidebar extends Component {
	/** The copy in English and Spanish (0.7.2). */
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	constructor(options: SidebarOptions);
	readonly mode: 'permanent' | 'drawer';
	/** FamilyBar's `toggle` for this drawer (0.16.0). */
	readonly toggle: { controls: string; expanded: boolean; onchange: (expanded: boolean) => void };
	/** One bar on a phone (0.16.0, DQ-19): the bar's menu button opens the drawer and the product row goes. */
	merge(bar: import('./family.js').FamilyBar): void;
	/** Whether the drawer is open. */
	readonly expanded: boolean;
	/** Patched by keys in both forms (0.10.0): focus stays where it is. */
	set groups(value: Array<SidebarGroup | SidebarEntries | SidebarObject>);
	set context(value: SidebarOptions['context']);
	set section(value: string | null);
	set action(value: SidebarAction | null);
	set search(value: SidebarSearchOptions | null);
	/** Whether ⌘K / Ctrl+K opens the search (0.14.0); a host that keeps the key sets it false. */
	shortcut: boolean;
	/** The kept folds (0.14.0). */
	readonly folds: SidebarFolds;
	/** Opens the search with focus in its field (the drawer below the cut); whether there was one (0.14.0). */
	seek(): boolean;
	open(): void;
	close(): void;
}

// Only the declarations marked `export` are public.
export {};
