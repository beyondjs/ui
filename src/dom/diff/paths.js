const escapes = Object.freeze({ a: 7, b: 8, t: 9, n: 10, v: 11, f: 12, r: 13, '"': 34, '\\': 92 });

/**
 * Paths as a patch writes them. Git quotes a name with unusual characters in C style
 * (`"a/caf\303\251.txt"`): its escapes (`\t`, `\n`, `\"`, `\\`, …) and octal bytes are decoded, and the
 * bytes are read as UTF-8. A path in a `---`/`+++` line may carry a tab and a timestamp after it (a plain
 * unified diff); `/dev/null` stands for no file. Stateless and pure, so its members are static.
 */
export class PatchPath {
	/**
	 * Reads one path at the start of `text`, quoted or plain. A plain path takes the whole text. Returns
	 * `{ path, rest }`, or null when a quoted path is unterminated or holds an unknown escape.
	 */
	static read(text) {
		if (!text.startsWith('"')) return { path: text, rest: '' };
		const bytes = [];
		const encoder = new TextEncoder();
		let at = 1;
		while (at < text.length) {
			const char = text[at];
			if (char === '"') return { path: new TextDecoder().decode(new Uint8Array(bytes)), rest: text.slice(at + 1) };
			if (char === '\\') {
				const octal = /^[0-7]{1,3}/.exec(text.slice(at + 1));
				if (octal) {
					bytes.push(parseInt(octal[0], 8) & 255);
					at += 1 + octal[0].length;
					continue;
				}
				const next = text[at + 1];
				if (!Object.hasOwn(escapes, next)) return null;
				bytes.push(escapes[next]);
				at += 2;
				continue;
			}
			const point = String.fromCodePoint(text.codePointAt(at));
			bytes.push(...encoder.encode(point));
			at += point.length;
		}
		return null;
	}

	/** The path of a `--- ` or `+++ ` line's remainder: null for `/dev/null`, undefined when unreadable. */
	static header(text) {
		const read = text.startsWith('"') ? PatchPath.read(text) : { path: text.split('\t')[0].trimEnd() };
		if (!read || !read.path) return undefined;
		return read.path === '/dev/null' ? null : read.path;
	}

	/** A path of a `rename from`, `copy to`… line: quoted or plain, never prefixed. */
	static plain(text) {
		const read = PatchPath.read(text);
		return read?.path || undefined;
	}

	/**
	 * The two paths of a `diff --git` line's remainder, without their `a/` and `b/` prefixes, or null.
	 * Unquoted names may hold spaces, so the line is split where both halves name the same file, else at
	 * the first ` b/` (a rename's names come from its own lines).
	 */
	static pair(text) {
		if (text.startsWith('"')) {
			const first = PatchPath.read(text);
			if (!first || !first.rest.startsWith(' ')) return null;
			const second = PatchPath.read(first.rest.slice(1));
			return second ? [PatchPath.strip(first.path, 'a/'), PatchPath.strip(second.path, 'b/')] : null;
		}
		const quoted = text.indexOf(' "');
		if (quoted > 0) {
			const second = PatchPath.read(text.slice(quoted + 1));
			return second ? [PatchPath.strip(text.slice(0, quoted), 'a/'), PatchPath.strip(second.path, 'b/')] : null;
		}
		const half = (text.length - 1) / 2;
		if (Number.isInteger(half) && text[half] === ' ') {
			const [left, right] = [PatchPath.strip(text.slice(0, half), 'a/'), PatchPath.strip(text.slice(half + 1), 'b/')];
			if (left === right) return [left, right];
		}
		const split = text.indexOf(' b/');
		if (split > 0) return [PatchPath.strip(text.slice(0, split), 'a/'), text.slice(split + 3)];
		return null;
	}

	/** The path without git's side prefix (`a/` or `b/`); other paths unchanged. */
	static strip(path, prefix) {
		return typeof path === 'string' && path.startsWith(prefix) ? path.slice(prefix.length) : path;
	}
}
