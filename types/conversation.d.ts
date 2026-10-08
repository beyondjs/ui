/** Types of the conversation pieces of 0.10.0 (`Composer`, `LiveText`, `ActivityRow`, `ActivityGroup`), re-exported by `@beyond-js/ui` and `/dom`. */
import type { Component, Content, Copy } from './dom.js';
import type { IconName } from './icons.js';
import type { Clock, Moment } from './operations.js';

type Copies = { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
type Part = Node | { element: Node };

/** One way to send: the first marked `primary` (else the first) is the button, the others the split menu. */
export interface ComposerAction {
	id: string;
	label: string;
	primary?: boolean;
}
/** The stop action while work runs (Interrupt): busy while `run` works or while `busy` says so. */
export interface ComposerStop {
	label: string;
	run: () => unknown;
	busy?: boolean;
}
/** What `onsubmit` receives: the trimmed text and the id of the action that sent it. */
export interface ComposerMessage {
	text: string;
	action: string;
}
export type ComposerSubmit = 'enter' | 'mod';
export interface ComposerOptions {
	/** The field's accessible name; never drawn. */
	label: string;
	/** Sends; a rejection gives the text back to the field. */
	onsubmit: (message: ComposerMessage) => Promise<unknown>;
	placeholder?: string | null;
	/** The state line: one sentence, only when it changes what sending does. */
	status?: Content | null;
	/** The toolbar's start (context choices). */
	tools?: Part[];
	/** The toolbar's end, before the actions. */
	extras?: Part[];
	/** The ways to send ("Send" by default). */
	actions?: ComposerAction[] | null;
	stop?: ComposerStop | null;
	/** Sending is unavailable, with the reason said beside the action (D44). */
	disabled?: { reason?: string | null } | null;
	/** The product's own work: nothing is sent meanwhile. */
	busy?: boolean;
	/** `'enter'` (default): Enter sends on a hardware keyboard; `'mod'`: only ⌘/Ctrl+Enter. */
	submit?: ComposerSubmit;
	value?: string;
	/** Lines when empty (1). */
	min?: number;
	/** Lines before the field scrolls (12). */
	max?: number;
	name?: string | null;
	/** The text changed, by the person or by sending. */
	onchange?: ((text: string) => void) | null;
	/** What a rejected send says; null says nothing (another voice speaks). Without it: "Not sent. Your message is still here." */
	explain?: ((error: unknown) => string | null) | null;
	/** `send`, `more`, `busy`, `enter`, `mod`, `touch`, `empty`, `failed` (`Composer.labels.en` / `.es`). */
	labels?: Copy;
}
/** A message box: a state line, a field of one line that grows to twelve, tools, and the ways to send (0.10.0). */
export class Composer extends Component {
	static readonly labels: Copies;
	static readonly submits: readonly ComposerSubmit[];
	constructor(options: ComposerOptions);
	/** The textarea. */
	readonly field: HTMLTextAreaElement;
	/** Replaces the text without calling `onchange`. */
	value: string;
	set placeholder(text: string | null);
	set status(value: Content | null);
	set tools(nodes: Part[]);
	set extras(nodes: Part[]);
	set actions(list: ComposerAction[] | null);
	set stop(value: ComposerStop | null);
	disabled: { reason?: string | null } | null;
	busy: boolean;
	/** Whether a send is in flight. */
	readonly sending: boolean;
	/** Sends the field's text with an action (the primary one by default); resolves whether it was sent. */
	submit(action?: string | null): Promise<boolean>;
	focus(): void;
	/** Fits the field's height to its text (`mount` does it). */
	fit(): void;
}

/** Text that arrives in pieces: drawn at most once per frame, marked live, then settled or abandoned (0.10.0). */
export class LiveText extends Component {
	static readonly labels: Copies;
	/** The characters a live text keeps by default (64 000). */
	static bound: number;
	constructor(options?: { text?: string; render?: ((text: string) => Node | string | null) | null; bound?: number; labels?: { live?: string; abandoned?: string } });
	readonly text: string;
	readonly state: 'live' | 'settled' | 'abandoned';
	/** Whether pieces past the bound were dropped. */
	readonly truncated: boolean;
	append(piece: string): void;
	set(text: string): void;
	settle(text?: string): void;
	abandon(note?: string | null): void;
}

export type ActivityState = 'running' | 'done' | 'failed' | 'denied' | 'waiting';
/** A section of an opened row: text in a code box (first `lines`, "Show all", "Copy"), a sentence, or the product's node. */
export type ActivitySection = { label?: Content | null; text: string; code?: boolean; lines?: number; copy?: boolean } | { label?: Content | null; content: Part };
export type ActivityPart = Node | { element: Node } | string | ActivitySection;
export interface ActivityValues {
	glyph?: IconName;
	title?: Content;
	meta?: Content | null;
	state?: ActivityState;
	since?: Moment | null;
	until?: Moment | null;
	/** Milliseconds it took, when the times are not known. */
	duration?: number | null;
	/** The last output of a running step, shown under the row. */
	tail?: string | null;
	/** What opening shows, built on first open. */
	body?: (() => ActivityPart | ActivityPart[] | null) | ActivityPart[] | null;
}
/** One step of work: glyph, title, meta and state in words, a duration on the clock, a body built on first open (0.10.0). */
export class ActivityRow extends Component {
	static readonly labels: Copies;
	static readonly states: readonly ActivityState[];
	/** The lines of a live tail kept (6). */
	static tail: number;
	constructor(options: ActivityValues & { title: Content; open?: boolean; clock?: Clock; locale?: string; labels?: Copy });
	readonly state: ActivityState;
	readonly expanded: boolean;
	/** The body's content element. */
	readonly body: HTMLElement;
	/** Changes what is given; open state and focus stay. */
	update(values: ActivityValues): this;
	open(): void;
	close(): void;
	toggle(): void;
	/** Hears every update; returns the release. */
	watch(listener: (row: ActivityRow) => void): () => void;
}
/** Consecutive rows folded into one ("Read 3 files"), showing the state that matters most among them (0.10.0). */
export class ActivityGroup extends Component {
	static readonly labels: Copies;
	constructor(options: { glyph?: IconName; title: string | ((count: number) => string); meta?: Content | null; rows?: ActivityRow[]; open?: boolean; labels?: Copy });
	rows: ActivityRow[];
	readonly state: ActivityState;
	readonly expanded: boolean;
	add(row: ActivityRow): this;
	/** Takes a row out without destroying it. */
	remove(row: ActivityRow): ActivityRow;
	update(values: { glyph?: IconName; title?: string | ((count: number) => string); meta?: Content | null }): this;
	open(): void;
	close(): void;
	toggle(): void;
}

// Only the declarations marked `export` are public.
export {};
