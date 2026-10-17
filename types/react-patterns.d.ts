/** Types of the React forms of 0.15.0's patterns and DataTable, re-exported by `@beyond-js/ui/react`. */
import type { ReactElement } from 'react';
import type { Copy } from './notifications.js';
import type { MenuItem } from './dom.js';
import type { StatusState, ChecklistState } from './patterns.js';
export type { StatusState, StatusTone, ChecklistState, ChecklistStep } from './patterns.js';
export { Floating } from './dom.js';
export type { FloatingAnchor, FloatingOptions, FloatingRefusal } from './dom.js';
export * from './react-table.js';

type Copies = { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };

/** One object in a list, driven by the DOM `ListRow`; callbacks are read from the latest props. */
export function ListRow(props: {
	title: string;
	href?: string | null;
	run?: ((event: Event) => void) | null;
	meta?: string | Array<string | null | undefined> | null;
	lead?: { state: StatusState | (string & {}); label?: string | null } | string | null;
	status?: { state: StatusState | (string & {}); label?: string | null } | null;
	facts?: Array<string | null | false>;
	actions?: Array<{ label: string; onSelect?: ((event: Event) => void) | null; glyph?: string | null; name?: string | null } | null | false>;
	menu?: Array<(Omit<MenuItem, 'run'> & { onSelect?: ((event: Event) => void) | null }) | null | false>;
	select?: { checked?: boolean; disabled?: boolean; name?: string | null; value?: string | null; onChange?: ((checked: boolean) => void) | null } | null;
	current?: boolean;
	tag?: 'li' | 'div';
	/** Memoize: a new object creates a new row */
	labels?: Copy;
}): ReactElement;
export namespace ListRow { const labels: Copies; }

export function CopyValue(props: { value: string; label?: string | null; href?: string | null; cut?: 'end' | 'middle'; labels?: Copy }): ReactElement;
export namespace CopyValue { const labels: Copies; }

export function Checklist(props: { title?: string | null; steps: Array<{ key: string; title: string; detail?: string | null; state?: ChecklistState; reason?: string | null; action?: { label: string; href?: string | null; onSelect?: ((event: Event) => void) | null } | null }>; level?: 2 | 3 | 4 | 5 | 6; labels?: Copy }): ReactElement;
export namespace Checklist { const labels: Copies; }

export function EmptyState(props: { kind?: 'empty' | 'match' | 'context'; title: string; text?: string | null; action?: { label: string; href?: string | null; onSelect?: ((event: Event) => void) | null } | null; onClear?: (() => void) | null; checklist?: { title?: string | null; steps: Array<{ key: string; title: string; detail?: string | null; state?: ChecklistState; reason?: string | null; action?: { label: string; href?: string | null } | null }> } | null; glyph?: string | null; labels?: Copy }): ReactElement;
export namespace EmptyState { const labels: Copies; }

export function CommandCard(props: { title: string; command: string; detail?: string | null; scope?: { label: string; checked?: boolean } | null; state?: 'pending' | 'allowed' | 'denied'; onAllow: (answer: { scope: boolean }) => unknown; onDeny: (answer: { scope: boolean }) => unknown; /** Takes focus when true */ focus?: boolean; labels?: Copy }): ReactElement;
export namespace CommandCard { const labels: Copies; }
