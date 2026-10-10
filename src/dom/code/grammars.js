import { ScriptGrammar, JsonGrammar } from './script.js';
import { ShellGrammar, PythonGrammar } from './shell.js';
import { StyleGrammar } from './style.js';
import { MarkupGrammar, MarkdownGrammar } from './markup.js';

const script = new ScriptGrammar();
const style = new StyleGrammar();

/** One grammar per canonical name; grammars keep no state between texts, so one instance serves every highlighter. */
const grammars = Object.freeze({
	javascript: script,
	typescript: new ScriptGrammar({ typescript: true }),
	json: new JsonGrammar(),
	shell: new ShellGrammar(),
	css: style,
	html: new MarkupGrammar({ script, style }),
	markdown: new MarkdownGrammar(),
	python: new PythonGrammar()
});

/** Names and aliases a product may give, lower case. */
const aliases = Object.freeze({
	javascript: 'javascript js jsx mjs cjs node',
	typescript: 'typescript ts tsx mts cts',
	json: 'json jsonc json5',
	shell: 'shell sh bash zsh ksh console shellscript shell-session',
	css: 'css scss less',
	html: 'html htm xhtml xml svg vue',
	markdown: 'markdown md mdx mkd',
	python: 'python py py3 python3 pyi'
});

/** File extensions, lower case. */
const extensions = Object.freeze({
	javascript: 'js jsx mjs cjs',
	typescript: 'ts tsx mts cts',
	json: 'json jsonc json5',
	shell: 'sh bash zsh ksh',
	css: 'css scss less',
	html: 'html htm xhtml xml svg vue',
	markdown: 'md markdown mdx',
	python: 'py pyi'
});

/** Whole file names that carry no extension of their language, lower case. */
const files = Object.freeze({ '.bashrc': 'shell', '.bash_profile': 'shell', '.zshrc': 'shell', '.zprofile': 'shell', '.profile': 'shell' });

const table = source => Object.freeze(new Map(Object.entries(source).flatMap(([name, list]) => list.split(' ').map(key => [key, name]))));

/**
 * The languages `Highlighter` reads: their grammars by canonical name, and the names, aliases, file
 * extensions and file names that lead to them. Stateless, so its members are static.
 */
export class CodeGrammars {
	static #aliases = table(aliases);
	static #extensions = table(extensions);

	/** The canonical names, in a stable order. */
	static get names() {
		return Object.keys(grammars);
	}

	/** The grammar of a canonical name, or null. */
	static get(name) {
		return Object.hasOwn(grammars, name) ? grammars[name] : null;
	}

	/** The canonical name of a name or an alias (any case), or null. */
	static language(name) {
		if (typeof name !== 'string') return null;
		return CodeGrammars.#aliases.get(name.trim().toLowerCase()) ?? null;
	}

	/** The canonical name of a file path by its file name or extension, or null. */
	static file(path) {
		if (typeof path !== 'string' || !path) return null;
		const name = path.slice(Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\')) + 1).toLowerCase();
		if (Object.hasOwn(files, name)) return files[name];
		const dot = name.lastIndexOf('.');
		return dot > 0 ? (CodeGrammars.#extensions.get(name.slice(dot + 1)) ?? null) : null;
	}
}
