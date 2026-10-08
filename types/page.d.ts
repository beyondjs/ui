/** Types of the family page system (decision D52) and the preferences dialog (D54), re-exported by `@beyond-js/ui` and `/dom`. */
import type { Component, Copy } from './dom.js';
import type { Preferences } from './preferences.js';

export type PageTemplate = 'overview' | 'list' | 'detail' | 'settings' | 'task' | 'tool';
export type PageWidth = 'fluid' | 'standard' | 'form' | 'reading';
type Part = Node | { element: Node } | null;

export interface PageOptions {
	/** The page's kind (default `detail`); `tool` has full-bleed panes and no gutter. */
	template?: PageTemplate;
	/** The main column's tier (default `standard`). */
	width?: PageWidth;
	/** The arrival line, first in the region. */
	arrival?: Part;
	/** The page's `PageHeader`. */
	header?: Part;
	/** The main column. */
	children?: Node[];
	/** The side panel's content; no panel without it. */
	aside?: Node[] | null;
	/** The side panel's accessible name. */
	label?: string | null;
	/** The aside as a panel kept in view (0.10.0): beside and sticky from `cut`, a side sheet below it. */
	panel?: PagePanelOptions | null;
}

export interface PagePanelOptions {
	/** The region width from which it sits beside the main column: CSS pixels, or a `rem` or `px` length (`'68rem'`). */
	cut?: number | string;
	/** Shown beside on a wide region (default true): the person's kept choice. */
	open?: boolean;
	/** The person showed or hid it beside; keep it on the device. */
	onchange?: ((shown: boolean) => void) | null;
	/** The sheet's title (the label by default). */
	title?: string | null;
	labels?: { close?: string };
}

/** A page's side panel kept in view (0.10.0): beside and sticky from its cut, hideable there, a `SideSheet` below. */
export class PagePanel extends Component {
	/** The default cut, `'68rem'`. */
	static cut: number | string;
	constructor(options: PagePanelOptions & { page: HTMLElement; body: HTMLElement; label?: string | null });
	/** `beside` from the cut, `sheet` below it. */
	readonly mode: 'beside' | 'sheet' | null;
	/** The kept choice of showing it beside; setting it reports nothing. */
	shown: boolean;
	/** Whether it is in view now: beside and shown, or open in its sheet. */
	readonly expanded: boolean;
	/** The element that holds its content. */
	readonly slot: HTMLElement;
	set content(children: Node[] | null);
	set present(value: boolean);
	/** Shows it beside, or opens its sheet; closing the sheet returns focus to `from`, else to its first toggle. */
	open(from?: HTMLElement | null): void;
	close(): void;
	/** `from`: the toggle pressed, where focus returns from the sheet. */
	toggle(from?: HTMLElement | null): void;
	/** Makes a button the panel's toggle (`aria-expanded`, `aria-controls`); returns the release. */
	control(button: HTMLElement): () => void;
	/** Decides beside or sheet from the region's width now. */
	measure(): void;
}

/** The content region beside the navigation: edge to edge, one gutter from the navigation, blocks at their width tier. */
export class Page extends Component {
	static readonly templates: readonly PageTemplate[];
	static readonly widths: readonly PageWidth[];
	constructor(options?: PageOptions);
	/** The main column's element. */
	readonly region: HTMLElement;
	/** The panel kept in view, when made with `panel` (0.10.0). */
	readonly panel: PagePanel | null;
	main: Node[];
	aside: Node[] | null;
	width: PageWidth;
}

export interface PageCrumb {
	label: string;
	href?: string | null;
}

export interface PageHeaderOptions {
	/** What is in view: the resource's name, never the organization when a project is in view. */
	title: string | Node;
	/** The levels above; none, or a single section root, shows no breadcrumb. */
	crumbs?: Array<PageCrumb | null | false>;
	/** One status (`status()`). */
	status?: Node | null;
	/** One muted line of facts. */
	facts?: string | Node | Array<string | Node> | null;
	/** The title line's actions: one primary button, then an `ActionMenu`. */
	actions?: Array<Node | { element: Node } | null>;
	/** The page's `Tabs`. */
	tabs?: Part;
	labels?: { crumbs?: string };
}

/** A page's one header: crumbs, the H1, one status, facts, the line's actions and the tabs. */
export class PageHeader extends Component {
	/** The copy in English and Spanish (0.7.2). */
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	constructor(options: PageHeaderOptions);
	/** The H1, for focus after a navigation. */
	readonly heading: HTMLHeadingElement;
	title: string | Node;
	crumbs: Array<PageCrumb | null | false>;
	status: Node | null;
	facts: string | Node | Array<string | Node> | null;
	actions: Array<Node | { element: Node } | null>;
	tabs: Part;
	/** Moves focus to the H1 without scrolling. */
	focus(): void;
}

export interface TabItem {
	label: string | Node;
	href: string;
	current?: boolean;
}

/** A resource's areas as tabs under its header, drawn like `ProductNav`. */
export class Tabs extends Component {
	/** The copy in English and Spanish (0.7.2; `named` since 0.7.6). */
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	/** `label` is the accessible name as given; `name` names what the tabs belong to ("Sections of {name}", 0.7.6). */
	constructor(options: { items?: Array<TabItem | null | false>; label?: string | null; name?: string | null; onnavigate?: ((item: TabItem, event: MouseEvent) => void) | null; labels?: { nav?: string; named?: string } });
	items: Array<TabItem | null | false>;
}

/** A flat section: a heading, one description line, its actions and its content. */
export class Section extends Component {
	constructor(options: { title: string | Node; description?: string | Node | null; actions?: Array<Node | { element: Node } | null>; children?: Node[]; level?: 2 | 3 });
	children: Node[];
}

export interface ArrivalLabels {
	readonly from: string;
	readonly back: string;
	readonly dismiss: string;
}

/** The arrival line (D54): "Opened from {product} · Back to {product}". */
export class Arrival extends Component {
	static readonly labels: { readonly en: ArrivalLabels; readonly es: ArrivalLabels };
	constructor(options: { product: string; href: string; ondismiss?: (() => void) | null; onnavigate?: ((item: { href: string; url: string }, event: MouseEvent) => void) | null; labels?: Partial<ArrivalLabels> });
}

export interface FamilyPreferences {
	/** The product's own `Preferences`. */
	preferences: Preferences;
	/** The account page at Accounts ("Change for all of Beyond"), or a function asked at each opening (0.6.2). */
	everywhere?: string | (() => string | null) | null;
	/** The languages offered (default English and Spanish). */
	locales?: string[];
	/** Called once the dialog closed (0.6.2); to follow each choice, subscribe to the `Preferences` instance. */
	onclose?: (() => void) | null;
}

/** "Language and appearance" (D54): the one dialog the profile menu's product group opens. */
export class PreferencesDialog extends Component {
	static readonly labels: { readonly en: { title: string; note: string; done: string; names: Record<string, string> }; readonly es: { title: string; note: string; done: string; names: Record<string, string> } };
	constructor(options: FamilyPreferences);
	/** Whether it is open now (0.6.2). */
	readonly shown: boolean;
	/** Opens it; resolves when it closes. Opening it again while open does nothing. `restore` may be a function asked at closing (0.6.2). */
	open(options?: { restore?: Element | (() => Element | null) | null }): Promise<boolean | null>;
	/** Its opener is going away: an open dialog stays until it closes, then releases itself (0.6.2). */
	leave(): void;
}
