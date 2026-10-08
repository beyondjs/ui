import { PatchPath } from './paths.js';

const hunk = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@ ?(.*)$/;
const binary = /^(literal|delta) \d+$|^[A-Za-z][!-~]*$|^$/;

/**
 * Reads a unified diff into files as data (`Diff.parse`): git's format (`diff --git`, its extended
 * headers, binary files in both forms, renames and copies, modes, quoted paths) and plain unified diffs
 * made of `---`/`+++` pairs. CRLF line ends are tolerated.
 *
 * A hunk's body is read by its header's counts, so a deleted line that reads `--- x` is a deletion, not
 * the next file. Nothing throws: a part that cannot be read is counted (`unread` on its file, or on the
 * patch when it belongs to no file) and the rest is read. Text before the first file, such as a commit
 * message, is not a part of the patch.
 */
export class Patch {
	#lines;
	#at = 0;
	#files = [];
	#unread = 0;

	/** @param {string} text a unified diff */
	constructor(text) {
		const lines = typeof text === 'string' ? text.split(/\r?\n/) : [];
		if (lines.at(-1) === '') lines.pop();
		this.#lines = lines;
		this.#read();
		// Text that holds no file is not an empty change: it is said as unread
		if (!this.#files.length && lines.some(line => line.trim())) this.#unread = Math.max(1, this.#unread);
	}

	/** The files read, in order: `{ path, previous, status, binary, mode, hunks, unread }`. */
	get files() {
		return this.#files;
	}

	/** The parts that belong to no file and could not be read. */
	get unread() {
		return this.#unread;
	}

	get #line() {
		return this.#lines[this.#at];
	}

	#read() {
		while (this.#at < this.#lines.length) {
			const line = this.#line;
			if (line.startsWith('diff --git ')) this.#git();
			else if (this.#pair()) this.#plain();
			else if (line.startsWith('@@')) {
				// A hunk outside any file cannot be placed: it is said once with its lines
				this.#unread += 1;
				this.#at += 1;
				this.#skip();
			} else this.#at += 1; // other text (a message, a diffstat, a signature) is not a part
		}
	}

	/** Skips the lines of a hunk that cannot be read, up to the next file. */
	#skip() {
		while (this.#at < this.#lines.length && /^[+\- \\]/.test(this.#line) && !this.#pair()) this.#at += 1;
	}

	/** Whether a `---` line followed by a `+++` line starts here. */
	#pair() {
		return this.#line?.startsWith('--- ') && this.#lines[this.#at + 1]?.startsWith('+++ ');
	}

	#git() {
		const named = PatchPath.pair(this.#line.slice(11));
		const file = { old: named?.[0], new: named?.[1], from: undefined, to: undefined, status: null, binary: false, mode: {}, hunks: [], unread: named ? 0 : 1 };
		this.#at += 1;
		while (this.#at < this.#lines.length) {
			const line = this.#line;
			if (line.startsWith('diff --git ') || line.startsWith('@@')) break;
			if (this.#pair()) {
				this.#sides(file);
				break;
			}
			if (!this.#extended(file, line)) break;
		}
		this.#hunks(file);
		this.#add(file);
	}

	/** One extended header line; false when the line is not one, which ends the headers. */
	#extended(file, line) {
		const known = {
			'new file mode': rest => ((file.status = 'added'), (file.mode.new = rest)),
			'deleted file mode': rest => ((file.status = 'deleted'), (file.mode.old = rest)),
			'old mode': rest => (file.mode.old = rest),
			'new mode': rest => (file.mode.new = rest),
			'rename from': rest => ((file.status = 'renamed'), (file.from = PatchPath.plain(rest))),
			'rename to': rest => ((file.status = 'renamed'), (file.to = PatchPath.plain(rest))),
			'copy from': rest => ((file.status = 'copied'), (file.from = PatchPath.plain(rest))),
			'copy to': rest => ((file.status = 'copied'), (file.to = PatchPath.plain(rest))),
			'similarity index': () => null,
			'dissimilarity index': () => null,
			index: () => null
		};
		const key = Object.keys(known).find(name => line.startsWith(`${name} `));
		if (key) {
			known[key](line.slice(key.length + 1).trim());
			this.#at += 1;
			return true;
		}
		if (line.startsWith('Binary files ') && line.endsWith(' differ')) {
			file.binary = true;
			const [, before, after] = /^Binary files (.*) and (.*) differ$/.exec(line) ?? [];
			if (before === '/dev/null') file.status ??= 'added';
			if (after === '/dev/null') file.status ??= 'deleted';
			this.#at += 1;
			return true;
		}
		if (line === 'GIT binary patch') {
			file.binary = true;
			this.#at += 1;
			while (this.#at < this.#lines.length && binary.test(this.#line) && !this.#line.startsWith('diff --git ')) this.#at += 1;
			return true;
		}
		return false;
	}

	/** The `---` and `+++` lines: each side's path, or null for `/dev/null`. */
	#sides(file) {
		const before = PatchPath.header(this.#line.slice(4));
		const after = PatchPath.header(this.#lines[this.#at + 1].slice(4));
		this.#at += 2;
		if (before === undefined || after === undefined) file.unread += 1;
		if (before === null) file.status ??= 'added';
		if (after === null) file.status ??= 'deleted';
		if (before) file.old = PatchPath.strip(before, 'a/');
		if (after) file.new = PatchPath.strip(after, 'b/');
	}

	#plain() {
		const before = PatchPath.header(this.#line.slice(4));
		const after = PatchPath.header(this.#lines[this.#at + 1].slice(4));
		this.#at += 2;
		// Strip git's side prefixes only when both sides carry them (`diff -u old/x new/x` keeps its paths)
		const prefixed = (before ?? 'a/').startsWith('a/') && (after ?? 'b/').startsWith('b/');
		const file = { old: prefixed ? PatchPath.strip(before, 'a/') : before, new: prefixed ? PatchPath.strip(after, 'b/') : after, status: before === null ? 'added' : after === null ? 'deleted' : null, binary: false, mode: {}, hunks: [], unread: before === undefined || after === undefined ? 1 : 0 };
		this.#hunks(file);
		this.#add(file);
	}

	#hunks(file) {
		while (this.#at < this.#lines.length) {
			const line = this.#line;
			if (line.startsWith('@@')) this.#hunk(file);
			else if (line === '' && this.#lines[this.#at + 1]?.startsWith('@@')) this.#at += 1;
			else if (/^[+\- \\]/.test(line) && !/^-- ?$/.test(line) && !this.#pair()) {
				// Lines past a hunk's counts: the header and its body disagree
				file.unread += 1;
				this.#skip();
			} else break;
		}
	}

	/** One hunk, read by its header's counts; a hunk that ends early or does not parse is counted unread. */
	#hunk(file) {
		const match = hunk.exec(this.#line);
		this.#at += 1;
		if (!match) {
			file.unread += 1;
			this.#skip();
			return;
		}
		let old = match[2] === undefined ? 1 : Number(match[2]);
		let next = match[4] === undefined ? 1 : Number(match[4]);
		const lines = [];
		while (old > 0 || next > 0) {
			const line = this.#lines[this.#at];
			const sign = line?.[0];
			if (line === undefined) break;
			if ((sign === ' ' || line === '') && old > 0 && next > 0) {
				lines.push({ kind: 'context', text: line.slice(1) });
				old -= 1;
				next -= 1;
			} else if (sign === '-' && old > 0) {
				lines.push({ kind: 'delete', text: line.slice(1) });
				old -= 1;
			} else if (sign === '+' && next > 0) {
				lines.push({ kind: 'add', text: line.slice(1) });
				next -= 1;
			} else if (sign === '\\') lines.push({ kind: 'note', text: line.slice(1).trim() });
			else break;
			this.#at += 1;
		}
		if (old > 0 || next > 0) file.unread += 1;
		else if (this.#line?.startsWith('\\')) {
			lines.push({ kind: 'note', text: this.#line.slice(1).trim() });
			this.#at += 1;
		}
		file.hunks.push({ old: Number(match[1]), new: Number(match[3]), header: match[5] || null, lines });
	}

	#add(file) {
		const old = file.from ?? file.old;
		const next = file.to ?? file.new;
		const status = file.status ?? 'modified';
		const path = status === 'deleted' ? (old ?? next) : (next ?? old);
		if (!path) {
			this.#unread += 1;
			return;
		}
		const mode = file.mode.old || file.mode.new ? { old: file.mode.old ?? null, new: file.mode.new ?? null } : null;
		const moved = (status === 'renamed' || status === 'copied') && old && old !== path;
		this.#files.push({ path, previous: moved ? old : null, status, binary: file.binary, mode, hunks: file.hunks, unread: file.unread });
	}
}
