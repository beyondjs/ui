const statuses = Object.freeze(['added', 'modified', 'deleted', 'renamed', 'copied']);
const kinds = Object.freeze(['context', 'add', 'delete', 'note']);
const signs = Object.freeze({ ' ': 'context', '-': 'delete', '+': 'add', '\\': 'note' });

/**
 * One file of a change as `Diff` shows it, read from a parsed patch or from a product's `files`: its
 * path (and the earlier one of a rename or copy), its status (inferred when absent), binary, its mode
 * change, its hunks with lines as `{ kind, text }`, and its counts (from the lines when absent).
 *
 * What cannot be read is counted in `unread` and left out, never guessed: a line that is neither a
 * string with a sign nor a `{ kind, text }` of a known kind, or a hunk without line numbers.
 */
export class DiffEntry {
	#path;
	#previous;
	#status;
	#binary;
	#mode;
	#hunks;
	#added;
	#removed;
	#unread;

	/** A file from data, or null when it names no path. */
	static from(raw) {
		if (!raw || typeof raw !== 'object' || typeof raw.path !== 'string' || !raw.path) return null;
		return new DiffEntry(raw);
	}

	constructor(raw) {
		this.#path = raw.path;
		this.#binary = Boolean(raw.binary);
		const mode = raw.mode && typeof raw.mode === 'object' ? { old: raw.mode.old ?? null, new: raw.mode.new ?? null } : null;
		this.#mode = mode && (mode.old || mode.new) ? mode : null;
		this.#unread = Number.isInteger(raw.unread) && raw.unread > 0 ? raw.unread : 0;
		this.#hunks = (Array.isArray(raw.hunks) ? raw.hunks : raw.hunks == null ? [] : (this.#unread++, [])).map(hunk => this.#hunk(hunk)).filter(Boolean);
		const lines = this.#hunks.flatMap(hunk => hunk.lines);
		const count = kind => lines.filter(line => line.kind === kind).length;
		this.#added = Number.isInteger(raw.added) && raw.added >= 0 ? raw.added : count('add');
		this.#removed = Number.isInteger(raw.removed) && raw.removed >= 0 ? raw.removed : count('delete');
		const previous = typeof raw.previous === 'string' && raw.previous && raw.previous !== raw.path ? raw.previous : null;
		this.#status = statuses.includes(raw.status) ? raw.status : this.#infer(previous, lines);
		this.#previous = this.#status === 'renamed' || this.#status === 'copied' ? previous : null;
	}

	get path() {
		return this.#path;
	}

	/** The earlier path of a rename or a copy, else null. */
	get previous() {
		return this.#previous;
	}

	get status() {
		return this.#status;
	}

	/** The status word's key: the status, or `mode` for a file whose only change is its mode. */
	get word() {
		return this.#status === 'modified' && this.#mode && !this.#hunks.length && !this.#binary ? 'mode' : this.#status;
	}

	get binary() {
		return this.#binary;
	}

	get mode() {
		return this.#mode;
	}

	get hunks() {
		return this.#hunks;
	}

	get added() {
		return this.#added;
	}

	get removed() {
		return this.#removed;
	}

	/** The parts of this file that could not be read. */
	get unread() {
		return this.#unread;
	}

	/** The number of lines its hunks hold, which the budget counts. */
	get size() {
		return this.#hunks.reduce((sum, hunk) => sum + hunk.lines.length, 0);
	}

	/** Whether every change block is equal once whitespace is removed (and there is one). */
	get whitespace() {
		const bare = lines => lines.map(line => line.text).join('').replace(/\s+/g, '');
		let blocks = 0;
		for (const hunk of this.#hunks) {
			let removed = [];
			let added = [];
			const close = () => {
				if (!removed.length && !added.length) return true;
				blocks += 1;
				const same = bare(removed) === bare(added);
				removed = [];
				added = [];
				return same;
			};
			for (const line of hunk.lines) {
				if (line.kind === 'delete') removed.push(line);
				else if (line.kind === 'add') added.push(line);
				else if (line.kind === 'context' && !close()) return false;
			}
			if (!close()) return false;
		}
		return blocks > 0;
	}

	/** The file as plain data, the shape of `files`, with its counts. */
	get data() {
		const hunks = this.#hunks.map(hunk => ({ old: hunk.old, new: hunk.new, header: hunk.header, lines: hunk.lines.map(line => ({ ...line })) }));
		return { path: this.#path, previous: this.#previous, status: this.#status, binary: this.#binary, mode: this.#mode ? { ...this.#mode } : null, hunks, added: this.#added, removed: this.#removed, unread: this.#unread };
	}

	#hunk(hunk) {
		const number = value => Number.isInteger(value) && value >= 0;
		if (!hunk || !number(hunk.old) || !number(hunk.new) || !Array.isArray(hunk.lines)) {
			this.#unread += 1;
			return null;
		}
		const lines = [];
		let skipped = false;
		for (const line of hunk.lines) {
			const read = DiffEntry.#line(line);
			if (read) lines.push(read);
			else skipped = true;
		}
		if (skipped) this.#unread += 1;
		const header = typeof hunk.header === 'string' && hunk.header.trim() ? hunk.header.trim() : null;
		const before = lines.filter(line => line.kind !== 'add' && line.kind !== 'note').length;
		const after = lines.filter(line => line.kind !== 'delete' && line.kind !== 'note').length;
		return Object.freeze({ old: hunk.old, new: hunk.new, header, lines: Object.freeze(lines), before, after });
	}

	/** A line as `{ kind, text }` from `' x'`, `'-x'`, `'+x'`, `'\ …'` or an object; null when unreadable. */
	static #line(line) {
		if (typeof line === 'string') {
			if (line === '') return { kind: 'context', text: '' };
			const kind = signs[line[0]];
			return kind ? { kind, text: kind === 'note' ? line.slice(1).trim() : line.slice(1) } : null;
		}
		if (line && typeof line === 'object' && kinds.includes(line.kind)) return { kind: line.kind, text: String(line.text ?? '') };
		return null;
	}

	#infer(previous, lines) {
		if (previous) return 'renamed';
		if (lines.length && this.#hunks.every(hunk => hunk.old === 0) && lines.every(line => line.kind !== 'delete' && line.kind !== 'context')) return 'added';
		if (lines.length && this.#hunks.every(hunk => hunk.new === 0) && lines.every(line => line.kind !== 'add' && line.kind !== 'context')) return 'deleted';
		return 'modified';
	}
}
