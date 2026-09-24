/** Types of the larger DOM components, re-exported by `@beyond-js/ui/dom`. */
import type { Component, Disclosure, Content, Copy, SelectOption } from './dom.js';
import type { NotificationAdapter, Notice } from './notifications.js';

export interface PickerItem { id: string; label: Content; description?: Content | null; disabled?: boolean; reason?: string | null }
export interface PickerChoice { id: string; label: Content; description?: Content | null; state?: 'stale' | 'ineligible' | 'unavailable' | null; reason?: string | null }
export interface PickerRequest { query: string; filters: Record<string, string>; cursor: unknown; limit: number; signal: AbortSignal }
export type PickerSource = (request: PickerRequest) => Promise<{ items: PickerItem[]; next?: unknown; total?: number | null }>;
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
	onchange?: ((selected: PickerChoice[]) => void) | null;
	labels?: Copy;
}
export class Picker extends Component {
	constructor(options: PickerOptions);
	readonly value: string[];
	readonly selected: PickerChoice[];
	readonly control: HTMLInputElement;
	mark(id: string, finding: { state?: PickerChoice['state']; reason?: string | null }): void;
	remove(id: string): void;
	refresh(): Promise<void>;
	focus(): void;
}

export interface Column<Row> { key: string; label: string; value?: (row: Row) => Content; numeric?: boolean; primary?: boolean }
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
	static local<Row>(rows: Row[], match?: (row: Row, query: string, filters: Record<string, string>) => boolean): CollectionOptions<Row>['source'];
	constructor(options: CollectionOptions<Row>);
	state: CollectionState;
	load(): Promise<void>;
}

export class Toaster extends Component {
	constructor(options?: { labels?: Copy });
	show(message: Content, options?: { tone?: 'success' | 'info' | 'warning' | 'danger'; detail?: Content | null; duration?: number }): () => void;
	clear(): void;
}

export interface Crumb { label: Content; href?: string | null; current?: boolean }
export interface HeaderOptions {
	brand: { label: string; href: string; logo?: Node | null; image?: { src: string; width?: number; height?: number } | null };
	context?: Crumb[] | Node | null;
	nav?: Crumb[] | Node | null;
	notifications?: Node | null;
	account?: Node | null;
	toggle?: { controls: string; expanded: boolean; onchange?: (expanded: boolean) => void } | null;
	onnavigate?: ((item: Crumb, event: MouseEvent) => void) | null;
	labels?: Copy;
}
export class Header extends Component {
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
	constructor(options: NotificationInboxOptions);
	state: InboxState;
	load(): Promise<void>;
}
