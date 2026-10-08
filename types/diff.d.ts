/** Types of `Diff` (0.11.2), a change's files in a unified view, re-exported by `@beyond-js/ui` and `/dom`. */
import type { Component, Copy } from './dom.js';

type Copies = { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };

/** A file's status; `Diff` infers it when absent. */
export type DiffStatus = 'added' | 'modified' | 'deleted' | 'renamed' | 'copied';
/** One line of a hunk: `' x'`, `'-x'`, `'+x'` or `'\ No newline at end of file'`, or the same as an object. */
export type DiffLine = string | { kind: 'context' | 'add' | 'delete' | 'note'; text: string };
/** One hunk: where it starts in the old and new file, its section text (after `@@`), and its lines. */
export interface DiffHunk {
	old: number;
	new: number;
	/** The section text after the second `@@` ("function name"). */
	header?: string | null;
	lines: DiffLine[];
}
/** One file of a change, given split or read by `Diff.parse`. */
export interface DiffFile {
	path: string;
	/** The source of a rename or a copy. */
	previous?: string | null;
	status?: DiffStatus;
	binary?: boolean;
	mode?: { old?: string | null; new?: string | null } | null;
	hunks?: DiffHunk[];
	/** Counted from the lines when absent. */
	added?: number;
	removed?: number;
}
/** A file as `Diff.parse` and `diff.files` give it: every field present, lines as objects, with the parts that could not be read. */
export interface DiffData extends Required<Omit<DiffFile, 'hunks' | 'mode' | 'previous'>> {
	previous: string | null;
	mode: { old: string | null; new: string | null } | null;
	hunks: Array<{ old: number; new: number; header: string | null; lines: Array<{ kind: 'context' | 'add' | 'delete' | 'note'; text: string }> }>;
	/** The parts of this file's patch that could not be read. */
	unread: number;
}
export interface DiffOptions {
	/** A unified diff: git's format or a plain one. */
	patch?: string | null;
	/** Files already split, used when there is no `patch`. */
	files?: DiffFile[] | null;
	/** The diff's accessible name ("Changes"). */
	label?: string | null;
	/** The files' heading level (3). */
	level?: 2 | 3 | 4;
	/** Which files open first: within the budget (`auto`), every one or none. */
	open?: 'auto' | 'all' | 'none';
	/** The summary line at the top (true). */
	summary?: boolean;
	labels?: Copy;
	/** A BCP 47 tag for the counts. */
	locale?: string;
}
/** A change a developer can trust (0.11.2): files as regions named by their paths, unified lines that are never invented, keys between files and hunks, a bounded budget. No syntax highlighting. */
export class Diff extends Component {
	static readonly labels: Copies;
	/** Unchanged lines kept at each end of a folded run (3). */
	static context: number;
	/** The number of files from which the list of files to jump to is shown (4). */
	static jump: number;
	/** Lines open by default in all and in one file before it starts folded. */
	static budget: { lines: number; file: number };
	/** Rows a large file draws per animation frame (500). */
	static chunk: number;
	/** Reads a unified diff into files as data. Never throws. */
	static parse(text: string): DiffData[];
	constructor(options?: DiffOptions);
	readonly element: HTMLElement;
	/** Replaces the change with a unified diff, keeping each file's open state and the focused header. */
	set patch(text: string);
	/** The files as data with their counts; set it to replace the change with files already split. */
	get files(): DiffData[];
	set files(files: DiffFile[] | null);
	/** Opens a file by its path; false when there is none. */
	open(path: string): boolean;
	/** Folds a file by its path; false when there is none. */
	close(path: string): boolean;
	/** Opens a file, scrolls it into view and focuses its header. */
	reveal(path: string): boolean;
}

// Only the declarations marked `export` are public.
export {};
