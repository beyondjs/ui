/** Types of 0.15.0's shared patterns, re-exported by `@beyond-js/ui/dom`: Status, ListRow, CopyValue, Checklist, EmptyState and CommandCard. */
import type { Copy } from './notifications.js';
import type { Component, MenuItem } from './dom.js';

/** A state of the closed set; each has its tone, which is its shape and its hue. */
export type StatusState = 'ready' | 'busy' | 'waking' | 'asleep' | 'attention' | 'failed' | 'unknown' | 'success' | 'running' | 'idle' | 'pending' | 'stopped' | 'done';
/** A filled circle, an open ring, a diamond, a square, a hollow circle or a dashed circle. */
export type StatusTone = 'success' | 'progress' | 'attention' | 'failure' | 'idle' | 'unknown';

/** A state in words with a mark whose shape says it as well as its hue (decision C2, DQ-04). */
export class Status extends Component {
	static readonly labels: { readonly en: Readonly<Record<StatusState, string>>; readonly es: Readonly<Record<StatusState, string>> };
	static readonly states: Readonly<Record<StatusState, StatusTone>>;
	/** The tone of a state; `unknown` outside the set. */
	static tone(state: string): StatusTone;
	constructor(options: { state: StatusState | (string & {}); label?: string | Node | null; variant?: 'dot' | 'badge'; live?: boolean; labels?: Copy });
	state: StatusState;
	/** The words shown; setting null returns to the family's. */
	get label(): string;
	set label(label: string | Node | null);
}

export interface ListRowAction {
	label: string;
	run: (event: Event) => unknown;
	glyph?: string | null;
	name?: string | null;
}
export interface ListRowOptions {
	title: string | Node;
	href?: string | null;
	run?: ((event: Event) => void) | null;
	meta?: string | Node | Array<string | Node | null | undefined> | null;
	/** The mark before the name: a `Status` state, a glyph name or a node. */
	lead?: { state: StatusState | (string & {}); label?: string | Node | null } | string | Node | null;
	status?: { state: StatusState | (string & {}); label?: string | Node | null } | Node | null;
	facts?: Array<string | Node | null | false>;
	actions?: Array<ListRowAction | null | false>;
	/** The overflow menu's items. */
	menu?: Array<MenuItem | null | false>;
	select?: { checked?: boolean; disabled?: boolean; name?: string | null; value?: string | null; onchange?: (checked: boolean) => void } | null;
	current?: boolean;
	tag?: 'li' | 'div';
	labels?: Copy;
}
/** One object in a list: a dense row, the whole row opening it, quiet actions and an overflow menu (DQ-12). */
export class ListRow extends Component {
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	constructor(options: ListRowOptions);
	readonly menu: import('./dom.js').ActionMenu | null;
	update(options: ListRowOptions): this;
}

/** A value a person copies: mono, cut and shown whole on hover and focus, then Copy. */
export class CopyValue extends Component {
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	/** Characters kept whole at the end of a value cut in its middle (8). */
	static tail: number;
	constructor(options: { value: string; label?: string | null; href?: string | null; cut?: 'end' | 'middle'; labels?: Copy });
	value: string;
}

export type ChecklistState = 'todo' | 'current' | 'done' | 'blocked';
export interface ChecklistStep {
	key: string;
	title: string | Node;
	detail?: string | Node | null;
	state?: ChecklistState;
	reason?: string | Node | null;
	action?: { label: string; href?: string | null; run?: ((event: Event) => void) | null } | Node | null;
}
export interface ChecklistOptions {
	title?: string | Node | null;
	steps: Array<ChecklistStep | null | false>;
	level?: 2 | 3 | 4 | 5 | 6;
	labels?: Copy;
}
/** Setup steps in order with their progress; done steps fold to their title (DQ-17). */
export class Checklist extends Component {
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	constructor(options: ChecklistOptions);
	get steps(): Array<ChecklistStep & { state: ChecklistState }>;
	set steps(steps: Array<ChecklistStep | null | false>);
}

/** A place with nothing to show: no data, no match for a filter or a missing context. */
export class EmptyState extends Component {
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	constructor(options: { kind?: 'empty' | 'match' | 'context'; title: string | Node; text?: string | Node | null; action?: Node | { label: string; href?: string | null; run?: ((event: Event) => void) | null } | null; clear?: (() => void) | null; checklist?: ChecklistOptions | Checklist | null; glyph?: string | null; labels?: Copy });
	readonly checklist: Checklist | null;
}

/** A decision a `CommandCard` offers (0.16.0): "Allow once", "Allow for this conversation", "Deny with a note". */
export interface CommandDecision {
	value: string;
	label: string;
	kind: 'allow' | 'deny';
	keys?: 'Enter' | 'Escape' | null;
	/** Asks for a note first ("Tell it what to do instead"). */
	note?: boolean | { label?: string; placeholder?: string };
	/** What the card says once it is decided (its label by default). */
	said?: string;
}
export interface CommandAnswer {
	value: string;
	kind: 'allow' | 'deny';
	note: string | null;
	/** The command as corrected (`editable`), else null. */
	command: string | null;
	scope: boolean;
}

/** A request waiting for the person's answer, with Enter and Escape while focused (DQ-13). */
export class CommandCard extends Component {
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	/** Lines shown before Show all (8). */
	static lines: number;
	constructor(options: { title: string | Node; command: string; detail?: string | Node | null; scope?: { label: string; checked?: boolean } | null; allow?: ((answer: { scope: boolean; note?: string; command?: string }) => unknown) | null; deny?: ((answer: { scope: boolean; note?: string; command?: string }) => unknown) | null; state?: 'pending' | 'allowed' | 'denied'; labels?: Copy; /** Scoped decisions (0.16.0, CNV-10) */ decisions?: CommandDecision[] | null; ondecide?: ((answer: CommandAnswer) => unknown) | null; /** The command may be corrected before allowing (0.16.0) */ editable?: boolean });
	state: 'pending' | 'allowed' | 'denied';
	focus(): void;
	/** Answers as the person would; whether the answer was taken. */
	answer(kind: 'allow' | 'deny'): Promise<boolean>;
}
