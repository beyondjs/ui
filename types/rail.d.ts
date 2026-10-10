/** Types of 0.12.0's rail (`Rail`, `RailItem`, `RailMoment`) and `ActivityExchange`, re-exported by `@beyond-js/ui` and `/dom`. */
import type { Component, Content } from './dom.js';
import type { IconName } from './icons.js';
import type { ActivityExchangePart } from './conversation.js';

/** The parts of a step's exchange in one box of an opened row (0.12.0). */
export class ActivityExchange {
	constructor(parts: ActivityExchangePart[], labels: unknown);
	readonly element: HTMLElement;
	readonly parts: { element: HTMLElement; readonly count: number; unfold(value?: boolean): void; copy(): Promise<boolean> }[];
}
export type RailTone = 'neutral' | 'success' | 'info' | 'progress' | 'warning' | 'danger';
/** One line down a column of marks: activity rows put their mark on it, any other event is a `RailItem` (0.12.0). */
export class Rail extends Component {
	static readonly tones: readonly RailTone[];
	/** A tone the rail knows, else `neutral`. */
	static tone(value: unknown): RailTone;
	constructor(options?: { element?: HTMLElement | null; label?: string | null; children?: Array<Node | { element: Node }> });
}
/** An event on a rail: a mark (a glyph, a dot, a spinner while `progress`) and the product's content (0.12.0). */
export class RailItem extends Component {
	constructor(options?: { glyph?: IconName | null; tone?: RailTone; content?: Content | { element: Node } | null });
	/** The element the content is placed in. */
	readonly body: HTMLElement;
	update(values: { glyph?: IconName | null; tone?: RailTone; content?: Content | { element: Node } | null }): this;
}
/** A time of day at a rail's far end, where the clock moved between two events (0.12.0). */
export class RailMoment extends Component {
	constructor(options: { text: string; datetime?: string | null; title?: string | null });
	update(values?: { text?: string; datetime?: string | null; title?: string | null }): this;
}

// Only the declarations marked `export` are public.
export {};
