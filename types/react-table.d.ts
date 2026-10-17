/** Types of the React `DataTable` (0.15.0), re-exported by `@beyond-js/ui/react`. */
import type { ReactElement, ReactNode } from 'react';
import type { Copy } from './notifications.js';
import type { DataTableState } from './table.js';
export type { DataTableColumn, DataTableState } from './table.js';

/** A table of rows the product holds, driven by the DOM `DataTable`; `render` may return React content. */
export function DataTable<Row = any>(props: {
	label: string;
	columns: Array<{ key: string; label: string; value?: (row: Row) => string | number | null | undefined; render?: (row: Row) => ReactNode; sort?: boolean | ((a: Row, b: Row) => number); mono?: boolean; align?: 'start' | 'end'; primary?: boolean }>;
	rows?: Row[];
	rowKey?: ((row: Row) => string) | null;
	search?: boolean;
	group?: { by: (row: Row) => string; label?: (key: string, rows: Row[]) => string } | null;
	state?: Partial<DataTableState> | null;
	onChange?: ((state: DataTableState) => void) | null;
	size?: number;
	link?: ((row: Row) => string) | null;
	onOpen?: ((row: Row, event: Event) => void) | null;
	empty?: { title: string; text?: string | null; action?: { label: string; href?: string | null } | null } | null;
	status?: 'loading' | 'ready' | { failed: string | null };
	onRetry?: (() => void) | null;
	/** Memoize: a new object creates a new table */
	labels?: Copy;
}): ReactElement;
export namespace DataTable { const labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> }; }
