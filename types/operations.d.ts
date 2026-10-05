/** Types of the long-operation components (0.5.0, decision D50), part of `@beyond-js/ui/dom`. */
import type { Copy } from './notifications.js';
import type { Component, Tone } from './dom.js';

/** A moment as an ISO string, milliseconds since the epoch or a Date. */
export type Moment = string | number | Date;

/** The page's time and beat: one timer while anything listens. */
export class Clock {
	constructor(options?: { now?: () => number; every?: number });
	/** The shared clock on the system time. */
	static readonly system: Clock;
	readonly now: number;
	readonly size: number;
	/** Calls `listener` on every beat; returns the release. */
	subscribe(listener: (now: number) => void): () => void;
	/** Calls every listener now. */
	tick(): void;
}

/** How long a step or a wait usually takes, measured, in milliseconds: "usually about" is the median; "taking longer than usual" starts past `p90`. */
export interface Expected {
	median: number;
	p90?: number;
}

export type StepState = 'done' | 'progress' | 'stalled' | 'failed' | 'waiting';

/** The source's own words, the request identifier and the time, folded under "Technical details". */
export interface DetailsRecord {
	text?: string;
	request?: string | null;
	time?: Moment | null;
}

export interface Step {
	/** Identifies the step across updates (its place otherwise), for announcing a change of state. */
	id?: string;
	label: string;
	state: StepState;
	since?: Moment | null;
	until?: Moment | null;
	expected?: Expected | null;
	/** The finer progress its source published. */
	phase?: { label: string; since?: Moment | null } | null;
	/** Why a `stalled` or `failed` step cannot go on. */
	reason?: string | { text: string; details?: DetailsRecord | null } | null;
}

/**
 * Copy of `Steps` (`Steps.labels.en`/`.es`): units `second`, `minute`, `hour`, `day` ("{count} s");
 * states `done` "Done", `progress` "In progress", `stalled` "Blocked", `failed` "Failed", `waiting`
 * "Waiting"; `took` "Took {duration}", `running` "{elapsed} so far", `usual` "{elapsed} so far · usually
 * about {expected}", `slow` "Taking longer than usual · {elapsed} so far · usually about {expected}",
 * `phase` "Now: {phase} · {elapsed}", `stopped` "Last phase: {phase}", announcements `change` "{step}:
 * {state}" and `late` "{step}: taking longer than usual"; `details` holds the technical details' copy.
 */
export type StepsLabels = Copy & { details?: Copy };

export class Steps extends Component {
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	constructor(options: { label: string; steps?: Array<Step | null | false>; clock?: Clock; locale?: string; labels?: StepsLabels });
	/** The steps as drawn: `key` (the id, else the place), `label` and `state`. */
	get steps(): Array<{ key: string; label: string; state: StepState }>;
	set steps(value: Array<Step | null | false>);
	/** The words last announced. */
	readonly announced: string;
	tick(): void;
}

/** A reason that replaces the awaited card's time: why, the way on, an action and technical details. */
export interface AwaitedReason {
	text: string;
	way?: string | null;
	action?: { label: string; href?: string | null; run?: (() => void) | null } | null;
	details?: DetailsRecord | null;
}

export type AwaitedState = 'progress' | 'late' | 'slow' | 'stalled' | 'done' | 'failed';

export interface AwaitedOptions {
	title: string;
	since?: Moment | null;
	expected?: Expected | null;
	steps?: Array<Step | null | false> | null;
	reason?: AwaitedReason | null;
	/** Reads the operation again; runs once at a time. */
	check?: (() => Promise<unknown>) | null;
	/** After `end()`: where a product says "Ready · …" in the tab's title or moves on. */
	onend?: ((outcome: 'done' | 'failed') => void) | null;
	clock?: Clock;
	locale?: string;
	level?: 2 | 3 | 4 | 5 | 6;
	/**
	 * `since` "Since {time}", `left` "About {duration} left", `brief` "Less than a minute left", `slow`
	 * "Taking longer than usual", `unknown` "Time left unknown", `progress` "Progress: {title}", `check`
	 * "Check again", `unchecked` "The check did not finish. Try again.", `done` "Done", `failed` "Did not
	 * finish", announcements `ended`, `stopped`, `late`, `blocked`; `steps` and `details` reach the parts.
	 */
	labels?: Copy & { steps?: StepsLabels; details?: Copy };
}

export class Awaited extends Component {
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	constructor(options: AwaitedOptions);
	readonly state: AwaitedState;
	readonly ended: 'done' | 'failed' | null;
	readonly announced: string;
	readonly steps: Steps | null;
	update(values: Partial<Pick<AwaitedOptions, 'title' | 'since' | 'expected' | 'steps' | 'reason' | 'check'>>): void;
	tick(): void;
	/** Runs `check` once at a time. */
	again(): Promise<void>;
	end(outcome?: 'done' | 'failed'): void;
}

export interface AwaitedLineOptions {
	title: string | Node;
	since?: Moment | null;
	expected?: Expected | null;
	/** Why it cannot continue, in place of the time */
	reason?: string | Node | null;
	check?: (() => Promise<unknown>) | null;
	onend?: ((outcome: 'done' | 'failed') => void) | null;
	clock?: Clock;
	locale?: string;
	labels?: Copy;
}
/** `Awaited` in one line, for a row (0.7.1): "Cloning · 40 s so far · usually about 1 min". */
export class AwaitedLine extends Component {
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	constructor(options: AwaitedLineOptions);
	readonly state: AwaitedState;
	readonly ended: 'done' | 'failed' | null;
	readonly announced: string;
	/** The line as it reads. */
	readonly text: string;
	update(values: Partial<Pick<AwaitedLineOptions, 'title' | 'since' | 'expected' | 'reason' | 'check'>>): void;
	tick(): void;
	again(): Promise<void>;
	end(outcome?: 'done' | 'failed'): void;
}

export interface FreshnessValues {
	label: string;
	tone?: Tone | 'progress';
	checked?: Moment | null;
	connected?: boolean;
}

/** A state with "Checked {duration} ago", or "Last known: {state} · {time}" while disconnected. */
export class Freshness extends Component {
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	/** Milliseconds under which it reads "Checked just now". */
	static recent: number;
	constructor(options: FreshnessValues & { clock?: Clock; locale?: string; labels?: Copy });
	readonly stale: boolean;
	readonly text: string;
	update(values: Partial<FreshnessValues>): void;
	tick(): void;
}

/** "Technical details": the words, the request and the time, copyable for support (D43). */
export class TechnicalDetails extends Component {
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	/** Milliseconds the clipboard may take before the copy counts as refused. */
	static bound: number;
	constructor(options?: DetailsRecord & { open?: boolean; locale?: string; labels?: Copy });
	open: boolean;
	/** The text the copy action copies. */
	readonly report: string;
	update(values: DetailsRecord): void;
	/** True when the clipboard took it; false after saying the refusal in place. */
	copy(): Promise<boolean>;
}
