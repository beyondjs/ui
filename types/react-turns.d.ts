/** Types of the React form of 0.29.0's `TurnIndex`, re-exported by `@beyond-js/ui/react` (through `react-conversation.d.ts`). */
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import type { Copy } from './notifications.js';
import type { Turn, TurnSeen } from './turns.js';

export type { Turn, TurnSeen, TurnState } from './turns.js';
/** The ref of a React `TurnIndex`. */
export interface TurnIndexHandle {
	focus(key: string | number, options?: FocusOptions): boolean;
	move(step: number): boolean;
	measure(): void;
}
export interface TurnIndexProps {
	label?: string | null;
	/** Applied when the array changes (memoize it); `element` and `head` come from refs. */
	turns?: Array<Turn | null | false>;
	/** Read from the latest props. */
	onChoose?: ((key: string, how: 'press' | 'key') => void) | null;
	onView?: ((seen: TurnSeen) => void) | null;
	/** A new instance when one of these changes (memoize `labels`). */
	keys?: boolean;
	labels?: Copy;
}
/** A thread's index of its turns, driven by the DOM `TurnIndex` (0.29.0). */
export const TurnIndex: ForwardRefExoticComponent<TurnIndexProps & RefAttributes<TurnIndexHandle>> & { labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> } };
