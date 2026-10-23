/** Types of the React form of 0.27.0's `Lanes`, re-exported by `@beyond-js/ui/react` (through `react-conversation.d.ts`). */
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import type { Copy } from './notifications.js';
import type { Clock } from './operations.js';
import type { Lane } from './lanes.js';

export type { Lane, LaneFact, LaneState } from './lanes.js';
/** The ref of a React `Lanes`: moves focus to a lane. */
export interface LanesHandle {
	focus(key: string | number, options?: FocusOptions): boolean;
}
export interface LanesProps {
	label?: string | null;
	/** Applied when their content changes; `title`, `kind` and `now` are text in React. */
	lanes?: Array<(Omit<Lane, 'title' | 'kind' | 'now'> & { title: string; kind?: string | null; now?: string | null }) | null | false>;
	trace?: boolean;
	/** Read from the latest props. */
	onChoose?: ((key: string, event: Event) => void) | null;
	/** A new instance when one of these changes (memoize `labels`). */
	clock?: Clock;
	locale?: string;
	labels?: Copy;
}
/** Concurrent work as lanes on one time axis, driven by the DOM `Lanes` (0.27.0). */
export const Lanes: ForwardRefExoticComponent<LanesProps & RefAttributes<LanesHandle>> & { labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> } };
