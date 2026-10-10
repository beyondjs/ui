const patterns = Object.freeze({
	line: /\/\/[^\n]*/y,
	block: /\/\*[\s\S]*?(?:\*\/|$)/y,
	string: /'(?:[^'\\\n]|\\[\s\S])*'?|"(?:[^"\\\n]|\\[\s\S])*"?/y,
	template: /`(?:[^`\\]|\\[\s\S])*`?/y,
	// A class, an escape or any other character up to the closing slash, on one line, then the flags
	regex: /\/(?![*/])(?:[^/\\\n[]|\\.|\[(?:[^\]\\\n]|\\.)*\])+\/[dgimsuvy]*/y,
	number: /(?:0[xX][\da-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|(?:\d[\d_]*(?:\.[\d_]*)?|\.\d[\d_]*)(?:[eE][+-]?\d[\d_]*)?)n?/y,
	word: /[\p{L}_$][\p{L}\p{N}_$]*/uy,
	key: /[ \t]*\??:(?!:)/y,
	json: /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/y,
	space: /\s+/y
});

const words = list => Object.freeze(new Set(list.split(' ')));
const keywords = words('as async await break case catch class const continue debugger default delete do else export extends finally for from function if import in instanceof let new of return static super switch this throw try typeof var void while with yield');
const typed = words('abstract any asserts bigint boolean declare enum implements infer interface is keyof module namespace never number object override private protected public readonly satisfies string symbol type unique unknown');
const literals = words('true false null undefined NaN Infinity');
// Keywords that stand for a value: a slash after them divides, after any other keyword it starts a regular expression
const values = words('this super');
// A member's modifiers, after which a name before a `:` is the member's key
const modifiers = words('abstract declare override private protected public readonly static');

/**
 * JavaScript and TypeScript for `Highlighter`: line and block comments, strings in single and double
 * quotes, template literals as one string (their `${}` included), regular expression literals where a
 * value cannot stand, numbers (hexadecimal, binary, octal, separators, exponents, BigInt), keywords
 * (TypeScript's own with `typescript`), `true false null undefined NaN Infinity` as numbers and the key
 * of an object or a parameter before its `:` as a name.
 */
export class ScriptGrammar {
	#keywords;

	/** @param {{typescript?: boolean}} [options] */
	constructor({ typescript = false } = {}) {
		this.#keywords = typescript ? new Set([...keywords, ...typed]) : keywords;
	}

	/** Reads the whole text of `scanner`. */
	scan(scanner) {
		// Past a regular expression that did not close, none is tried again on its line, so a line of
		// slashes and brackets is read once rather than once per slash
		let stop = 0;
		while (!scanner.done) {
			if (scanner.take(patterns.space)) continue;
			const char = scanner.char;
			if (char === '/') {
				if (scanner.take(patterns.line, 'comment') || scanner.take(patterns.block, 'comment')) continue;
				if (scanner.at < stop || this.#division(scanner)) scanner.push(null, '/');
				else if (!scanner.take(patterns.regex, 'string')) {
					const end = scanner.text.indexOf('\n', scanner.at);
					stop = end < 0 ? scanner.text.length : end;
					scanner.push(null, '/');
				}
				continue;
			}
			if (char === '"' || char === "'") {
				const match = scanner.peek(patterns.string);
				scanner.push(this.#key(scanner, match[0].length) ? 'name' : 'string', match[0]);
				continue;
			}
			if (char === '`') {
				scanner.take(patterns.template, 'string');
				continue;
			}
			if (scanner.take(patterns.number, 'number')) continue;
			const word = scanner.peek(patterns.word);
			if (word) {
				scanner.push(this.#kind(scanner, word[0]), word[0]);
				continue;
			}
			scanner.skip();
		}
	}

	#kind(scanner, word) {
		if (literals.has(word)) return 'number';
		if (this.#keywords.has(word)) return 'keyword';
		return this.#key(scanner, word.length) ? 'name' : null;
	}

	/** Whether the piece of `length` at the position is a key: after `{`, `,`, `;`, `(` or a modifier, and before a `:` (or `?:`). */
	#key(scanner, length) {
		const last = scanner.last;
		if (!['{', ',', ';', '('].includes(last?.text) && !(last?.kind === 'keyword' && modifiers.has(last.text))) return false;
		patterns.key.lastIndex = scanner.at + length;
		return patterns.key.test(scanner.text);
	}

	/** Whether a slash here divides: it follows a value (a name, a number, a string, a closing bracket). */
	#division(scanner) {
		// `</` closes a JSX element; it never starts an expression
		if (scanner.previous === '<') return true;
		const last = scanner.last;
		if (!last) return false;
		if (last.kind === 'keyword') return values.has(last.text);
		if (last.kind !== null) return true;
		return /[\p{L}\p{N}_$)\]}]$/u.test(last.text);
	}
}

/**
 * JSON for `Highlighter`, with the comments of JSONC: keys as names, other strings, numbers and
 * `true false null` as numbers.
 */
export class JsonGrammar {
	/** Reads the whole text of `scanner`. */
	scan(scanner) {
		while (!scanner.done) {
			if (scanner.take(patterns.space)) continue;
			const char = scanner.char;
			if (char === '/' && (scanner.take(patterns.line, 'comment') || scanner.take(patterns.block, 'comment'))) continue;
			if (char === '"' || char === "'") {
				const match = scanner.peek(patterns.string);
				patterns.key.lastIndex = scanner.at + match[0].length;
				scanner.push(patterns.key.test(scanner.text) ? 'name' : 'string', match[0]);
				continue;
			}
			if (scanner.take(patterns.json, 'number')) continue;
			const word = scanner.peek(patterns.word);
			if (word) scanner.push(['true', 'false', 'null'].includes(word[0]) ? 'number' : null, word[0]);
			else scanner.skip();
		}
	}
}
