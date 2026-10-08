/** Types of the React forms of 0.11.0's `Facts`, `Meter` and `ChoiceChip`, re-exported by `@beyond-js/ui/react`. */
import type { ReactElement, ReactNode } from 'react';
import type { Copy } from './notifications.js';
import type { ChoiceMenuOption, Clock, FactsHead, FactsTone, MeterValues } from './dom.js';
import type { ReactChoiceAction } from './react.js';
export type { FactsHead, FactsTone, MeterLevel, MeterValues } from './dom.js';

type Copies = { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };

/** One row; `action` is React content. */
export interface ReactFactsRow {
	key?: string;
	label: ReactNode;
	value?: ReactNode;
	mono?: boolean;
	action?: ReactNode;
	stale?: boolean | string | null;
	/** The value under its label (0.11.2); by default a long sentence that is not `mono`. */
	long?: boolean | null;
}
/** Label and value rows, rendered by React with the DOM class's markup (0.11.0). */
export function Facts(props: { head?: (Omit<FactsHead, 'title' | 'value'> & { title?: ReactNode; value?: ReactNode }) | null; rows?: Array<ReactFactsRow | null | false>; label?: string | null; labels?: { stale?: string } }): ReactElement;
export namespace Facts { const labels: Copies; }
/** A use against a limit, driven by the DOM `Meter` (0.11.0). */
export function Meter(props: MeterValues & { label: string; clock?: Clock; locale?: string; labels?: Copy }): ReactElement;
export namespace Meter { const labels: Copies; }
/** A compact choice (0.11.0): ChoiceMenu's props and `state`, its own state in words. */
export function ChoiceChip(props: { label: string; options: Array<ChoiceMenuOption | null | false>; value?: string | null; placeholder?: string | null; actions?: Array<ReactChoiceAction | null | false>; disabled?: boolean; align?: 'start' | 'end'; placement?: 'auto' | 'below' | 'above'; search?: boolean | 'auto' | number; statement?: boolean; name?: string | null; onChange?: ((value: string) => void) | null; labels?: Copy; state?: [string, FactsTone] | null }): ReactElement;
export namespace ChoiceChip { const labels: Copies; }

// Only the declarations marked `export` are public.
export {};
