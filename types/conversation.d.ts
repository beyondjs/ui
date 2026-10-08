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
/** What `onsubmit` receives: the trimmed text, the id of the action that sent it and, when there are some, the attachments as given (0.11.0). */
export interface ComposerMessage {
	text: string;
	action: string;
	attachments?: ComposerAttachment[];
}
/** One attachment's chip (0.11.0); the product sets the list and keeps it current. */
export interface ComposerAttachment {
	key: string;
	name: string;
	/** Bytes, said as "1.2 MB". */
	size?: number | null;
	/** Its media type; an image shows a thumbnail. */
	type?: string | null;
	/** `uploading` (with `progress`), `failed` (with `reason`, and Retry when `attach.onretry` is given) or `ready` (default). */
	state?: 'uploading' | 'failed' | 'ready';
	/** 0 to 1 while uploading. */
	progress?: number | null;
	reason?: string | null;
	/** The product's object URL for an image's thumbnail, or a Blob (an object URL is then made and revoked here). */
	thumbnail?: string | Blob | null;
	/** The File: an image's thumbnail is made from it when no `thumbnail` is given. */
	file?: File | null;
	/** `false` offers no Retry for this one. */
	retry?: boolean;
}
/** How files reach the composer (0.11.0); the product checks types and sizes and sets the chips. */
export interface ComposerAttach {
	/** Attach's word ("Attach" by default). */
	label?: string | null;
	/** The file input's `accept`. */
	accept?: string | null;
	/** More than one file at a time (default true). */
	multiple?: boolean;
	onfiles: (files: File[], via: 'paste' | 'drop' | 'pick') => void;
	onremove?: ((item: ComposerAttachment) => void) | null;
	onretry?: ((item: ComposerAttachment) => void) | null;
}
/** One suggestion after the trigger (0.11.0): `value` replaces the token. */
export interface ComposerSuggestion {
	value: string;
	label?: string | null;
	detail?: string | null;
	/** The label in the monospaced face (a path). */
	mono?: boolean;
}
export interface ComposerSuggestSettings {
	/** One character, `@` by default. */
	trigger?: string;
	/** Milliseconds before an ask is unavailable (8000). */
	bound?: number;
	/** Milliseconds after the last keystroke (120). */
	delay?: number;
	/** The listbox's name ("Suggestions"). */
	label?: string | null;
	/** The words of a failure, "Unavailable · {reason}". */
	explain?: ((error: unknown) => string | null) | null;
}
/**
 * What a source answers (0.11.0): the suggestions, or (0.11.1) a part of what matches with what it says
 * of the rest: `total` (how many match), `more: true` (more match, how many unknown) or `note` (its own
 * words for the list's last line, which win). A cut list ends with "50 of 120 · keep typing to narrow".
 */
export type ComposerSuggestAnswer = ComposerSuggestion[] | { items: ComposerSuggestion[]; total?: number | null; more?: boolean; note?: string | null };
/** A narrow composer's Options (0.11.1), read from `composer.fold`. */
export interface ComposerFold {
	/** Whether the folded settings and Attach are shown. */
	readonly open: boolean;
	/** The Options control (the `more` glyph, named "Options"); placed only while there is something to fold. */
	readonly button: HTMLButtonElement;
	/** Shows (`true`), folds (`false`) or switches what it folds. */
	toggle(open?: boolean): void;
}
/** The state line with an action at its end (0.11.0). */
export interface ComposerStatusLine {
	text: Content;
	action?: Part | { label: string; run: () => unknown } | null;
}
/** The open suggestions, read from `composer.suggestions`. */
export interface ComposerSuggestions {
	readonly open: boolean;
	readonly state: 'closed' | 'looking' | 'results' | 'none' | 'unavailable';
	close(): void;
}
export type ComposerSubmit = 'enter' | 'mod';
export interface ComposerOptions {
	/** The field's accessible name; never drawn. */
	label: string;
	/** Sends; a rejection gives the text back to the field. */
	onsubmit: (message: ComposerMessage) => Promise<unknown>;
	placeholder?: string | null;
	/** The state line above the box: one sentence, only when it changes what sending does, with its action (0.11.0). */
	status?: Content | ComposerStatusLine | null;
	/** The turn's choices at the toolbar's start, before the tools (0.11.0). */
	settings?: Part[];
	/** Files from paste, drop and Attach (0.11.0). */
	attach?: ComposerAttach | null;
	/** The chips (0.11.0). */
	attachments?: ComposerAttachment[];
	/** Suggestions after the trigger (0.11.0); every ask is bounded and aborted by `signal`. */
	onsuggest?: ((query: string, signal: AbortSignal) => Promise<ComposerSuggestAnswer> | ComposerSuggestAnswer) | null;
	suggest?: ComposerSuggestSettings | null;
	/** The language of sizes, percents and counts. */
	locale?: string;
	/** Under 30rem of composer, fold the settings and Attach behind one Options control so the toolbar keeps one row (0.11.1, default true). */
	compact?: boolean;
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
	set status(value: Content | ComposerStatusLine | null);
	set settings(nodes: Part[]);
	/** The chips as given (0.11.0). */
	attachments: ComposerAttachment[];
	/** The suggestions, or null without `onsuggest` (0.11.0). */
	readonly suggestions: ComposerSuggestions | null;
	/** The narrow toolbar's Options (0.11.1). */
	readonly fold: ComposerFold;
	/** Opens the platform's file chooser, as Attach does (0.11.0). */
	attach(): void;
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
