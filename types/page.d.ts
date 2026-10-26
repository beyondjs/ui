/** Types of the family page system (decision D52) and the preferences dialog (D54), re-exported by `@beyond-js/ui` and `/dom`. */
import type { Component, Copy } from './dom.js';
import type { Preferences } from './preferences.js';

/** `thread` (0.14.0, D94): a conversation's page, its main column ending with the anchored `dock`. */
export type PageTemplate = 'overview' | 'list' | 'detail' | 'settings' | 'task' | 'tool' | 'thread';
/** `thread` (0.11.0): a conversation's thread at `--layout-thread`, the wide lane of D96 since 0.14.0. */
export type PageWidth = 'fluid' | 'standard' | 'form' | 'reading' | 'thread';
type Part = Node | { element: Node } | null;

export interface PageOptions {
	/** The page's kind (default `detail`); `tool` has full-bleed panes and no gutter. */
	template?: PageTemplate;
	/** The main column's tier (default `standard`; `thread` in the thread template). */
	width?: PageWidth | null;
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
	/** The side panel raised on a surface of its own, as a resource page holds its conditions (0.30.0); ignored with `panel`. */
	raised?: boolean;
	/** The raised side panel holds the page's action, so it is pinned beside the main column: in view while that column scrolls, from the width where it sits beside it (0.38.0, D189). Only with `raised`. */
	pinned?: boolean;
	/** The aside as a panel kept in view (0.10.0): beside and sticky from `cut`, a side sheet below it. */
	panel?: PagePanelOptions | null;
	/** What the thread template docks at the window's bottom, such as its composer (0.14.0, D94); other templates throw. */
	dock?: Part | Part[];
	/** Where the thread template's column sits (0.15.0, C2 amending D52): `center` centers it. */
	lane?: 'start' | 'center';
}

/** A thread page's dock (0.14.0, D94): sticky at the window's bottom with one gutter and the safe area under it. */
export class PageDock {
	constructor(options?: { element?: HTMLElement | null; end?: HTMLElement | null });
	readonly element: HTMLElement;
	/** The end mark after the dock, watched by an `IntersectionObserver`. */
	readonly end: HTMLElement;
	/** Whether content passes beneath the dock now (`data-stuck`, its hairline). */
	readonly stuck: boolean;
	set content(children: Part | Part[]);
	destroy(): void;
}

export interface PagePanelOptions {
	/** The region width from which it sits beside the main column: CSS pixels, or a `rem` or `px` length (`'68rem'`). */
	cut?: number | string;
	/** Shown beside on a wide region (default true): the person's kept choice. */
	open?: boolean;
	/** The person showed or hid it beside; keep it on the device. */
	onchange?: ((shown: boolean) => void) | null;
	/** The sheet's title (the label by default), and the head's title with `head`. */
	title?: string | null;
	labels?: { close?: string; hide?: string };
	/** A head of its own beside the main column: the title and a hide control, "Hide {title}" (0.11.0). */
	head?: boolean;
	/** The wide form, up to `--layout-aside-wide` (0.11.0). */
	wide?: boolean;
}

/** A page's side panel kept in view (0.10.0): beside and sticky from its cut, hideable there, a `SideSheet` below. */
export class PagePanel extends Component {
	/** The default cut, `'68rem'`. */
	static cut: number | string;
	/** The copy in English and Spanish (0.11.0): `hide` ("Hide {title}") and `close`. */
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	/** The wide form: beside, it may grow to `--layout-aside-wide`; the page carries `data-panel-wide` (0.11.0). */
	wide: boolean;
	/** The head's title (0.11.0). */
	set title(text: string);
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
	/** Whether the side panel is raised on a surface of its own (0.30.0). */
	raised: boolean;
	/** Whether the raised side panel is pinned beside the main column (0.38.0, D189); false while it is not raised. Setting it keeps the page's choice: the panel is pinned whenever it is raised. */
	pinned: boolean;
	width: PageWidth;
	/** The thread template's dock, or null in any other template (0.14.0). */
	get dock(): PageDock | null;
	set dock(children: Part | Part[]);
}

export interface PageCrumb {
	label: string;
	href?: string | null;
}

export interface PageHeaderOptions {
	/** What is in view: the resource's name, never the organization when a project is in view. */
	title: string | Node;
	/** The levels above, where the object lives; none, or a single section root, shows no breadcrumb. */
	crumbs?: Array<PageCrumb | null | false>;
	/** The object's kind or variant beside the H1: words drawn as a quiet tag, or one control that chooses among its siblings (0.19.1, D160). */
	kind?: string | Node | { element: Node } | null;
	/** One status (`status()`): the H1 object's own state, never another object's. */
	status?: Node | null;
	/** One muted line of facts. */
	facts?: string | Node | Array<string | Node> | null;
	/** The title line's actions: one primary button, then an `ActionMenu`. */
	actions?: Array<Node | { element: Node } | null>;
	/** The page's `Tabs`. */
	tabs?: Part;
	labels?: { crumbs?: string };
	/** The compact line once the title has scrolled out: the title and the status, and the product's own `actions` (0.11.0). */
	compact?: boolean | { actions?: Array<Node | { element: Node } | null> } | null;
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
	/** The object's kind or variant beside the H1 (0.19.1). */
	kind: string | Node | { element: Node } | null;
	status: Node | null;
	facts: string | Node | Array<string | Node> | null;
	actions: Array<Node | { element: Node } | null>;
	tabs: Part;
	/** Moves focus to the H1 without scrolling. */
	focus(): void;
	/** The compact line's holder, placed right before the header (`Page` does it); null without `compact` (0.11.0). */
	readonly bar: HTMLElement | null;
	/** Whether the compact line is shown now (0.11.0). */
	readonly compacted: boolean;
	/** What the compact line names in place of the title, such as the turn being read (0.29.0, D181); null for the title. */
	subject: { text: string; href?: string | null } | null;
	/** Decides at once whether the compact line shows (0.11.0). */
	measure(): void;
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
	/** Which ends of the row hold tabs it does not show (0.15.0): a fade and a chevron say so. */
	readonly more: Array<'start' | 'end'>;
}

/** A flat section: a heading, one description line, its actions and its content. */
export class Section extends Component {
	constructor(options: { title: string | Node; description?: string | Node | null; actions?: Array<Node | { element: Node } | null>; children?: Node[]; level?: 2 | 3; /** A raised surface inside the page (0.15.0, C2) */ raised?: boolean; /** Starts waiting in this shape (0.23.0, LOAD-01) */ waiting?: true | number | WaitingShape | null; /** Starts unavailable (0.24.0, D163) */ unavailable?: true | SectionOutage | null; /** The kept content's time (0.24.0) */ updated?: SectionUpdate | null });
	/** Replaces the content, ending a wait. */
	children: Node[];
	/** Waits in place: heading and actions kept, the body a `waiting(shape)`, `aria-busy` until `children` is set (0.23.0, LOAD-01). */
	wait(shape?: number | WaitingShape): void;
	/** Says in place that the read did not answer: "Not available right now", no action of its own (0.24.0, D163). */
	unavailable(options?: SectionOutage): void;
	/** When the kept content was read, said above it; null while it is current (0.24.0). */
	updated: SectionUpdate | null;
}

/** What a section whose read did not answer says (0.24.0): `EmptyState`'s title, sentence and words. */
export interface SectionOutage {
	title?: string | Node;
	text?: string | Node | null;
	/** false inside a section that is framed already */
	frame?: boolean;
	labels?: Copy;
}

/** The time of content kept from an earlier read, or with its language and words; `{ time: null }` says it may be out of date (0.24.0). */
export type SectionUpdate = import('./operations.js').Moment | { time: import('./operations.js').Moment | null; locale?: string; labels?: Copy };

/** A region's wait (0.23.0, LOAD-01): an announced "Loading…" line and row-shaped placeholders on the region's raised frame (`frame: false` inside a framed region). */
export function waiting(shape?: number | WaitingShape): HTMLElement;

/** A wait's shape and words (0.23.0). */
export interface WaitingShape {
	label?: string | null;
	language?: 'en' | 'es';
	rows?: number;
	kind?: 'lines' | 'list' | 'table';
	frame?: boolean;
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
