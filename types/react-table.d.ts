/** Types of the React `DataTable` (0.15.0), re-exported by `@beyond-js/ui/react`. */
import type { ReactElement, ReactNode } from 'react';
import type { Copy } from './notifications.js';
import type { MenuItem } from './dom.js';
import type { DataTableFilter, DataTableState } from './table.js';
import type { CollectionToolsMode } from './collection-tools.js';
export type { DataTableColumn, DataTableFilter, DataTableState } from './table.js';

/** A table of rows the product holds, driven by the DOM `DataTable`; `render` may return React content. */
export function DataTable<Row = any>(props: {
	label: string;
	columns: Array<{ key: string; label: string; value?: (row: Row) => string | number | null | undefined; render?: (row: Row) => ReactNode; sort?: boolean | ((a: Row, b: Row) => number); mono?: boolean; align?: 'start' | 'end'; primary?: boolean; summary?: boolean; menu?: boolean }>;
	rows?: Row[];
	rowKey?: ((row: Row) => string) | null;
	search?: boolean;
	filters?: Array<DataTableFilter<Row>>;
	tools?: CollectionToolsMode;
	/** With tools='external', a dedicated empty DOM container for this table's toolbar. */
	toolsTarget?: HTMLElement | null;
	group?: { by: (row: Row) => string; label?: (key: string, rows: Row[]) => string } | null;
	state?: Partial<DataTableState> | null;
	onChange?: ((state: DataTableState) => void) | null;
	size?: number;
	link?: ((row: Row) => string) | null;
	onOpen?: ((row: Row, event: Event) => void) | null;
	empty?: { title: string; text?: string | null; action?: { label: string; href?: string | null } | null } | null;
	status?: 'loading' | 'ready' | { failed: string | null };
	onRetry?: (() => void) | null;
	/** Drawn in a framed box: its first capitals at the box's inset while it leads it (0.41.0, D184; 0.44.0) */
	framed?: boolean;
	/** A row's actions, in a menu column of its own (0.44.0, L6); read again each time a menu opens */
	menu?: ((row: Row) => Array<(Omit<MenuItem, 'run'> & { onSelect?: (event: MouseEvent) => void }) | null | false>) | null;
	/** Memoize: a new object creates a new table */
	labels?: Copy;
}): ReactElement;
export namespace DataTable { const labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> }; }
