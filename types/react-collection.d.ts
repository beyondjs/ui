/** The React collection and its standalone tools (0.44.0 moved here from `react.d.ts`). */
import type { ReactNode, ReactElement, ForwardRefExoticComponent, RefAttributes } from 'react';
import type { Copy } from './notifications.js';
import type { SelectOption, CollectionState, DetailsRecord } from './dom.js';
import type { CollectionToolsMode, CollectionToolsState, CollectionAnyFilter, CollectionPeriodFilter } from './collection-tools.js';

export interface ReactColumn<Row> { key: string; label: string; value?: (row: Row) => string | Node; render?: (row: Row) => ReactNode; numeric?: boolean; primary?: boolean; /** Hidden as the region narrows, the highest number first (0.7.0) */ priority?: number }
export interface CollectionProps<Row> {
	label: string;
	columns: ReactColumn<Row>[];
	source: (request: CollectionState & { limit: number; signal: AbortSignal }) => Promise<{ rows: Row[]; total?: number | null; more?: boolean | null }>;
	link?: ((row: Row) => string) | null;
	onOpen?: ((row: Row, event: MouseEvent) => void) | null;
	search?: boolean;
	filters?: Array<CollectionAnyFilter & { label: string }>;
	tools?: CollectionToolsMode;
	/** With tools='external', a dedicated empty DOM container for this collection's toolbar. */
	toolsTarget?: HTMLElement | null;
	state?: Partial<CollectionState> | null;
	onState?: ((state: CollectionState) => void) | null;
	limit?: number;
	/** Read on each draw (0.44.0); its one action `EmptyState`'s `{ label, href, onSelect }` or React content (a section's own button) */
	empty?: { title?: string; body?: string; action?: { label: string; href?: string | null; onSelect?: ((event: Event) => void) | null } | ReactNode } | null;
	explain?: ((error: unknown) => string) | null;
	labels?: Copy;
	/** `list` (0.15.0): rows as `ListRow`s */ presentation?: 'table' | 'list';
	/** Contains object-list groups in the shared frame; table presentation is unchanged (0.45.0). */
	framed?: boolean;
	/** 0.21.1 (D162): the list's own `ListRow` options for a row, its groups and its end line */ row?: ((row: Row, context: { differ: import('./parts.js').Differ }) => Partial<import('./patterns.js').ListRowOptions>) | null; group?: ((row: Row) => { key: string; label: string }) | null; end?: boolean | string | ((list: { count: number }) => string);
	/** 0.24.0 (D163): the page's notice from `useRecovery`; a failure `outage` names joins it and the list says "Not available right now" in place */ recovery?: import('./again.js').Recovery | null; outage?: ((error: unknown) => boolean) | null; details?: ((error: unknown) => DetailsRecord | null) | null;
}
export function Collection<Row = Record<string, unknown>>(props: CollectionProps<Row>): ReactElement;
export namespace Collection { const labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> }; }

export interface CollectionToolsProps {
	label: string;
	search?: boolean;
	filters?: Array<CollectionAnyFilter & { label: string }>;
	/** Restored silently whenever it differs, usually from the address */
	state?: Partial<CollectionToolsState> | null;
	/** The person's changes: the query after its debounce, filters and clearing at once */
	onChange?: ((state: CollectionToolsState) => void) | null;
	labels?: Copy;
	/** Compact by default; false keeps the search open */
	compact?: boolean;
	delay?: number;
}
/**
 * 0.44.0 (D162 L8): one toolbar of search and filters for more than one view of the same records (a graph and
 * a table). Put `ref` on an empty element the page places; `state` is the tools' current one.
 */
export function useCollectionTools(props: CollectionToolsProps): { ref: (element: HTMLElement | null) => void; state: CollectionToolsState; tools: import('./collection-tools.js').CollectionTools | null };
/** The same toolbar as a component, drawn where it is rendered; its ref's `focus()` opens the search. */
export const CollectionTools: ForwardRefExoticComponent<CollectionToolsProps & RefAttributes<{ focus(): void }>> & { labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> } };
export { Period } from './collection-tools.js';
export { Differ } from './parts.js';
export type { CollectionPeriodFilter };
