import { Component } from '../core/component.js';
import { el, fill } from '../core/element.js';
import { Ids } from '../core/ids.js';
import { Patch } from './patch.js';
import { DiffEntry } from './entry.js';
import { DiffWords } from './words.js';
import { DiffRows } from './rows.js';
import { DiffFileView } from './file.js';
import { DiffJump } from './jump.js';
import { DiffKeys } from './keys.js';
import { labels as copy } from './labels.js';

/**
 * A change a developer can trust (0.11.2): the files of a unified patch (`patch`, git's format or a
 * plain unified diff) or of a product's own report (`files`), each a region named by its path with its
 * status in words, its counts and "Copy path", and its lines in a unified view with old and new numbers.
 *
 * It never invents a line. Unchanged lines that are not in the input are said ("12 unchanged lines not in
 * this patch"), never offered; a long run of unchanged lines that the input carries folds behind "Show
 * {n} unchanged lines"; what cannot be read is said ("This part of the patch couldn't be read") and the
 * rest is shown. Additions and deletions are told apart by their sign and their background, never color
 * alone, and a screen reader reads each line as "Added line 12: …", "Removed line 9: …" or "Line 14: …".
 *
 * Large changes are bounded by `Diff.budget`: files open while their running total of lines stays within
 * `lines`; a file over `file` lines starts folded and opens on "Large diff · {n} lines" with Show, which
 * draws `Diff.chunk` rows per animation frame. A folded file holds no line nodes until it first opens.
 *
 * Keys: on a file's header, the arrows, Home and End move between files; anywhere inside, `]` and `[`
 * move between hunks and Alt+ArrowDown and Alt+ArrowUp between files. There is no syntax highlighting:
 * the package ships no highlighter, and the code is shown as written in the monospaced face.
 */
export class Diff extends Component {
	/** The copy in English and Spanish. */
	static labels = copy;
	/** Unchanged lines kept at each end of a folded run. */
	static context = 3;
	/** The number of files from which the list of files to jump to is shown. */
	static jump = 4;
	/** Lines open by default in all (`lines`) and in one file before it starts folded (`file`). */
	static budget = { lines: 3000, file: 600 };
	/** Rows a large file draws per animation frame. */
	static chunk = 500;

	/** Reads a unified diff into files as data, the shape of `files`, with their counts. Never throws. */
	static parse(text) {
		return new Patch(text).files.map(raw => DiffEntry.from(raw)?.data).filter(Boolean);
	}

	#element;
	#keys = el('p', { class: 'bui-hidden', id: Ids.next('bui-diff-keys') });
	#content = el('div', { class: 'bui-diff-files' });
	#top = el('div', { class: 'bui-diff-top' });
	#words;
	#level;
	#mode;
	#summary;
	#views = [];
	#entries = [];

	/**
	 * @param {object} [options]
	 * @param {string|null} [options.patch] a unified diff
	 * @param {Array<object>|null} [options.files] files already split (used when there is no `patch`)
	 * @param {string|null} [options.label] the diff's accessible name ("Changes")
	 * @param {2|3|4} [options.level] the files' heading level (3)
	 * @param {'auto'|'all'|'none'} [options.open] which files open first (`auto`: within the budget)
	 * @param {boolean} [options.summary] the summary line at the top (true)
	 * @param {object} [options.labels] entries replacing the English copy
	 * @param {string} [options.locale] a BCP 47 tag for the counts
	 */
	constructor({ patch = null, files = null, label = null, level = 3, open = 'auto', summary = true, labels = {}, locale = undefined } = {}) {
		super();
		this.#words = new DiffWords(labels, locale);
		this.#level = level;
		this.#mode = ['all', 'none'].includes(open) ? open : 'auto';
		this.#summary = summary !== false;
		this.#keys.textContent = this.#words.text('keys');
		this.#element = el('section', { class: 'bui-diff', 'aria-label': label ?? this.#words.text('label'), 'aria-describedby': this.#keys.id }, [this.#keys, this.#top, this.#content]);
		const keys = new DiffKeys(this.#element);
		this.listen(this.#element, 'keydown', event => keys.handle(event));
		if (typeof patch === 'string') this.patch = patch;
		else this.files = files ?? [];
	}

	get element() {
		return this.#element;
	}

	/** Replaces the change with a unified diff, keeping each file's open state and the focused header. */
	set patch(text) {
		const read = new Patch(typeof text === 'string' ? text : '');
		this.#draw(read.files.map(raw => DiffEntry.from(raw)).filter(Boolean), read.unread);
	}

	/** Replaces the change with files already split, keeping each file's open state and the focused header. */
	set files(files) {
		const list = Array.isArray(files) ? files : [];
		const entries = list.map(raw => DiffEntry.from(raw));
		this.#draw(entries.filter(Boolean), entries.filter(entry => !entry).length);
	}

	/** The files as data, with their counts. */
	get files() {
		return this.#entries.map(entry => entry.data);
	}

	/** Opens a file by its path; false when there is none. */
	open(path) {
		const view = this.#find(path);
		view?.open();
		return Boolean(view);
	}

	/** Folds a file by its path; false when there is none. */
	close(path) {
		const view = this.#find(path);
		view?.close();
		return Boolean(view);
	}

	/** Opens a file, scrolls it into view (at once under reduced motion) and focuses its header. */
	reveal(path) {
		const view = this.#find(path);
		if (!view) return false;
		view.open();
		const window = this.#element.ownerDocument.defaultView;
		const still = Boolean(window?.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
		view.element.scrollIntoView?.({ behavior: still ? 'auto' : 'smooth', block: 'start' });
		view.toggle.focus({ preventScroll: true });
		return true;
	}

	destroy() {
		for (const view of this.#views) view.destroy();
		this.#views = [];
		super.destroy();
	}

	#find(path) {
		return this.#views.find(view => view.path === path) ?? null;
	}

	#draw(entries, unread) {
		const document = this.#element.ownerDocument;
		const focused = document.activeElement && this.#element.contains(document.activeElement) ? document.activeElement.closest('.bui-diff-file')?.dataset.path : undefined;
		const before = new Map(this.#views.map(view => [view.path, view.opened]));
		for (const view of this.#views) view.destroy();
		this.#entries = entries;
		const rows = new DiffRows(this.#words, Diff.context);
		const budget = { lines: Diff.budget?.lines ?? 3000, file: Diff.budget?.file ?? 600 };
		let total = 0;
		let full = false;
		this.#views = entries.map(entry => {
			const large = entry.size > budget.file;
			const view = new DiffFileView(entry, { words: this.#words, rows, level: this.#level, large, chunk: Diff.chunk });
			let open = before.get(entry.path);
			if (open === undefined && this.#mode !== 'auto') open = this.#mode === 'all';
			if (open === undefined) {
				// Files open while the running total fits; the first that does not ends it, a large one does not
				open = !large && !full && total + entry.size <= budget.lines;
				if (open) total += entry.size;
				else if (!large) full = true;
			}
			if (open) view.open();
			return view;
		});
		const jump = new DiffJump(this.#words);
		const notes = [unread ? el('p', { class: 'bui-diff-note' }, [this.#words.text('unread')]) : null, !entries.length && !unread ? el('p', { class: 'bui-diff-note' }, [this.#words.text('none')]) : null];
		const actions = { open: () => this.#views.forEach(view => view.open()), fold: () => this.#views.forEach(view => view.close()) };
		fill(this.#top, [this.#summary ? jump.summary(entries, actions) : null, notes, entries.length >= Diff.jump ? jump.list(entries, path => this.reveal(path)) : null]);
		fill(this.#content, this.#views.map(view => view.element));
		if (focused !== undefined) this.#find(focused)?.toggle.focus();
	}
}
