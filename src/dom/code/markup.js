import { CodeScanner } from './scanner.js';

const patterns = Object.freeze({
	space: /\s+/y,
	comment: /<!--[\s\S]*?(?:-->|$)/y,
	data: /<!\[CDATA\[[\s\S]*?(?:\]\]>|$)/y,
	doctype: /<![^>]*>?|<\?[\s\S]*?(?:\?>|$)/y,
	open: /(<\/?)([\p{L}_][\p{L}\p{N}_:.-]*)/uy,
	text: /[^<]+/y,
	attribute: /[^\s"'<>/=]+/y,
	value: /"[^"]*"?|'[^']*'?|[^\s"'=<>`]+/y,
	end: /\/?>/y,
	// Markdown
	fence: /[ ]{0,3}(`{3,}|~{3,})[^\n]*/y,
	heading: /[ ]{0,3}#{1,6}(?=[ \t\n]|$)[^\n]*/y,
	code: /(?=(`+))\1(?!`)[^\n]*?(?<!`)\1(?!`)/y,
	ticks: /`+/y,
	link: /(\]\()([^)\s]*)/y,
	auto: /(<)((?:https?|mailto):[^>\s]*)(>?)/y,
	plain: /[^\n`\]<]+/y
});

/**
 * HTML, XML and SVG for `Highlighter`: comments, `CDATA` sections as strings, the doctype and processing
 * instructions as keywords, tag names as tags, attribute names as names and their values as strings.
 * The content of `script` and `style` elements is read with the grammars given for them, when given.
 */
export class MarkupGrammar {
	#inner;

	/** @param {{script?: {scan: Function}, style?: {scan: Function}}} [inner] the grammars of embedded code */
	constructor(inner = {}) {
		this.#inner = inner;
	}

	/** Reads the whole text of `scanner`. */
	scan(scanner) {
		while (!scanner.done) {
			if (scanner.char !== '<') {
				scanner.take(patterns.text);
				continue;
			}
			if (scanner.take(patterns.comment, 'comment') || scanner.take(patterns.data, 'string') || scanner.take(patterns.doctype, 'keyword')) continue;
			const open = scanner.peek(patterns.open);
			if (!open) {
				scanner.push(null, '<');
				continue;
			}
			scanner.push(null, open[1]);
			scanner.push('tag', open[2]);
			const closed = this.#tag(scanner);
			const name = open[2].toLowerCase();
			if (open[1] === '<' && !closed && (name === 'script' || name === 'style')) this.#embedded(scanner, name);
		}
	}

	/** A tag's attributes up to its `>`; true when it has no content: it closes itself (`/>`), a `<` cuts it or the text ends inside it. */
	#tag(scanner) {
		let value = false;
		while (!scanner.done) {
			if (scanner.take(patterns.space)) continue;
			const end = scanner.take(patterns.end);
			if (end) return end[0] === '/>';
			if (scanner.char === '<') return true;
			if (scanner.char === '=') {
				scanner.push(null, '=');
				value = true;
				continue;
			}
			if (value) {
				value = false;
				if (scanner.take(patterns.value, 'string')) continue;
			}
			if (!scanner.take(patterns.attribute, 'name')) scanner.skip();
		}
		return true;
	}

	/** The content of a `script` or `style` element up to its closing tag, read by its own grammar or plain. */
	#embedded(scanner, name) {
		const closing = new RegExp(`</${name}[\\s>/]|</${name}$`, 'gi');
		closing.lastIndex = scanner.at;
		const end = closing.exec(scanner.text)?.index ?? scanner.text.length;
		const grammar = this.#inner[name];
		if (!grammar) return scanner.until(end);
		const inner = new CodeScanner(scanner.text.slice(scanner.at, end));
		grammar.scan(inner);
		scanner.adopt(inner.tokens);
	}
}

/**
 * Markdown for `Highlighter`: headings (`#` lines) as tags, fenced code blocks and inline code as
 * strings, and link addresses (`[text](address)`, `<https://…>`) as names. Emphasis stays plain.
 */
export class MarkdownGrammar {
	/** Reads the whole text of `scanner`. */
	scan(scanner) {
		while (!scanner.done) {
			const char = scanner.char;
			if (char === '\n') {
				scanner.push(null, '\n');
				continue;
			}
			if (scanner.at === 0 || scanner.previous === '\n') {
				if (this.#fence(scanner) || scanner.take(patterns.heading, 'tag')) continue;
			}
			if (char === '`') {
				if (!scanner.take(patterns.code, 'string')) scanner.take(patterns.ticks);
			} else if (char === ']' || char === '<') {
				const link = scanner.peek(char === ']' ? patterns.link : patterns.auto);
				if (!link) scanner.push(null, char);
				else {
					scanner.push(null, link[1]);
					scanner.push('name', link[2]);
					scanner.push(null, link[3] ?? '');
				}
			} else scanner.take(patterns.plain);
		}
	}

	/** A fenced code block, from its opening line through its closing fence, or to the end. */
	#fence(scanner) {
		const open = scanner.peek(patterns.fence);
		if (!open || (open[1][0] === '`' && open[0].slice(open[0].indexOf(open[1]) + open[1].length).includes('`'))) return false;
		const closing = new RegExp(`\\n[ ]{0,3}${open[1][0] === '`' ? '`' : '~'}{${open[1].length},}[ \\t]*(?=\\n|$)`, 'g');
		closing.lastIndex = scanner.at + open[0].length;
		const found = closing.exec(scanner.text);
		scanner.until(found ? found.index + found[0].length : scanner.text.length, 'string');
		return true;
	}
}
