const patterns = Object.freeze({
	space: /\s+/y,
	comment: /\/\*[\s\S]*?(?:\*\/|$)/y,
	string: /'(?:[^'\\\n]|\\[\s\S])*'?|"(?:[^"\\\n]|\\[\s\S])*"?/y,
	statement: /[^{};]*/y,
	rule: /@[\w-]+/y,
	important: /![ \t]*important\b/y,
	url: /(url\()([^)]*)/iy,
	color: /#[\da-fA-F]{3,8}(?![\w-])/y,
	number: /-?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?(?:%|[a-zA-Z]+)?/y,
	word: /-{0,2}[\p{L}_$][\p{L}\p{N}_-]*/uy,
	selector: /(?:::?|[.#])?-{0,2}[\p{L}_][\p{L}\p{N}_-]*|\[[^\]\n]*\]?/uy,
	colon: /:/y
});

/**
 * CSS for `Highlighter` (SCSS and Less read as CSS): block comments, strings, at-rules and `!important`
 * as keywords, selectors (elements, classes, identifiers, pseudo-classes, attributes) as tags,
 * properties as names, numbers with their units and hexadecimal colors as numbers, and the inside of an
 * unquoted `url()` as a string.
 *
 * A statement is told to be a rule's selector or a declaration once, at its start, by what ends it: a
 * `{` opens a rule, so a nested selector reads as one; inside a block anything else is a declaration.
 */
export class StyleGrammar {
	/** Reads the whole text of `scanner`. */
	scan(scanner) {
		const state = { depth: 0, start: true, mode: 'selector', property: false };
		while (!scanner.done) {
			if (scanner.take(patterns.space) || scanner.take(patterns.comment, 'comment')) continue;
			const char = scanner.char;
			if (state.start) this.#begin(scanner, state);
			if (char === '{' || char === '}' || char === ';') {
				state.depth = Math.max(0, state.depth + (char === '{' ? 1 : char === '}' ? -1 : 0));
				state.start = true;
				scanner.push(null, char);
			} else if (char === '"' || char === "'") scanner.take(patterns.string, 'string');
			else if (char === '@' && scanner.take(patterns.rule, 'keyword')) continue;
			else if (char === '!' && scanner.take(patterns.important, 'keyword')) continue;
			else if (state.mode === 'selector') this.#selector(scanner, char);
			else this.#declaration(scanner, state, char);
		}
	}

	/** Decides at a statement's start whether it is a selector, an at-rule's prelude or a declaration. */
	#begin(scanner, state) {
		state.start = false;
		const length = scanner.peek(patterns.statement)[0].length;
		const end = scanner.text[scanner.at + length];
		state.mode = scanner.char === '@' ? 'rule' : end === '{' ? 'selector' : state.depth > 0 ? 'declaration' : 'selector';
		state.property = state.mode === 'declaration';
	}

	#selector(scanner, char) {
		if (/[\d.]/.test(char) && scanner.take(patterns.number, 'number')) return;
		if (!scanner.take(patterns.selector, 'tag')) scanner.skip();
	}

	/** A declaration (`property: value`), or an at-rule's prelude, whose words before a `:` are names. */
	#declaration(scanner, state, char) {
		if (char === ':') {
			state.property = false;
			scanner.push(null, ':');
			return;
		}
		if (char === '#' && scanner.take(patterns.color, 'number')) return;
		if (/[\d.-]/.test(char) && scanner.take(patterns.number, 'number')) return;
		const url = scanner.peek(patterns.url);
		if (url && !/^\s*['"]/.test(url[2])) {
			scanner.push(null, url[1]);
			scanner.push('string', url[2]);
			return;
		}
		const word = scanner.peek(patterns.word);
		if (!word) {
			scanner.skip();
			return;
		}
		const named = state.property || (state.mode === 'rule' && this.#before(scanner, word[0].length));
		scanner.push(named ? 'name' : null, word[0]);
	}

	/** Whether a `:` follows the word of `length` at the position (a feature in `@media (width: 40em)`). */
	#before(scanner, length) {
		patterns.colon.lastIndex = scanner.at + length;
		return patterns.colon.test(scanner.text);
	}
}
