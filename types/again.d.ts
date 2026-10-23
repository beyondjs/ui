/** Types of an outage read again by itself (0.17.1, D132), re-exported by `@beyond-js/ui/dom`. */
import type { Component, Copy, Button } from './dom.js';

/** Where an `Again` stands. */
export interface AgainMoments {
	/** Whether it waits for an answer */
	readonly active: boolean;
	/** Whether a try runs */
	readonly trying: boolean;
	/** When it last tried, in milliseconds */
	readonly last: number | null;
	/** When it tries next, in milliseconds */
	readonly next: number | null;
}

export interface AgainOptions {
	/** One read: resolves (with anything but `false`) when it answered, rejects or resolves `false` when it did not. */
	run: () => Promise<unknown>;
	/** The waits between tries in milliseconds; the last repeats (`Again.steps`: 5, 15, 30, 60 s). */
	steps?: readonly number[];
	now?: () => number;
	timers?: { setTimeout: (work: () => void, wait: number) => unknown; clearTimeout: (timer: any) => void };
	/** What says `online` (the window). */
	events?: EventTarget | null;
	/** What says `visibilitychange` (the document). */
	page?: (EventTarget & { visibilityState?: string }) | null;
}

/** An outage read again by itself: 5, 15, 30 and 60 s, then every 60 s, at once on `online` and when the page is shown again; one try at a time. */
export class Again {
	static readonly steps: readonly number[];
	constructor(options: AgainOptions);
	readonly active: boolean;
	readonly trying: boolean;
	readonly last: number | null;
	readonly next: number | null;
	readonly moments: AgainMoments;
	listen(listener: (moments: AgainMoments) => void): () => void;
	/** Starts waiting; the failed read that found the outage is the first try. */
	start(): void;
	/** Tries now (one try at a time); resolves whether it answered. */
	now(): Promise<boolean>;
	stop(): void;
}

/** "Last tried 12:04 · trying again by itself", or "Trying again…" while a try runs. */
export class AgainLine extends Component {
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	constructor(options: { again: Again; locale?: string; labels?: Copy; now?: () => number });
	readonly text: string;
	static say(moments: Pick<AgainMoments, 'active' | 'trying' | 'last'>, options?: { labels?: Copy; locale?: string; now?: number }): string;
}

/** Labelled, secondary refresh action for a safe read or transport reconnect. */
export class RetryAction extends Button {
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	constructor(options: { run: () => unknown | Promise<unknown>; labels?: Copy; small?: boolean; name?: string | null });
	busy: boolean;
}

/** A failed read or transport belonging to one explicitly identified dependency and context. */
export interface RecoveryEntry {
	/** What could not be read, in the notice's Technical details; the read says it in its own place. */
	title: string;
	details?: import('./operations.js').DetailsRecord | null;
	/** Bounded read: false/rejection retains the symptom; an answer removes it. Never a write. */
	run: () => unknown | Promise<unknown>;
	/** False for a transport that already reconnects itself. */
	automatic?: boolean;
}

/**
 * One outage said once (0.24.0, D163): a line with who did not answer, when it last tried and one Try again,
 * listing nothing; its reads' evidence under one Technical details. `whole`: the page's body in
 * `Unavailable`'s form when nothing on the page could be read. Independent instances never merge.
 */
export class Recovery extends Component {
	constructor(options: { title: string; labels?: Copy; locale?: string; again?: Omit<AgainOptions, 'run'>; focus?: (() => HTMLElement | null) | null; whole?: boolean; level?: 2 | 3 | 4 | 5 | 6 });
	readonly size: number;
	/** Who did not answer. */
	title: string;
	/** The page's body rather than a line above the page's regions. */
	whole: boolean;
	set(key: unknown, entry: RecoveryEntry): void;
	delete(key: unknown): void;
	now(): Promise<boolean>;
}

/** "Last updated 12:04" over content kept from an earlier read, or "May be out of date" when its time is unknown (0.24.0). */
export class LastUpdate extends Component {
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	constructor(options?: { time?: import('./operations.js').Moment | null; locale?: string; labels?: Copy; now?: () => number });
	readonly text: string;
	/** When the kept content was read, in milliseconds, or null. */
	time: number | null;
	static say(time: import('./operations.js').Moment | null, options?: { labels?: Copy; locale?: string; now?: number }): string;
}
