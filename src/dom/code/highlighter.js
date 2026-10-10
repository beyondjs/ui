import { CodeScanner } from './scanner.js';
import { CodeGrammars } from './grammars.js';

/**
 * A small code highlighter with no dependency (0.14.0): it reads a text in one of a few languages into
 * tokens of six kinds (`comment`, `keyword`, `string`, `number`, `name`, `tag`) and draws them as
 * `span.bui-code-<kind>` elements beside plain text nodes, which the stylesheet colors with the
 * `--color-code-*` tokens. It never builds markup from text: every node is made with the element's own
 * document, so it is safe under a content security policy and Trusted Types.
 *
 * It is a best effort, not a parser: each language is read by a linear scan with sticky patterns, so a
 * text is read in time proportional to its length; one longer than `Highlighter.limit` characters is
 * one plain token. Constructs that span lines (block comments, template literals, triple-quoted
 * strings, HTML comments, fenced code) are read when the whole text is given at once. A highlighter of
 * an unknown language reads every text as plain.
 */
export class Highlighter {
	/** The longest text that is read; a longer one is plain. */
	static limit = 200_000;

	/** The kinds a token may have; a plain token's kind is null. */
	static kinds = Object.freeze(['comment', 'keyword', 'string', 'number', 'name', 'tag']);

	/** The canonical names of the languages read. */
	static get languages() {
		return CodeGrammars.names;
	}

	/**
	 * The canonical name of a language's name or alias (`js`, `TSX`, `bash`, `py`…), or null when it is
	 * not one of `Highlighter.languages`.
	 * @param {string} name
	 */
	static language(name) {
		return CodeGrammars.language(name);
	}

	/**
	 * The language of a file path by its extension or a well-known file name (`.bashrc`), or null.
	 * @param {string} path
	 */
	static from(path) {
		return CodeGrammars.file(path);
	}

	#language;
	#grammar;

	/** @param {string|null} [language] a name or alias; an unknown one or none makes a plain highlighter */
	constructor(language = null) {
		this.#language = Highlighter.language(language);
		this.#grammar = this.#language ? CodeGrammars.get(this.#language) : null;
	}

	/** The canonical name of the language read, or null for a plain highlighter. */
	get language() {
		return this.#language;
	}

	/**
	 * The text as tokens `{ kind, text }` whose texts, joined, are exactly the text; `kind` is one of
	 * `Highlighter.kinds` or null for plain text, and adjacent plain pieces are one token.
	 * @param {string} text
	 * @returns {Array<{kind: string|null, text: string}>}
	 */
	tokens(text) {
		const value = typeof text === 'string' ? text : String(text ?? '');
		if (!value) return [];
		if (!this.#grammar || value.length > Highlighter.limit) return [{ kind: null, text: value }];
		const scanner = new CodeScanner(value);
		this.#grammar.scan(scanner);
		return scanner.tokens.map(token => ({ kind: token.kind, text: token.text }));
	}

	/**
	 * Replaces the children of `element` with the text's tokens: text nodes for plain pieces and a
	 * `span.bui-code-<kind>` for each other, made with the element's own document.
	 * @template {Element|DocumentFragment} T
	 * @param {T} element
	 * @param {string} text
	 * @returns {T}
	 */
	fill(element, text) {
		const document = element.ownerDocument;
		// One fragment rather than spread arguments: a long text may hold more tokens than a call takes
		const fragment = document.createDocumentFragment();
		for (const token of this.tokens(text)) {
			const node = document.createTextNode(token.text);
			if (!token.kind) {
				fragment.append(node);
				continue;
			}
			const span = document.createElement('span');
			span.className = `bui-code-${token.kind}`;
			span.append(node);
			fragment.append(span);
		}
		element.replaceChildren(fragment);
		return element;
	}
}
