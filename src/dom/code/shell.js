const patterns = Object.freeze({
	space: /\s+/y,
	comment: /#[^\n]*/y,
	single: /\$?'[^']*'?/y,
	inner: /(?:[^"\\$]|\\[\s\S])+/y,
	variable: /\$(?:\{[^}\n]*\}?|[\p{L}_][\p{L}\p{N}_]*|[0-9@*#?$!-])/uy,
	word: /[\p{L}\p{N}_./%+@,:~-]+/uy,
	assignment: /[\p{L}_][\p{L}\p{N}_]*(?==)/uy,
	digits: /^\d+$/,
	// Python
	triple: /(?:[rRbBuUfF]{1,2})?(?:'''[\s\S]*?(?:'''|$)|"""[\s\S]*?(?:"""|$))/y,
	quoted: /(?:[rRbBuUfF]{1,2})?(?:'(?:[^'\\\n]|\\[\s\S])*'?|"(?:[^"\\\n]|\\[\s\S])*"?)/y,
	decorator: /@[\p{L}_][\p{L}\p{N}_.]*/uy,
	number: /(?:0[xX][\da-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|(?:\d[\d_]*(?:\.[\d_]*)?|\.\d[\d_]*)(?:[eE][+-]?\d[\d_]*)?)[jJlL]?/y,
	name: /[\p{L}_][\p{L}\p{N}_]*/uy
});

const words = list => Object.freeze(new Set(list.split(' ')));
const commands = words('if then else elif fi for while until do done case esac in function select return export local readonly declare unset break continue exit source alias');
const keywords = words('and as assert async await break case class continue def del elif else except finally for from global if import in is lambda match nonlocal not or pass raise return try while with yield');
const literals = words('True False None');

/**
 * Shell scripts and console lines for `Highlighter`: `#` comments where a word starts, strings in
 * single quotes (and `$'…'`) and in double quotes with their variables as names, variables (`$HOME`,
 * `${PATH}`, `$1`, `$@`) as names, a variable assigned (`NAME=value`) as a name, whole-number words as
 * numbers and the language's reserved words as keywords. A flag or a path is one plain word, so
 * `--done` never reads as a keyword.
 */
export class ShellGrammar {
	/** Reads the whole text of `scanner`. */
	scan(scanner) {
		while (!scanner.done) {
			if (scanner.take(patterns.space)) continue;
			const char = scanner.char;
			if (char === '#' && (scanner.at === 0 || /[\s;|&(]/.test(scanner.previous))) scanner.take(patterns.comment, 'comment');
			else if (char === "'" || (char === '$' && scanner.text[scanner.at + 1] === "'")) scanner.take(patterns.single, 'string');
			else if (char === '"') this.#quoted(scanner);
			else if (char === '$' && scanner.take(patterns.variable, 'name')) continue;
			else if (scanner.take(patterns.assignment, 'name')) continue;
			else {
				const word = scanner.peek(patterns.word);
				if (!word) scanner.skip();
				else scanner.push(commands.has(word[0]) ? 'keyword' : patterns.digits.test(word[0]) ? 'number' : null, word[0]);
			}
		}
	}

	/** A double-quoted string, which may span lines, with the variables inside it as names. */
	#quoted(scanner) {
		scanner.push('string', '"');
		while (!scanner.done) {
			if (scanner.char === '"') {
				scanner.push('string', '"');
				return;
			}
			if (scanner.take(patterns.inner, 'string')) continue;
			if (!scanner.take(patterns.variable, 'name')) scanner.push('string', '$');
		}
	}
}

/**
 * Python for `Highlighter`: `#` comments, strings with their `r`, `b`, `u` and `f` prefixes, triple-quoted
 * strings across lines, numbers (with separators, exponents and imaginary parts), keywords, `True False
 * None` as numbers and decorators at a line's start as names.
 */
export class PythonGrammar {
	/** Reads the whole text of `scanner`. */
	scan(scanner) {
		while (!scanner.done) {
			if (scanner.take(patterns.space)) continue;
			const char = scanner.char;
			if (char === '#') scanner.take(patterns.comment, 'comment');
			else if (char === '@' && scanner.blank && scanner.take(patterns.decorator, 'name')) continue;
			else if (scanner.take(patterns.triple, 'string') || scanner.take(patterns.quoted, 'string')) continue;
			else if (scanner.take(patterns.number, 'number')) continue;
			else {
				const name = scanner.peek(patterns.name);
				if (!name) scanner.skip();
				else scanner.push(literals.has(name[0]) ? 'number' : keywords.has(name[0]) ? 'keyword' : null, name[0]);
			}
		}
	}
}
