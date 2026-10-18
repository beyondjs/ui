/** Types of an outage read again by itself (0.17.1, D132), re-exported by `@beyond-js/ui/dom`. */
import type { Component, Copy } from './dom.js';

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
