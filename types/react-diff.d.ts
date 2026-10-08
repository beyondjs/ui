/** Types of the React `Diff` (0.11.2), re-exported by `@beyond-js/ui/react`. */
import type { ReactElement } from 'react';
import type { Copy } from './notifications.js';
import type { DiffData, DiffFile } from './dom.js';
export type { DiffData, DiffFile, DiffHunk, DiffLine, DiffStatus } from './dom.js';

type Copies = { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };

/** A change, driven by the DOM `Diff`: `patch` or `files` are applied when they change; the other props create a new one. */
export function Diff(props: { patch?: string | null; files?: DiffFile[] | null; label?: string | null; level?: 2 | 3 | 4; open?: 'auto' | 'all' | 'none'; summary?: boolean; labels?: Copy; locale?: string }): ReactElement;
export namespace Diff {
	const labels: Copies;
	/** Reads a unified diff into files as data. */
	function parse(text: string): DiffData[];
}

// Only the declarations marked `export` are public.
export {};
