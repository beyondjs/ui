/** Types of the React forms of 0.15.0's patterns and DataTable, re-exported by `@beyond-js/ui/react`. */
import type { ReactElement, ReactNode } from 'react';
import type { Copy } from './notifications.js';
import type { MenuItem } from './dom.js';
import type { StatusState, ChecklistState } from './patterns.js';
export type { StatusState, StatusTone, ChecklistState, ChecklistStep } from './patterns.js';
export { Floating } from './dom.js';
export type { FloatingAnchor, FloatingOptions, FloatingRefusal } from './dom.js';
export * from './react-table.js';
export * from './react-command.js';

/** Phrasing content for a row slot; native nodes remain supported for DOM consumers. */
type RowContent = ReactNode | Node;
type RowState = { state: StatusState | (string & {}); label?: RowContent };

type Copies = { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };

/** One object in a list, driven by the DOM `ListRow`; callbacks are read from the latest props. */
export function ListRow(props: {
	title: string | Node;
	href?: string | null;
	run?: ((event: Event) => void) | null;
	meta?: RowContent | Array<RowContent>;
	lead?: RowState | RowContent;
	status?: RowState | RowContent;
	facts?: Array<RowContent>;
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

export function EmptyState(props: { kind?: 'empty' | 'match' | 'context' | 'outage'; title?: string; text?: string | null; action?: { label: string; href?: string | null; onSelect?: ((event: Event) => void) | null } | null; onClear?: (() => void) | null; checklist?: { title?: string | null; steps: Array<{ key: string; title: string; detail?: string | null; state?: ChecklistState; reason?: string | null; action?: { label: string; href?: string | null } | null }> } | null; glyph?: string | null; /** a box: by default every kind but an outage has one (0.25.1, as the DOM component since 0.24.1); false inside a region framed already */ frame?: boolean | null; /** an outage's place as phrasing content, hosted in a span (0.33.0) */ inline?: boolean; labels?: Copy }): ReactElement;
export namespace EmptyState { const labels: Copies; }
/** A change that did not get its answer, in the warning tone (D186, 0.33.0). */
export function ChangeOutcome(props: { outcome: 'unavailable' | 'unknown'; cause?: string | null; check?: { label: string; href?: string | null; onSelect?: ((event: Event) => void) | null } | null; details?: import('./operations.js').DetailsRecord | null; /** the person's Try again of a change answered unavailable (0.33.0) */ onAgain?: (() => unknown) | null; labels?: Copy }): ReactElement;
export namespace ChangeOutcome { const labels: Copies; }

export function CommandCard(props: { title: string; command: string; detail?: string | null; scope?: { label: string; checked?: boolean } | null; state?: 'pending' | 'allowed' | 'denied'; onAllow?: (answer: { scope: boolean }) => unknown; onDeny?: (answer: { scope: boolean }) => unknown; /** 0.16.0 */ decisions?: import('./patterns.js').CommandDecision[] | null; onDecide?: ((answer: import('./patterns.js').CommandAnswer) => unknown) | null; editable?: boolean; /** Takes focus when true */ focus?: boolean; labels?: Copy }): ReactElement;
export namespace CommandCard { const labels: Copies; }
