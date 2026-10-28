/** Types of 0.15.0's `DataTable`, re-exported by `@beyond-js/ui/dom`. */
import type { Copy } from './notifications.js';
import type { Component } from './dom.js';
import type { CollectionFilter, CollectionTools, CollectionToolsMode } from './collection-tools.js';

export interface DataTableFilter<Row = any> extends CollectionFilter {
	/** True when this row matches the selected value; empty selections do not filter. */
	match: (row: Row, value: string) => boolean;
}

export interface DataTableColumn<Row = any> {
	key: string;
	label: string | Node;
	/** The text it is searched and sorted by (`row[key]` without it). */
	value?: (row: Row) => string | number | null | undefined;
	/** What the cell shows, when it differs from the value. */
	render?: (row: Row) => string | Node;
	/** Sortable by its value, or by this comparison. */
	sort?: boolean | ((a: Row, b: Row) => number);
	mono?: boolean;
	align?: 'start' | 'end';
	/** The cell that names and opens the row (the first column without it). */
	primary?: boolean;
	/** Content already names its meaning: omit the repeated narrow visual label. */
	summary?: boolean;
	/** One overflow menu; beside the name when the table stacks. */
	menu?: boolean;
}

export interface DataTableState {
	query: string;
	sort: string | null;
	direction: 'ascending' | 'descending';
	page: number;
	/** Present when filter definitions or input filter state are supplied. */
	filters?: Record<string, string>;
}

export interface DataTableOptions<Row = any> {
	label: string;
	columns: Array<DataTableColumn<Row>>;
	rows?: Row[];
	key?: (row: Row) => string;
	search?: boolean | { match?: (row: Row, query: string) => boolean };
	filters?: Array<DataTableFilter<Row>>;
	tools?: CollectionToolsMode;
	group?: { by: (row: Row) => string; label?: (key: string, rows: Row[]) => string } | null;
	state?: Partial<DataTableState>;
	/** The person changed the state: write it to the address. Setting `state` back does not call it. */
	onchange?: ((state: DataTableState) => void) | null;
	/** Rows a page (50); what fits on one page shows no pager. */
	size?: number;
	link?: ((row: Row) => string) | null;
	onopen?: ((row: Row, event: Event) => void) | null;
	empty?: Node | { title: string | Node; text?: string | Node | null; action?: Node | { label: string; href?: string | null; run?: ((event: Event) => void) | null } | null } | null;
	onretry?: (() => void) | null;
	onrender?: (() => void) | null;
	/** Milliseconds after the last key before a search applies (200). */
	delay?: number;
	/** Drawn at the top of a framed box: with no tools above it, its first capitals at the box's inset (0.41.0, D184). */
	framed?: boolean;
	labels?: Copy;
}

/** A table of rows the product holds: search, sort, groups and pages, its state reported for the address (DQ-12). */
export class DataTable<Row = any> extends Component {
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	constructor(options: DataTableOptions<Row>);
	readonly tools: CollectionTools;
	get state(): DataTableState;
	set state(state: Partial<DataTableState>);
	rows: Row[];
	get status(): 'loading' | 'ready' | 'failed';
	set status(status: 'loading' | 'ready' | { failed: string | null });
	/** Whether it is drawn at the top of a framed box (0.41.0). */
	framed: boolean;
}
