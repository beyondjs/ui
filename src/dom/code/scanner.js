const fallback = /\s+|[\p{L}\p{N}_$]+|[\s\S]/uy;

/**
 * One pass over a text for a grammar of `Highlighter`: a position that only moves forward, sticky
 * patterns tried where it stands, and the tokens read so far as `{ kind, text }`, adjacent plain pieces
 * merged. Every grammar step consumes at least one character, so a pass is linear in the text as long
 * as each pattern is (patterns are sticky and written without nested ambiguous repetition).
 *
 * It also remembers what grammars ask about the code behind the position: the last significant piece
 * (`last`, neither space nor comment), the character before it (`previous`) and whether only spaces or
 * tabs stand between the line's start and the position (`blank`).
 */
export class CodeScanner {
	#text;
	#at = 0;
	#tokens = [];
	#last = null;
	#blank = true;

	/** @param {string} text */
	constructor(text) {
		this.#text = text;
	}

	get text() {
		return this.#text;
	}

	/** The position of the next character to read. */
	get at() {
		return this.#at;
	}

	/** Whether the whole text is read. */
	get done() {
		return this.#at >= this.#text.length;
	}

	/** The character at the position, or '' at the end. */
	get char() {
		return this.#text[this.#at] ?? '';
	}

	/** The character before the position, or '' at the start. */
	get previous() {
		return this.#text[this.#at - 1] ?? '';
	}

	/** The last piece read that is neither space nor comment, as `{ kind, text }`, or null. */
	get last() {
		return this.#last;
	}

	/** Whether only spaces or tabs stand between the start of the line and the position. */
	get blank() {
		return this.#blank;
	}

	/** The tokens read so far. */
	get tokens() {
		return this.#tokens;
	}

	/** The match of a sticky pattern at the position, without reading it; null when it does not match. */
	peek(pattern) {
		pattern.lastIndex = this.#at;
		return pattern.exec(this.#text);
	}

	/** Reads the match of a sticky pattern at the position as one token of `kind`; null when there is none. */
	take(pattern, kind = null) {
		const match = this.peek(pattern);
		if (!match || !match[0]) return null;
		this.push(kind, match[0]);
		return match;
	}

	/** Reads the text up to `end` (an index) as one token of `kind`. */
	until(end, kind = null) {
		const stop = Math.min(Math.max(end, this.#at), this.#text.length);
		if (stop > this.#at) this.push(kind, this.#text.slice(this.#at, stop));
	}

	/** Reads one space run, word or character as plain text: what a grammar does when nothing else matches. */
	skip() {
		this.take(fallback);
	}

	/** Adds `text` as a token of `kind` (null for plain) and moves past it. */
	push(kind, text) {
		if (!text) return;
		this.#at += text.length;
		const tail = this.#tokens.at(-1);
		if (kind === null && tail?.kind === null) tail.text += text;
		else this.#tokens.push({ kind, text });
		if (kind !== 'comment' && text.trim()) this.#last = { kind, text };
		const line = text.lastIndexOf('\n');
		const rest = line < 0 ? text : text.slice(line + 1);
		this.#blank = (line >= 0 || this.#blank) && /^[ \t]*$/.test(rest);
	}

	/** Adds the tokens of another pass, as read there, after this one's. */
	adopt(tokens) {
		for (const token of tokens) this.push(token.kind, token.text);
	}
}
