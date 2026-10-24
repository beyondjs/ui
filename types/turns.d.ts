/** Types of 0.29.0's `TurnIndex`, re-exported by `@beyond-js/ui` and `/dom` (through `rail.d.ts`). */
import type { Component } from './dom.js';
import type { Copy } from './notifications.js';

/** A state a turn's mark says with its `Status` shape: it runs, it needs the person, or it failed. */
export type TurnState = 'running' | 'waiting' | 'failed';
/** One turn of `TurnIndex.update({ turns })`. */
export interface Turn {
	/** Its stable identity: a mark is patched by key, never rebuilt. */
	key: string | number;
	/** What names the turn: the person's message, as plain text. */
	title: string;
	/** The start of its answer, as plain text, shown in the preview. */
	summary?: string | null;
	/** Short facts in the preview ("Changed 2 files", "12:01", "1 min 5 s"). */
	facts?: Array<string | null | false>;
	/** Any other value is drawn as a dash alone. */
	state?: TurnState | string | null;
	/** The product's word for the state ("Needs you"), said after the title; else `labels`' word. */
	stateLabel?: string | null;
	/** The turn's address: the mark is then a link the browser follows. */
	href?: string | null;
	/** The turn on the page, whose position says which turn is read. */
	element?: Element | null;
	/** Its opening message, whose position says whether it is out of view. */
	head?: Element | null;
}
/** Which turn is read, and whether its opening message is out of view above the page's sticky edge. */
export interface TurnSeen {
	key: string | null;
	covered: boolean;
}
export interface TurnIndexOptions {
	/** The index's name ("Turns"); `labels.group` without one. */
	label?: string | null;
	labels?: Copy;
	/** What choosing a turn does: a press on a mark without `href`, or the page's keys. */
	choose?: ((key: string, how: 'press' | 'key') => void) | null;
	/** The turn being read changed. */
	onview?: ((seen: TurnSeen) => void) | null;
	/** Option/Alt with ArrowUp and ArrowDown on the page (default true). */
	keys?: boolean;
}
/** A thread's index of its turns: one mark per turn beside them, with a preview and the keys that move between them (0.29.0, D182). */
export class TurnIndex extends Component {
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	static readonly states: readonly TurnState[];
	constructor(options?: TurnIndexOptions);
	/** The turns' keys in their order. */
	readonly keys: string[];
	/** The key of the turn being read, or null. */
	readonly current: string | null;
	/** Whether the opening message of the turn being read is out of view. */
	readonly covered: boolean;
	/** Changes what is given; marks are patched by key, so the one that holds focus keeps it. */
	update(values: { turns?: Array<Turn | null | false>; label?: string | null }): this;
	/** Decides at once which turn is read. */
	measure(): void;
	/** Moves to the previous (-1) or next (1) turn; false when there is nowhere to go. */
	move(step: number): boolean;
	/** Moves focus to a mark and gives it the tab order; false when there is none. */
	focus(key: string | number, options?: FocusOptions): boolean;
}

// Only the declarations marked `export` are public.
export {};
