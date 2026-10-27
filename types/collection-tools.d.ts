/** Shared collection toolbar types. The constructor is exposed as DOM `Collection.Tools`. */
import type { Component, Content, Copy, SelectOption } from './dom.js';

export type CollectionToolsMode = 'compact' | 'expanded' | 'external';
export interface CollectionFilter {
	name: string;
	label: Content;
	all?: string;
	options: SelectOption[];
	kind?: undefined;
}
/**
 * 0.44.0 (D162 L8): a chooser of periods, kept in the filter state as text like any value: `P30D` (the last
 * 30 days, today included), `2026-10` (a month) or, restored from an address only, `2026-09-01/2026-09-15`
 * (a span of days). UTC days. `all` names no period ("Any time" by default).
 */
export interface CollectionPeriodFilter {
	name: string;
	label: Content;
	kind: 'period';
	all?: string;
	/** The last days offered, [7, 30] by default; 1 is "Today" */
	days?: number[];
	/** The months offered, this one first: 3 by default */
	months?: number;
	/** The clock the offered periods are counted from */
	now?: () => Date | number;
}
/** A filter of the shared tools: a finite list of options, or a period (0.44.0) */
export type CollectionAnyFilter = CollectionFilter | CollectionPeriodFilter;
/** A period's values and ranges (0.44.0), also `Collection.Tools.Period` */
export class Period {
	constructor(filter: Omit<CollectionPeriodFilter, 'name' | 'label' | 'kind'>, labels?: Copy);
	/** The choices the filter offers: its last days, then its months */
	readonly options: Array<{ value: string; label: string }>;
	/** A value as an option, named in the words' language, or null when it is not a period */
	option(value: string): { value: string; label: string } | null;
	/** The range a period covers, `start` included and `end` excluded, in UTC; null for no period */
	static range(value: string | null | undefined, options?: { now?: Date | number }): { start: Date; end: Date } | null;
	static valid(value: string | null | undefined): boolean;
}
export interface CollectionToolsState {
	query: string;
	filters: Record<string, string>;
}
export interface CollectionToolsOptions {
	label: string;
	search?: boolean;
	filters?: CollectionAnyFilter[];
	state?: Partial<CollectionToolsState>;
	onchange?: ((state: CollectionToolsState) => void) | null;
	labels?: Copy;
	/** Compact tools by default; false keeps the search expanded. Filters remain grouped. */
	compact?: boolean;
	/** Milliseconds after the last key before search applies (200). Filters and clears apply immediately. */
	delay?: number;
}
export interface CollectionTools extends Component {
	get state(): CollectionToolsState;
	/** Restores the controls without reporting a change. */
	set state(state: Partial<CollectionToolsState>);
	/** Opens and focuses search, or the first available control when search is disabled. */
	focus(): void;
}
export interface CollectionToolsConstructor {
	new (options: CollectionToolsOptions): CollectionTools;
	readonly Period: typeof Period;
	readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
}
