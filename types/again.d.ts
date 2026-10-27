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
	/** Whether the browser says it is offline (0.33.0): a try that falls due waits for `online` */
	readonly offline?: boolean;
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
	/** What says whether the browser is online (the navigator, 0.33.0). */
	network?: { onLine?: boolean } | null;
}

/** An outage read again by itself: 5, 15, 30 and 60 s, then every 60 s, at once on `online` and when the page is shown again; one try at a time. */
export class Again {
	static readonly steps: readonly number[];
	constructor(options: AgainOptions);
	readonly active: boolean;
	readonly trying: boolean;
	readonly last: number | null;
	readonly next: number | null;
	/** Whether the browser says it is offline (0.33.0). */
	readonly offline: boolean;
	readonly moments: AgainMoments;
	listen(listener: (moments: AgainMoments) => void): () => void;
	/** Starts waiting; the failed read that found the outage is the first try. */
	start(): void;
	/** Tries now (one try at a time); resolves whether it answered. */
	now(): Promise<boolean>;
	stop(): void;
}

/** "Last tried 12:04 · trying again by itself", "Trying again…" while a try runs, and offline "… · trying again as soon as you're back online" (0.33.0). */
export class AgainLine extends Component {
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	constructor(options: { again: Again; locale?: string; labels?: Copy; now?: () => number });
	readonly text: string;
	static say(moments: Pick<AgainMoments, 'active' | 'trying' | 'last' | 'offline'>, options?: { labels?: Copy; locale?: string; now?: number }): string;
}

/** Labelled, secondary refresh action for a safe read or transport reconnect. */
export class RetryAction extends Button {
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	/** `locale` (0.44.0) chooses the word's language before `<html lang>`. */
	constructor(options: { run: () => unknown | Promise<unknown>; labels?: Copy; small?: boolean; name?: string | null; locale?: string });
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
 * Offline (0.33.0) it says "You're offline" with no Try again, once for the page (the first notice), unless `local`.
 */
export class Recovery extends Component {
	/** Try again, the last-tried line and the offline cause in English and Spanish (0.33.0). */
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	constructor(options: { title: string; labels?: Copy; locale?: string; again?: Omit<AgainOptions, 'run'>; focus?: (() => HTMLElement | null) | null; whole?: boolean; level?: 2 | 3 | 4 | 5 | 6; /** what did not answer runs on this computer: named even offline (0.33.0) */ local?: boolean });
	readonly size: number;
	/** Who did not answer, as the product named it; offline the line says "You're offline" instead. */
	title: string;
	/** What did not answer runs on this computer (0.33.0). */
	readonly local: boolean;
	/** Whether the line says the person is offline now (0.33.0). */
	readonly offline: boolean;
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

/** A change that did not get its answer (D186, 0.33.0): answered unavailable (nothing was changed) or with no answer (it may have been made). */
export interface ChangeOutcomeRecord {
	outcome: 'unavailable' | 'unknown';
	/** Who did not answer, from the family's catalog ("Beyond Projects did not answer") */
	cause?: string | null;
	/** The way to check an unknown outcome: a node, a link or an action that reads it again */
	check?: Node | { label: string; href?: string | null; run?: ((event: Event) => void) | null } | null;
	/** Its request under Technical details */
	details?: import('./operations.js').DetailsRecord | null;
	/** The person's own Try again of a change answered unavailable, never of an unknown outcome (0.33.0) */
	again?: (() => unknown) | { run: () => unknown } | null;
}

/** Who did not answer by its name in the family's catalog of causes (0.33.0): `CauseName.of('cdn')` is "Beyond CDN", `of('conduict')` "Conduict". */
export class CauseName {
	static of(source: string | null | undefined): string;
}

/** A change's outcome said in the warning tone at the operation (D186, 0.33.0); `FocusedForm`, `confirm` and `prompt` draw what `explain` returns this way. */
export class ChangeOutcome {
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	static is(value: unknown): value is ChangeOutcomeRecord;
	static draw(outcome: ChangeOutcomeRecord, labels?: Copy): HTMLElement;
	/** What `explain` returned, drawn: an outcome, `{ text, tone }` in its tone, or a string in danger. */
	static answer(value: string | ExplainAnswer, labels?: Copy): HTMLElement;
}

/** What a form's or a question's `explain(error)` may return (0.33.0): a change's outcome, or words with their tone. */
export type ExplainAnswer = ChangeOutcomeRecord | { text: string; tone?: 'warning' | 'danger' };
