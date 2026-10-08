/** Types of a resource panel's parts of 0.11.0 (`Facts`, `Meter`) and `ChoiceChip`, re-exported by `@beyond-js/ui` and `/dom`. */
import type { Component, Content, Copy } from './dom.js';
import type { ChoiceMenu, ChoiceMenuOptions } from './choose.js';
import type { Clock, Moment } from './operations.js';

type Copies = { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
type Part = Node | { element: Node };
export type FactsTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'progress';

/** What the rows are about: a heading, one summary value and one state in words. */
export interface FactsHead {
	title?: Content | null;
	/** One summary value ("3 files · +52 −3"). */
	value?: Content | null;
	/** One state in words with its tone ("Not pushed"); a state without words is none. */
	state?: [string, FactsTone] | { label: string; tone?: FactsTone } | null;
	/** The heading's level (3 by default). */
	level?: 2 | 3 | 4;
}
/** One row: a label, its value at the row's end, its own action. */
export interface FactsRow {
	/** Matches the row across updates (else its label). */
	key?: string;
	label: Content;
	value?: Content | number | null;
	/** The value in the monospaced face: identifiers, commands, paths, models. */
	mono?: boolean;
	/** The row's own action, such as Copy. */
	action?: Part | null;
	/** Not current: true ("Not current") or the product's note ("Not reported since 23:10"). */
	stale?: boolean | string | null;
}
/** Label and value rows for a resource's panel (0.11.0), flat, patched by key. */
export class Facts extends Component {
	static readonly labels: Copies;
	static readonly tones: readonly FactsTone[];
	/** A state as `{ label, tone }`, or null for none. */
	static state(state: FactsHead['state']): { label: string; tone: FactsTone } | null;
	constructor(options?: { head?: FactsHead | null; rows?: Array<FactsRow | null | false>; label?: string | null; labels?: { stale?: string } });
	/** The description list. */
	readonly list: HTMLDListElement;
	set head(head: FactsHead | null);
	set rows(rows: Array<FactsRow | null | false>);
}

export type MeterLevel = 'ok' | 'warning' | 'danger' | 'full' | 'unknown';
export interface MeterValues {
	label?: string;
	/** The share used, 0 to 1 (more is past the limit); null when not reported. */
	value?: number | null;
	/** When it resets: the product's words, or a moment ("Resets 23:10"); a moment that passed makes it stale. */
	reset?: string | Moment | null;
	/** Not current: since a moment, the product's time words, or true. */
	stale?: boolean | string | Moment | null;
	/** Where the levels start (0.8 and 0.95 by default). */
	thresholds?: { warning?: number; danger?: number } | null;
}
/** A use against a limit (0.11.0): its level in words, its reset, stale when the report is not current; `role="meter"`. */
export class Meter extends Component {
	static readonly labels: Copies;
	static readonly thresholds: { readonly warning: number; readonly danger: number };
	constructor(options: MeterValues & { label: string; clock?: Clock; locale?: string; labels?: Copy });
	/** The `role="meter"` element. */
	readonly track: HTMLElement;
	readonly level: MeterLevel;
	readonly stale: boolean;
	/** Changes what is given. */
	update(values: MeterValues): this;
}

/** A compact choice on `ChoiceMenu` (0.11.0): a muted label, its value and a state in words; the same menu. */
export class ChoiceChip extends ChoiceMenu {
	constructor(options: ChoiceMenuOptions & { state?: [string, FactsTone] | null });
	/** Its own state, over the chosen option's; null for that one's. */
	state: [string, FactsTone] | null;
}

// Only the declarations marked `export` are public.
export {};
