/** Types of the "Choose, never type" components (0.7.0), re-exported by `@beyond-js/ui/dom`. */
import type { Component, Content, Copy, MenuItem, Tone } from './dom.js';
import type { Clock, Expected, Moment } from './operations.js';

type Copies = { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };

export interface ChoiceMenuOption {
	value: string;
	label: Content;
	detail?: Content | null;
	status?: [string, 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'progress'] | null;
	disabled?: boolean;
	reason?: string | null;
	/** What a search or type-ahead matches when the label is not plain text (0.7.0) */
	search?: string;
}
export interface ChoiceMenuAction {
	label: Content;
	run: () => void;
	disabled?: boolean;
	reason?: string | null;
}
export interface ChoiceMenuOptions {
	label: string;
	options: Array<ChoiceMenuOption | null | false>;
	value?: string | null;
	placeholder?: string | null;
	actions?: Array<ChoiceMenuAction | null | false>;
	disabled?: boolean;
	align?: 'start' | 'end';
	placement?: 'auto' | 'below' | 'above';
	/** A search field above the options: `auto` past `ChoiceMenu.threshold`, a number past it, or always (0.7.0) */
	search?: boolean | 'auto' | number;
	/** One option that can be chosen, and no action, is stated as text (default true; 0.7.0) */
	statement?: boolean;
	/** Submits the value with a form in a hidden input (0.7.0) */
	name?: string | null;
	onchange?: ((value: string) => void) | null;
	labels?: Copy;
}
export class ChoiceMenu extends Component {
	/** The copy in English and Spanish (0.7.0). */
	static readonly labels: { readonly en: Copy; readonly es: Copy };
	/** More options than this open with a search field (15). */
	static threshold: number;
	constructor(options: ChoiceMenuOptions);
	readonly control: HTMLButtonElement;
	readonly expanded: boolean;
	/** Whether the one option is stated as text (0.7.0). */
	readonly stated: boolean;
	readonly chosen: ChoiceMenuOption | null;
	value: string | null;
	set disabled(disabled: boolean);
	set options(options: Array<ChoiceMenuOption | null | false>);
	set actions(actions: Array<ChoiceMenuAction | null | false>);
	open(): void;
	close(refocus?: boolean): void;
}

/** A Git ref a `RefChooser` offers. */
export interface GitRef { name: string; default?: boolean; note?: string | null }
export interface RefChooserOptions {
	label?: string | null;
	refs?: GitRef[];
	value?: string | null;
	loading?: boolean;
	unavailable?: { text?: string | null; retry?: (() => void) | null } | null;
	/** Offers "Use a commit or another ref…" (default true) */
	escape?: boolean;
	/** The product's own rule for a typed ref: a message, or null */
	validate?: ((value: string) => string | null) | null;
	layout?: 'field' | 'inline';
	name?: string | null;
	onchange?: ((value: string) => void) | null;
	labels?: Copy;
}
/** A branch or another Git ref: the default first, search past the threshold, and a typed ref as the escape. */
export class RefChooser extends Component {
	static readonly labels: Copies;
	constructor(options?: RefChooserOptions);
	readonly control: HTMLButtonElement;
	value: string | null;
	set refs(refs: GitRef[]);
	set loading(loading: boolean);
	set unavailable(unavailable: { text?: string | null; retry?: (() => void) | null } | null);
	/** Opens the escape's field. */
	other(): void;
	focus(): void;
}

/** A project as the family bar's descriptor carries it. */
export interface PickedProject { id: string; name: string; here?: { state?: string; mapped?: number; url?: string } | null }
/** The organization's projects with their state in this product, as a form control. */
export class ProjectPicker extends Component {
	static readonly labels: Copies;
	constructor(options: { projects: PickedProject[]; product: string; value?: string | null; label?: string | null; only?: 'unset' | null; actions?: ChoiceMenuAction[]; name?: string | null; onchange?: ((id: string) => void) | null; labels?: Copy });
	readonly control: HTMLButtonElement;
	value: string | null;
	set projects(projects: PickedProject[]);
	focus(): void;
}

/** A secret with Connect first and the pasted credential folded beneath as the last resort. */
export class SecretField extends Component {
	static readonly labels: Copies;
	constructor(options: { label: Content; connect?: { label: string; run?: (() => void) | null; href?: string | null } | null; credential?: string; stored?: boolean; hint?: Content | null; name?: string | null; labels?: Copy });
	readonly control: HTMLInputElement;
	/** The pasted text while an input is open, else null (a held secret is kept). */
	readonly value: string | null;
	stored: boolean;
}

export type DraftKey = 'environment' | 'provider' | 'agent' | 'from' | 'for';
/** The context a "New …" action carries in its address, and its reader. */
export class Draft {
	static readonly keys: readonly DraftKey[];
	static read(address: string | URL | Location | { href: string }): Draft;
	constructor(values?: Partial<Record<DraftKey, string | null | undefined>>);
	readonly values: Readonly<Partial<Record<DraftKey, string>>>;
	readonly empty: boolean;
	/** `base` with the carried values in its query (the hash's for an address routed in its hash). */
	address(base: string): string;
}

export interface SideSheetOptions {
	title: Content;
	label?: string | null;
	description?: Content | null;
	children?: Node[];
	actions?: Node[];
	width?: 'form' | 'standard';
	restore?: HTMLElement | null;
	onclose?: ((value: unknown) => void) | null;
	labels?: Copy;
}
/** A modal sheet from the inline end; never closed by a press outside, nothing closes it while busy. */
export class SideSheet extends Component {
	static readonly labels: Copies;
	static readonly widths: readonly ['form', 'standard'];
	constructor(options: SideSheetOptions);
	readonly element: HTMLDialogElement;
	readonly body: HTMLElement;
	readonly footer: HTMLElement;
	readonly shown: boolean;
	busy: boolean;
	set title(value: Content);
	set actions(nodes: Node[]);
	fill(children: unknown): this;
	/** Shows a failure at the top, or clears it with null. */
	error(node: Node | { element: Node } | null): void;
	open<T = unknown>(options?: { restore?: HTMLElement | null }): Promise<T | null>;
	focus(): void;
	close(value?: unknown): boolean;
	dismiss(): boolean;
}

export type ProviderState = 'idle' | 'open' | 'blocked' | 'checking' | 'closed' | 'unknown' | 'done' | 'away';
export interface ProviderWindowOptions {
	provider: string;
	href: string;
	/** Reads the attempt from the server: `done`, `waiting` (the product draws it) or anything else */
	read: () => Promise<{ state: string; [key: string]: unknown }>;
	origin?: string | null;
	onend?: ((outcome: 'done' | 'waiting', answer: { state: string; [key: string]: unknown }) => void) | null;
	same?: boolean | 'auto';
	expected?: Expected;
	bound?: number;
	poll?: number;
	clock?: Clock;
	locale?: string;
	labels?: Copy & { awaited?: Copy };
}
/** A provider's own window, followed until the server says how it ended (FR-G2). */
export class ProviderWindow extends Component {
	static readonly labels: Copies;
	static readonly states: readonly ProviderState[];
	constructor(options: ProviderWindowOptions);
	readonly state: ProviderState;
	open(): void;
	tab(): void;
	check(): Promise<void>;
	cancel(): void;
}

export interface StatusRowState { label: string; tone?: Tone | 'progress'; checked?: Moment | null; connected?: boolean }
export interface StatusRowValues {
	title: Content;
	kind?: Content | null;
	state: StatusRowState;
	reason?: Content | null;
	owner?: Content | null;
	facts?: Array<Content | null | false>;
	action?: Node | { element: Node } | null;
	more?: Array<MenuItem | null | false>;
}
/** One thing with one state, its reason, who can change it and its one action. */
export class StatusRow extends Component {
	static readonly labels: Copies;
	constructor(options: StatusRowValues & { level?: 2 | 3 | 4 | 5 | 6; clock?: Clock; locale?: string; labels?: Copy & { freshness?: Copy } });
	/** The state's words with how fresh it is. */
	readonly text: string;
	update(values: Partial<StatusRowValues>): void;
}

/** A prewritten message, link or command with one copy action. */
export class CopyMessage extends Component {
	static readonly labels: Copies;
	static bound: number;
	constructor(options: { text: string; kind?: 'message' | 'command' | 'link'; label?: Content | null; labels?: Copy });
	text: string;
	copy(): Promise<boolean>;
}

/** List and detail: the detail beside the list on a wide region, its own page on a narrow one. */
export class ListDetail extends Component {
	static cut: string;
	constructor(options: { list: Node | { element: Node }; detail?: Node | { element: Node } | null; label?: string | null; back?: { label: Content; href: string; onnavigate?: ((event: MouseEvent) => void) | null } | null });
	readonly open: boolean;
	set detail(detail: Node | { element: Node } | null);
	set back(back: { label: Content; href: string; onnavigate?: ((event: MouseEvent) => void) | null } | null);
	focus(): void;
}
