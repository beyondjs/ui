/** Types of 0.14.0's additions: the composer's tray, commands, recall, taller editor and dictation (D100), `ActionLine` (D102) and `Highlighter`, re-exported by `@beyond-js/ui` and `/dom`. */
import type { Component, Content, Copy } from './dom.js';

type Part = Node | { element: Node } | null;
type Copies = { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };

/** A command after "/" at the field's start: `run` makes it the product's action (its token leaves the field), else `value` is inserted. */
export interface ComposerCommand {
	value: string;
	label?: string;
	detail?: string;
	mono?: boolean;
	run?: ((command: { value: string }) => void) | null;
}
/** Dictation (0.14.0): voice to editable text at the caret, never sent by itself; the audio stays in memory. */
export interface DictationOptions {
	/** Sends the recording to the product's service; `signal` aborts it (Cancel, or past `bound`). */
	transcribe: (blob: Blob, options: { signal: AbortSignal; type: string; seconds: number }) => Promise<{ text: string }>;
	/** Seconds a recording may last (120); said ten seconds before, then stopped and transcribed. */
	cap?: number;
	/** Milliseconds the transcription may take (55000), then it is unavailable with the recording kept. */
	bound?: number;
	/** Seconds under which nothing is transcribed (1): "Too short to transcribe". */
	minimum?: number;
	/** The product's words for a rejection: a string (a limit, Discard only), `{ text, retry }`, or null (another voice speaks). */
	explain?: ((error: unknown) => string | { text: string; retry?: boolean } | null) | null;
	/** Replaces entries of `ComposerDictation.labels.en`. */
	labels?: Copy;
}
/** The composer's options of 0.14.0, part of `ComposerOptions`. */
export interface ComposerEdges {
	/** Compact chips on the box's lower edge: the context to choose before the first send (D100). */
	tray?: Part[] | null;
	/** Commands after "/" at the field's start: a list (filtered by what follows the "/") or a source. */
	commands?: ComposerCommand[] | ((query: string, signal: AbortSignal) => Promise<ComposerCommand[]> | ComposerCommand[]) | null;
	/** ArrowUp in an empty field brings this text back to edit (its last queued message); null leaves it. */
	recall?: (() => string | null | Promise<string | null>) | null;
	/** Offers Dictate where the browser can record (WebM with Opus, WebM, then MP4; never Ogg). */
	dictation?: DictationOptions | null;
	/** The **+** menu's entries after Attach files (0.26.0, D165); none: the + attaches at once. */
	add?: ComposerEntry[];
	/** The product's work runs now (the engine answering): the box's edge shows it (0.26.0). */
	live?: boolean;
}
/** One entry of the composer's **+** menu after Attach files (0.26.0): its words, what it does, and the key that does the same in the field ("@", "/"). */
export interface ComposerEntry {
	label: string;
	run: () => unknown;
	keys?: string | null;
}
export type DictationState = 'idle' | 'asking' | 'recording' | 'transcribing' | 'failed';
export type DictationFailure = 'denied' | 'missing' | 'busy' | 'interrupted' | 'short' | 'none' | 'unavailable' | 'limit' | 'silent';
/** A composer's Dictate and its line (0.14.0); `composer.dictation`. */
export class ComposerDictation {
	static readonly labels: Copies;
	readonly button: HTMLButtonElement;
	readonly element: HTMLElement;
	readonly state: DictationState;
	readonly failure: DictationFailure | null;
	/** Whether the browser can record here; `reason` says why not (`insecure`, `unsupported`, `type`). */
	readonly available: boolean;
	readonly reason: 'insecure' | 'unsupported' | 'type' | null;
	start(): Promise<void>;
	stop(): Promise<void>;
	cancel(): void;
	retry(): Promise<void>;
	discard(): void;
	destroy(): void;
}
/** A composer's taller editor (0.14.0); `composer.editor`. */
export interface ComposerEditor {
	readonly expanded: boolean;
	open(): void;
	close(): void;
	toggle(): void;
}

/** A quiet line of secondary actions under content (0.14.0, D102): one muted control style, then facts in tabular figures. */
export class ActionLine extends Component {
	constructor(options?: { actions?: Part[]; facts?: Array<Content | null>; label?: string | null });
	set actions(nodes: Part[]);
	set facts(values: Array<Content | null>);
}

export type HighlighterKind = 'comment' | 'keyword' | 'string' | 'number' | 'name' | 'tag';
/** A small, dependency-free highlighter (0.14.0): text nodes and `span.bui-code-<kind>` only, safe under a strict CSP and Trusted Types. */
export class Highlighter {
	/** Texts longer than this many characters stay plain (200000). */
	static limit: number;
	static readonly kinds: readonly HighlighterKind[];
	/** `javascript`, `typescript`, `json`, `shell`, `css`, `html`, `markdown`, `python`. */
	static readonly languages: readonly string[];
	/** The canonical name of a language or alias (`js`, `ts`, `sh`, `py`…), or null. */
	static language(name: string | null | undefined): string | null;
	/** The language of a file path, or null. */
	static from(path: string | null | undefined): string | null;
	constructor(language?: string | null);
	readonly language: string | null;
	tokens(text: string): Array<{ kind: HighlighterKind | null; text: string }>;
	fill<T extends Element | DocumentFragment>(element: T, text: string): T;
}

// Only the declarations marked `export` are public.
export {};
