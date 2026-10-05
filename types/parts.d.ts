/** Types of the larger DOM components, re-exported by `@beyond-js/ui/dom`. */
import type { Component, Disclosure, Content, Copy, SelectOption, Tone } from './dom.js';
import type { NotificationAdapter, Notice } from './notifications.js';

/** A mark on a result with its reason, such as "Also in Website" or "Archived on GitHub" (0.7.0). */
export interface PickerMark { label: string; tone?: Tone; reason?: string | null }
export interface PickerItem {
	id: string;
	label: Content;
	description?: Content | null;
	disabled?: boolean;
	reason?: string | null;
	/** An image address drawn beside the name (0.7.0) */
	avatar?: string | null;
	/** A catalog glyph drawn beside the name when there is no avatar (0.7.0) */
	glyph?: string | null;
	/** "Private" with a lock, or "Public" (0.7.0) */
	visibility?: 'private' | 'public' | null;
	/** A short fact in the product's words, such as the default branch (0.7.0) */
	meta?: Content | null;
	/** When it last changed: "Updated 2 h ago" (0.7.0) */
	updated?: string | number | Date | null;
	/** Its one state, `[label, tone]` (0.7.0) */
	state?: [string, Tone | 'progress'] | null;
	marks?: PickerMark[];
}
export interface PickerChoice { id: string; label: Content; description?: Content | null; state?: 'stale' | 'ineligible' | 'unavailable' | null; reason?: string | null; /** The account in view when it was chosen (0.7.0) */ account?: string }
export interface PickerRequest { query: string; filters: Record<string, string>; /** The account in view (0.7.0), null without accounts */ account: string | null; cursor: unknown; limit: number; signal: AbortSignal }
export type PickerSource = (request: PickerRequest) => Promise<{ items: PickerItem[]; next?: unknown; total?: number | null; /** A group before the results, first page only (0.7.0) */ suggested?: { label?: string | null; items: PickerItem[] } | null }>;
/** An account results come from, in "From [account ▾]" (0.7.0). */
export interface PickerAccount { id: string; label: string; detail?: string | null; status?: [string, Tone | 'progress'] | null; disabled?: boolean; reason?: string | null }
export interface PickerAccounts { items: PickerAccount[]; value?: string | null; connect?: { label: string; run: () => void } | null }
/** What `recognize` found in the search field (0.7.0). */
export interface PickerRecognized { label: string; id?: string | null; match?: ((item: PickerItem) => boolean) | null; query?: string | null; value?: unknown }
export interface PickerFound extends PickerRecognized { outcome: 'picked' | 'refused' | 'missing'; item: PickerItem | null }
/** `Unavailable`'s options, shown in place of the list (0.7.0). */
export interface PickerGate { title: Content; reason: Content; owner?: Content | null; action?: Node | null; secondary?: Node | null; kind?: import('./family.js').UnavailableKind; code?: string | null; level?: 2 | 3 | 4 | 5 | 6 }
export interface PickerOptions {
	label: string;
	source: PickerSource;
	multiple?: boolean;
	selected?: PickerChoice[];
	filters?: Array<{ name: string; label: string; value?: string; options: SelectOption[] }>;
	name?: string | null;
	hint?: Content | null;
	limit?: number;
	delay?: number;
	/** Offers choosing every result shown that can be chosen (multiple pickers only) */
	all?: boolean;
	/** Milliseconds the source may take before it is stated as unavailable (20000; 0.7.0) */
	bound?: number;
	accounts?: PickerAccounts | null;
	gate?: PickerGate | null;
	footer?: Node | Node[] | null;
	recognize?: ((text: string) => PickerRecognized | null) | null;
	onrecognize?: ((found: PickerFound | null) => void) | null;
	explain?: ((error: unknown) => string | null) | null;
	onchange?: ((selected: PickerChoice[]) => void) | null;
	labels?: Copy;
}
export class Picker extends Component {
	/** The copy in English and Spanish (0.7.0). */
	static readonly labels: { readonly en: Copy; readonly es: Copy };
	constructor(options: PickerOptions);
	readonly value: string[];
	readonly selected: PickerChoice[];
	readonly control: HTMLInputElement;
	/** The account in view, or null without accounts (0.7.0). */
	readonly account: string | null;
	readonly recognized: PickerRecognized | null;
	set accounts(accounts: PickerAccounts);
	set footer(nodes: Node | Node[] | null);
	set gate(gate: PickerGate | null);
	mark(id: string, finding: { state?: PickerChoice['state']; reason?: string | null }): void;
	remove(id: string): void;
	refresh(): Promise<void>;
	focus(): void;
}

export interface Column<Row> { key: string; label: string; value?: (row: Row) => Content; numeric?: boolean; primary?: boolean; /** Hidden as the region narrows, the highest number first (0.7.0) */ priority?: number }
export interface CollectionState { query: string; filters: Record<string, string>; page: number }
export interface CollectionOptions<Row> {
	label: string;
	columns: Column<Row>[];
	source: (request: CollectionState & { limit: number; signal: AbortSignal }) => Promise<{ rows: Row[]; total?: number | null; more?: boolean | null }>;
	link?: ((row: Row) => string) | null;
	onopen?: ((row: Row, event: MouseEvent) => void) | null;
	key?: (row: Row) => string;
	search?: boolean;
	filters?: Array<{ name: string; label: Content; all?: string; options: SelectOption[] }>;
	state?: Partial<CollectionState>;
	onstate?: ((state: CollectionState) => void) | null;
	onrender?: (() => void) | null;
	limit?: number;
	delay?: number;
	empty?: { title?: Content; body?: Content; action?: Node } | null;
	explain?: ((error: unknown) => string) | null;
	labels?: Copy;
}
export class Collection<Row = Record<string, unknown>> extends Component {
	/** The copy in English and Spanish (0.7.0). */
	static readonly labels: { readonly en: Copy; readonly es: Copy };
	static local<Row>(rows: Row[], match?: (row: Row, query: string, filters: Record<string, string>) => boolean): CollectionOptions<Row>['source'];
	constructor(options: CollectionOptions<Row>);
	state: CollectionState;
	load(): Promise<void>;
}

export class Toaster extends Component {
	/** The copy in English and Spanish (0.7.1). */
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	constructor(options?: { labels?: Copy });
	show(message: Content, options?: { tone?: 'success' | 'info' | 'warning' | 'danger'; detail?: Content | null; duration?: number }): () => void;
	clear(): void;
}

export interface Crumb { label: Content; href?: string | null; current?: boolean }
export interface HeaderOptions {
	brand: { label: string; href: string; lockup?: { src: string; name?: string } | null; logo?: Node | null; image?: { src: string; width?: number; height?: number } | null };
	context?: Crumb[] | Node | null;
	nav?: Crumb[] | Node | null;
	notifications?: Node | null;
	account?: Node | null;
	toggle?: { controls: string; expanded: boolean; onchange?: (expanded: boolean) => void } | null;
	onnavigate?: ((item: Crumb, event: MouseEvent) => void) | null;
	labels?: Copy;
}
export class Header extends Component {
	/** The copy in English and Spanish (0.7.2). */
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	constructor(options: HeaderOptions);
	expanded: boolean;
	set context(value: Crumb[] | Node | null);
	set nav(value: Crumb[] | Node | null);
	set end(slots: { notifications?: Node | null; account?: Node | null });
}

export interface NotificationEntryOptions {
	adapter: NotificationAdapter;
	href?: string | null;
	onopen?: ((destination: string, item: Notice) => void) | null;
	/** Takes over "View all" for applications that route themselves; the panel is already closed. */
	onview?: ((event: MouseEvent) => void) | null;
	/** Display names by product id, also used to name unreachable products. */
	products?: Record<string, string>;
	locale?: string;
	limit?: number;
	interval?: number;
	labels?: Copy;
}
export class NotificationEntry extends Disclosure {
	/** The copy in English and Spanish (0.7.2). */
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	/** Milliseconds before the panel's loading indicator shows (default 250); a quicker answer never shows it. */
	static delay: number;
	constructor(options: NotificationEntryOptions);
	/** The unread count shown, or null while unknown. */
	readonly count: number | null;
	/** Whether the count stopped at the summary's bound (shown as "N+"). */
	readonly more: boolean;
	/** Product ids the last summary named as unreachable. */
	readonly missing: string[];
	refresh(): Promise<void>;
}

export interface InboxState { state: 'unread' | 'all'; product: string }
export interface NotificationInboxOptions {
	adapter: NotificationAdapter;
	onopen?: ((destination: string, item: Notice) => void) | null;
	products?: Record<string, string>;
	locale?: string;
	limit?: number;
	state?: Partial<InboxState>;
	onstate?: ((state: InboxState) => void) | null;
	labels?: Copy;
}
export class NotificationInbox extends Component {
	/** The copy in English and Spanish (0.7.2). */
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	constructor(options: NotificationInboxOptions);
	state: InboxState;
	load(): Promise<void>;
}
