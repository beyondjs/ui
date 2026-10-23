/** Types of an outage said once in React (0.24.0, D163), re-exported by `@beyond-js/ui/react`. */
import type { ReactElement } from 'react';
import type { Copy } from './notifications.js';
import type { DetailsRecord, Moment } from './dom.js';
import type { ButtonProps } from './react.js';

type Copies = { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };

/** Labelled secondary refresh action; `busy` tracks the owning read. */
export function RetryAction(props: { onClick?: ButtonProps['onClick']; labels?: Copy; busy?: boolean; small?: boolean; name?: string | null }): ReactElement;
export namespace RetryAction { const labels: Copies; }

/** A read that did not answer, for `Recovery`'s `reads` (0.24.0). */
export interface RecoveryRead {
	key: string;
	/** What it is, in the notice's Technical details. */
	title: string;
	details?: DetailsRecord | null;
	/** Reads it again; it leaves the notice when it leaves `reads`. */
	run?: (() => unknown) | null;
	/** False for a transport that reconnects by itself. */
	automatic?: boolean;
}
/** One outage's notice, made once for a page so a `Collection` can join it; null until mounted (0.24.0). */
export function useRecovery(options?: { title?: string; labels?: Copy; locale?: string; again?: Omit<import('./again.js').AgainOptions, 'run'>; level?: 2 | 3 | 4 | 5 | 6; focus?: (() => HTMLElement | null) | null } | null): import('./again.js').Recovery | null;
/** The page's one notice for one outage: one line, listing nothing; `whole` when nothing on the page could be read (0.24.0, D163). */
export function Recovery(props: { notice?: import('./again.js').Recovery | null; title?: string; reads?: RecoveryRead[]; whole?: boolean; labels?: Copy; locale?: string; again?: Omit<import('./again.js').AgainOptions, 'run'>; level?: 2 | 3 | 4 | 5 | 6; focus?: (() => HTMLElement | null) | null }): ReactElement;
/** "Last updated 12:04" over content kept from an earlier read (0.24.0). */
export function LastUpdate(props: { time?: Moment | null; locale?: string; labels?: Copy }): ReactElement;
export namespace LastUpdate { const labels: Copies; }
