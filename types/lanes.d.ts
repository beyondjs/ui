/** Types of 0.22.0's `Lanes`, re-exported by `@beyond-js/ui` and `/dom` (through `rail.d.ts`). */
import type { Component, Content } from './dom.js';
import type { Copy } from './notifications.js';
import type { Clock, Moment } from './operations.js';

/** A lane's state: its mark takes the shape and hue of a `Status` (progress, attention, success, failure, idle, unknown). */
export type LaneState = 'running' | 'waiting' | 'done' | 'failed' | 'stopped' | 'unknown';
/** A short figure at a lane's end, in tabular figures; `label` is read after it, hidden ("48k" read "48k tokens"). */
export type LaneFact = string | number | { text: string | number; label?: string | null };
/** One lane of `Lanes.update({ lanes })`. */
export interface Lane {
	/** Its stable identity: a lane is patched by key, never rebuilt. */
	key: string | number;
	/** 0 to 3, drawn as indentation under a tree connector; a depth outside is drawn at the nearest. */
	depth?: number;
	/** Anything else reads as `unknown`. */
	state?: LaneState | string;
	/** The product's word for the state ("Waiting for you"), read before the title; else `labels`' word. */
	stateLabel?: string | null;
	title: Content;
	/** Muted, its own column ("Explore"); none below 40rem. */
	kind?: Content | null;
	/** The live line ("Reading src/auth/session.ts"), changed in place. */
	now?: Content | null;
	facts?: Array<LaneFact | null | false>;
	since?: Moment | null;
	/** While null, a running or waiting lane counts on the clock. */
	until?: Moment | null;
	/** The lane whose detail is open (`aria-current`). */
	current?: boolean;
}
export interface LanesOptions {
	/** The group's name ("Subagents of this turn"); `labels.group` without one. */
	label?: string | null;
	clock?: Clock;
	locale?: string;
	labels?: Copy;
	/** The trace column (default true). */
	trace?: boolean;
	/** What choosing a lane (a press, Enter or Space) does. */
	choose?: ((key: string, event: Event) => void) | null;
}
/** Concurrent work as lanes on one time axis, aligned in shared columns, one line from 40rem and two below (0.22.0). */
export class Lanes extends Component {
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	static readonly states: readonly LaneState[];
	/** A live axis' steps in minutes, then doubling. */
	static readonly steps: readonly number[];
	constructor(options?: LanesOptions);
	/** The lanes' keys in their order. */
	readonly keys: string[];
	/** Changes what is given; lanes are patched by key, so the one that holds focus keeps it. */
	update(values: { lanes?: Array<Lane | null | false>; label?: string | null; trace?: boolean }): this;
	/** Moves focus to a lane and gives it the tab order; false when there is none. */
	focus(key: string | number, options?: FocusOptions): boolean;
}

// Only the declarations marked `export` are public.
export {};
