import { el, fill } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Ids } from '../core/ids.js';
import { Button } from '../button.js';
import { CopyButton } from '../copy-button.js';
import { DiffLines } from './lines.js';

/**
 * One file of a `Diff`: a region named by its path, whose header is a heading holding the disclosure
 * button (the chevron, the path, the status in words and the counts) with "Copy path" beside it, and
 * whose body holds the notes that apply and its lines.
 *
 * The body is built when the file first opens, so a folded file holds no line nodes. A file larger than
 * the diff's per-file budget opens on "Large diff · {n} lines" with Show, which draws its lines in chunks.
 */
export class DiffFileView {
	#entry;
	#words;
	#rows;
	#options;
	#element;
	#toggle;
	#body;
	#copy;
	#lines = null;
	#gate = null;
	#built = false;
	#opened = false;

	/**
	 * @param {import('./entry.js').DiffEntry} entry
	 * @param {{words: import('./words.js').DiffWords, rows: import('./rows.js').DiffRows, level: number, large: boolean, chunk: number, onchange?: () => void}} options
	 */
	constructor(entry, options) {
		this.#entry = entry;
		this.#words = options.words;
		this.#rows = options.rows;
		this.#options = options;
		const id = Ids.next('bui-diff-file');
		this.#body = el('div', { class: 'bui-diff-body', id: `${id}-body`, hidden: true });
		this.#toggle = el('button', { type: 'button', class: 'bui-diff-toggle', 'aria-expanded': 'false', 'aria-controls': this.#body.id, onclick: () => (this.#opened ? this.close() : this.open()) }, [
			el('span', { class: 'bui-diff-chevron' }, [glyph('chevron')]),
			' ',
			this.#words.path(entry, `${id}-path`),
			' ',
			el('span', { class: 'bui-diff-status' }, [this.#words.status(entry)]),
			' ',
			this.#words.amount(entry)
		]);
		this.#copy = new CopyButton({ text: entry.path, label: this.#words.text('path'), name: this.#words.text('name', { path: entry.path }), labels: this.#words.copy });
		const level = [2, 3, 4].includes(options.level) ? options.level : 3;
		this.#element = el('section', { class: 'bui-diff-file', 'aria-labelledby': `${id}-path`, dataset: { status: entry.status, path: entry.path } }, [
			el('div', { class: 'bui-diff-head' }, [el(`h${level}`, { class: 'bui-diff-heading' }, [this.#toggle]), this.#copy.element]),
			this.#body
		]);
	}

	get element() {
		return this.#element;
	}

	get path() {
		return this.#entry.path;
	}

	get entry() {
		return this.#entry;
	}

	/** The disclosure button in the file's header. */
	get toggle() {
		return this.#toggle;
	}

	get opened() {
		return this.#opened;
	}

	/** Whether every line of the file is drawn. */
	get done() {
		return Boolean(this.#lines?.done);
	}

	/** Opens the file, building its body the first time. */
	open() {
		if (this.#opened) return;
		this.#opened = true;
		if (!this.#built) this.#build();
		this.#show();
		this.#options.onchange?.();
	}

	/** Folds the file; its lines stay built. */
	close() {
		if (!this.#opened) return;
		this.#opened = false;
		this.#show();
		this.#options.onchange?.();
	}

	/** Draws a large file's lines in chunks, in place of its "Large diff" line. */
	expand() {
		if (!this.#gate) return Promise.resolve();
		const moved = this.#gate.contains(this.#element.ownerDocument.activeElement);
		const lines = this.#make();
		this.#gate.replaceWith(lines.element);
		this.#gate = null;
		if (moved) lines.element.focus();
		return lines.stream(this.#options.chunk);
	}

	destroy() {
		this.#lines?.destroy();
		this.#copy.destroy();
		this.#element.remove();
	}

	#show() {
		this.#toggle.setAttribute('aria-expanded', String(this.#opened));
		this.#element.toggleAttribute('data-open', this.#opened);
		this.#body.hidden = !this.#opened;
	}

	#build() {
		this.#built = true;
		const entry = this.#entry;
		const note = key => (key ? el('p', { class: 'bui-diff-note' }, [key]) : null);
		const mode = entry.mode?.old && entry.mode?.new && entry.mode.old !== entry.mode.new ? this.#words.text('changed', { old: entry.mode.old, new: entry.mode.new }) : null;
		const parts = [note(mode), entry.whitespace ? note(this.#words.text('whitespace')) : null, entry.unread ? note(this.#words.text('unread')) : null];
		if (entry.binary) parts.push(note(this.#words.text('binary')));
		else if (!entry.hunks.length) parts.push(this.#empty());
		else if (this.#options.large) {
			const show = new Button({ label: this.#words.text('show'), variant: 'quiet', small: true, onclick: () => this.expand() });
			this.#gate = el('div', { class: 'bui-diff-large' }, [el('span', {}, [this.#words.count('large', entry.size)]), show.element]);
			parts.push(this.#gate);
		} else parts.push(this.#make().draw().element);
		fill(this.#body, parts);
	}

	/** What a file without hunks says: renamed or copied without changes, empty, or no lines shown. */
	#empty() {
		const entry = this.#entry;
		const key = entry.status === 'renamed' ? 'same' : entry.status === 'copied' ? 'duplicate' : entry.status === 'added' || entry.status === 'deleted' ? 'empty' : entry.word === 'mode' ? null : 'nothing';
		return key ? el('p', { class: 'bui-diff-note' }, [this.#words.text(key)]) : null;
	}

	#make() {
		this.#lines = new DiffLines(this.#rows, this.#rows.plan(this.#entry), this.#words.text('lines', { path: this.#entry.path }));
		return this.#lines;
	}
}
