import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { Window } from 'happy-dom';
import { Page } from './support/page.mjs';

/**
 * Highlighter (0.14.0): names and aliases, languages of paths, tokens that join back to the text in every
 * language, what each language colors (multi-line constructs included), the bound on length, a linear
 * scan, and nodes built with the element's own document, never from markup; then the code it colors in
 * `Diff` (by path, by a file's `language`, or off) and in an activity section with a `language`.
 */
const page = new Page();
const { Highlighter } = await import('../src/dom/code/highlighter.js');
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const extensions = { javascript: 'js', typescript: 'ts', json: 'json', shell: 'sh', css: 'css', html: 'html', markdown: 'md', python: 'py' };
const fixture = language => readFileSync(new URL(`./fixtures/code/sample.${extensions[language]}`, import.meta.url), 'utf8');
const colored = (language, text) => new Highlighter(language).tokens(text).filter(token => token.kind).map(token => `${token.kind}:${token.text}`);
const includes = (language, expected) => {
	const found = colored(language, fixture(language));
	for (const piece of expected) assert.ok(found.includes(piece), `${language}: ${piece} in ${JSON.stringify(found)}`);
	return found;
};

test('languages, names and aliases in any case, and unknown names as null', () => {
	assert.deepEqual(Highlighter.languages, ['javascript', 'typescript', 'json', 'shell', 'css', 'html', 'markdown', 'python']);
	assert.deepEqual(Highlighter.kinds, ['comment', 'keyword', 'string', 'number', 'name', 'tag']);
	const aliases = { js: 'javascript', JSX: 'javascript', mjs: 'javascript', cjs: 'javascript', ts: 'typescript', TSX: 'typescript', jsonc: 'json', sh: 'shell', Bash: 'shell', zsh: 'shell', console: 'shell', scss: 'css', htm: 'html', xml: 'html', svg: 'html', vue: 'html', md: 'markdown', Markdown: 'markdown', py: 'python', python: 'python' };
	for (const [name, language] of Object.entries(aliases)) assert.equal(Highlighter.language(name), language, name);
	for (const name of ['rust', '', 'text', null, undefined, 3, {}]) assert.equal(Highlighter.language(name), null, String(name));
});

test('from: a path’s language by its extension or a well-known name, else null', () => {
	const paths = { 'src/app.js': 'javascript', 'a/b/Component.TSX': 'typescript', 'package-lock.json': 'json', 'tools\\build.sh': 'shell', '.bashrc': 'shell', 'home/.zshrc': 'shell', 'styles/code.scss': 'css', 'index.html': 'html', 'icon.svg': 'html', 'README.md': 'markdown', 'tools/run.py': 'python' };
	for (const [path, language] of Object.entries(paths)) assert.equal(Highlighter.from(path), language, path);
	for (const path of ['Dockerfile', 'notes.txt', 'Makefile', '.gitignore', 'archive.tar.gz', '', null, 42]) assert.equal(Highlighter.from(path), null, String(path));
});

test('tokens join back to exactly the text, in every language and for every fixture, with plain pieces merged and known kinds', () => {
	const texts = [...readdirSync(new URL('./fixtures/code/', import.meta.url))].map(name => readFileSync(new URL(`./fixtures/code/${name}`, import.meta.url), 'utf8'));
	texts.push('', ' ', '\n\n', 'é😀 ünïcode', '"unterminated', '/* open', '`open ${', "'''open", '<!-- open', '```\nopen', '<a b="');
	for (const language of [...Highlighter.languages, null, 'rust']) {
		const highlighter = new Highlighter(language);
		for (const text of texts) {
			const tokens = highlighter.tokens(text);
			assert.equal(tokens.map(token => token.text).join(''), text, `${language}: ${JSON.stringify(text.slice(0, 20))}`);
			for (const [at, token] of tokens.entries()) {
				assert.ok(token.text.length > 0, 'no empty token');
				assert.ok(token.kind === null || Highlighter.kinds.includes(token.kind), token.kind);
				assert.ok(!(token.kind === null && tokens[at - 1]?.kind === null), 'adjacent plain pieces are one token');
			}
		}
	}
});

test('a plain highlighter: an unknown or no language reads one plain token, an empty text none', () => {
	for (const language of [null, undefined, 'rust']) {
		const highlighter = new Highlighter(language);
		assert.equal(highlighter.language, null);
		assert.deepEqual(highlighter.tokens('const a = 1;'), [{ kind: null, text: 'const a = 1;' }]);
	}
	assert.equal(new Highlighter('JS').language, 'javascript');
	assert.deepEqual(new Highlighter('js').tokens(''), []);
});

test('JavaScript: keywords, strings, template literals across lines, regular expressions, division, numbers, literals, keys and comments', () => {
	const found = includes('javascript', ['keyword:import', 'keyword:from', "string:'node:fs/promises'", 'comment:/* A block comment\n   across two lines */', 'keyword:export', 'keyword:async', 'keyword:function', 'number:3', 'name:encoding', "string:'utf8'", 'number:0x1F_FF', 'number:10n', 'number:1.5e-3', 'string:/^[a-z/]+\\.js$/i', 'number:2', 'comment:// division, not a pattern', 'string:`Loading ${path}\non two lines`', 'number:undefined', 'number:null', 'number:NaN', 'keyword:await', 'number:false']);
	assert.ok(!found.some(piece => piece.startsWith('string:/ 2')), 'a slash after a name divides');
	assert.ok(!found.includes('name:text'), 'a name not before a colon stays plain');
});

test('TypeScript: its own keywords on top of JavaScript’s, and property keys as names', () => {
	includes('typescript', ['keyword:interface', 'keyword:readonly', 'name:name', 'name:count', 'keyword:string', 'keyword:number', 'keyword:type', "string:'auto'", 'keyword:abstract', 'keyword:implements', 'keyword:private', 'name:items', 'keyword:public', 'name:label', 'keyword:keyof', 'keyword:unknown']);
	assert.ok(!colored('javascript', fixture('typescript')).includes('keyword:interface'), 'JavaScript does not read TypeScript’s keywords');
});

test('JSON: keys as names, strings, numbers, literals and JSONC comments', () => {
	includes('json', ['name:"name"', 'string:"@beyond-js/ui"', 'comment:// JSONC comments are read too', 'number:true', 'string:"src"', 'number:-1.25e3', 'number:null']);
});

test('shell: comments where a word starts, strings with their variables, variables, assignments, keywords and numbers; flags stay plain', () => {
	const found = includes('shell', ['comment:#!/usr/bin/env bash', 'comment:# Build and pack the package', 'keyword:export', 'name:TARGET', 'name:${HOME}', 'name:NAME', 'keyword:if', 'name:$TARGET', "string:'already there'", 'keyword:else', 'keyword:for', 'keyword:in', 'keyword:do', 'name:$file', 'keyword:done', 'keyword:fi', 'keyword:exit', 'number:0', 'comment:# done']);
	assert.ok(!found.includes('keyword:--done'), 'a flag is one plain word');
	assert.deepEqual(colored('shell', 'a#b ${#list}'), ['name:${#list}'], 'a # inside a word starts no comment');
});

test('CSS: comments across lines, at-rules, selectors as tags, properties as names, values, url() and !important', () => {
	includes('css', ['comment:/* The code block\n   in both themes */', 'keyword:@media', 'name:min-width', 'number:40em', 'tag:.bui-code', 'tag:pre', 'tag:#main', 'tag::hover', 'tag:code', 'tag:[data-language="js"]', 'name:color', 'keyword:!important', 'name:margin', 'number:-2px', 'number:1.5em', 'number:10%', 'name:background', 'string:images/back.png', 'number:#fafafa', 'string:"Rubik"']);
});

test('HTML: the doctype, comments across lines, tags, attributes and values, and script and style read in their languages', () => {
	includes('html', ['keyword:<!DOCTYPE html>', 'comment:<!-- A comment\n     over two lines -->', 'tag:html', 'name:lang', 'string:"en"', "string:'page'", 'name:hidden', 'name:data-count', 'string:3', 'tag:p', 'tag:b', 'tag:script', 'name:type', 'keyword:const', "string:'<b>'", 'tag:style', 'tag:.page', 'name:color', 'tag:img', 'name:src']);
	assert.ok(!colored('html', fixture('html')).includes('tag:b>'), 'a tag inside a script string is not a tag');
});

test('Markdown: headings as tags, inline and fenced code as strings, link addresses as names; emphasis plain', () => {
	const found = includes('markdown', ['tag:# Highlighter', 'string:`inline code`', 'name:https://beyondjs.com/docs', 'name:https://example.com', 'string:```js\n// a fenced block\nconst a = 1;\n```', 'tag:## Second heading']);
	assert.ok(!found.some(piece => piece.includes('emphasis')));
	assert.deepEqual(colored('markdown', 'a # not a heading'), []);
});

test('Python: decorators, keywords, triple-quoted strings across lines, prefixed strings, comments, numbers and literals', () => {
	includes('python', ['name:@dataclass', 'keyword:class', 'string:"""A report\n    across lines."""', 'keyword:def', 'number:None', 'number:1_000.5', "string:rb'\\d+'", 'comment:# Sum the values', 'keyword:if', 'keyword:is', 'keyword:return', 'number:False', 'string:f"{len(values)} values"', "string:'x'", 'number:0x1F', 'number:3j']);
	assert.deepEqual(colored('python', 'a @ b'), [], 'an operator inside a line is no decorator');
});

test('a text longer than the limit is one plain token; the limit is configurable', () => {
	const text = 'const a = 1;\n'.repeat(20);
	const saved = Highlighter.limit;
	try {
		Highlighter.limit = text.length - 1;
		assert.deepEqual(new Highlighter('js').tokens(text), [{ kind: null, text }]);
		Highlighter.limit = text.length;
		assert.ok(new Highlighter('js').tokens(text).length > 1);
	} finally {
		Highlighter.limit = saved;
	}
	assert.equal(Highlighter.limit, 200_000);
});

test('the scan is linear: texts built to make a backtracking scanner slow are read in bounded time', () => {
	const seeds = ['/[', '/\\', '-', '"', '`', '<a x=', '` `` ', '/*', '<!--', '$\'', '{a:', '@media', "'''", '](', '\n```'];
	const size = 150_000;
	for (const language of Highlighter.languages) {
		const highlighter = new Highlighter(language);
		for (const seed of seeds) {
			const text = seed.repeat(Math.ceil(size / seed.length)).slice(0, size);
			const start = performance.now();
			const tokens = highlighter.tokens(text);
			const time = performance.now() - start;
			assert.equal(tokens.reduce((sum, token) => sum + token.text.length, 0), size);
			assert.ok(time < 2000, `${language} ${JSON.stringify(seed)} took ${Math.round(time)} ms`);
		}
	}
});

test('fill: spans of the kinds and plain text nodes in place of the element’s children, made by its own document; returned', async () => {
	const code = document.createElement('code');
	code.append(document.createElement('b'), 'old');
	const text = "const a = 'x'; // note";
	assert.equal(new Highlighter('js').fill(code, text), code);
	assert.equal(code.textContent, text);
	assert.deepEqual([...code.children].map(node => `${node.className}:${node.textContent}`), ['bui-code-keyword:const', "bui-code-string:'x'", 'bui-code-comment:// note']);
	assert.ok([...code.children].every(node => node.tagName === 'SPAN' && node.children.length === 0));
	const other = new Window();
	const foreign = other.document.createElement('pre');
	new Highlighter('py').fill(foreign, 'return None');
	assert.ok([...foreign.childNodes].every(node => node.ownerDocument === other.document), 'nodes of the element’s document');
	assert.equal(foreign.querySelector('.bui-code-number').textContent, 'None');
	new Highlighter(null).fill(code, '<b>not markup</b>');
	assert.equal(code.children.length, 0, 'text is never read as markup');
	assert.equal(code.textContent, '<b>not markup</b>');
	await other.happyDOM.close();
});

test('the highlighter and what draws it never build markup from text', () => {
	const sources = ['code/highlighter.js', 'code/scanner.js', 'code/grammars.js', 'code/script.js', 'code/shell.js', 'code/style.js', 'code/markup.js', 'diff/rows.js', 'diff/lines.js', 'activity/section.js'];
	for (const path of sources) assert.doesNotMatch(readFileSync(new URL(`../src/dom/${path}`, import.meta.url), 'utf8'), /innerHTML|outerHTML|insertAdjacentHTML|createContextualFragment|DOMParser/, path);
});

const patch = path => `diff --git a/${path} b/${path}\n--- a/${path}\n+++ b/${path}\n@@ -1,2 +1,2 @@\n-const total = 1;\n+const total = 2; // two\n return total;\n`;
const lines = diff => [...diff.element.querySelectorAll('.bui-diff-line')];

test('Diff: each line’s code colored in its path’s language, after the said prefix, the gutter and the line’s text unchanged', () => {
	const diff = new ui.Diff({ patch: patch('src/app.js') }).mount(document.body);
	const [removed, added, context] = lines(diff);
	assert.equal(diff.element.querySelector('.bui-diff-lines').dataset.language, 'javascript');
	assert.equal(added.querySelector('.bui-code-keyword').textContent, 'const');
	assert.equal(added.querySelector('.bui-code-number').textContent, '2');
	assert.equal(added.querySelector('.bui-code-comment').textContent, '// two');
	assert.equal(context.querySelector('.bui-code-keyword').textContent, 'return');
	const code = added.querySelector('.bui-diff-code');
	assert.ok(code.firstChild.classList.contains('bui-diff-said'), 'the said prefix first, so a screen reader reads it before the code');
	assert.equal(code.firstChild.textContent, 'Added line 1: ');
	assert.equal(code.lastChild.textContent, 'const total = 2; // two', 'the code whole in the line’s last child');
	assert.equal(removed.querySelector('.bui-diff-gutter').querySelectorAll('[class^="bui-code"]').length, 0, 'the gutter holds no code');
	assert.deepEqual(diff.files.map(file => Object.hasOwn(file, 'language')), [false], 'a parsed patch names no language');
	diff.destroy();
});

test('Diff: highlight false, an unknown extension, a language a file names (one not read keeps it plain) and the note line', () => {
	const off = new ui.Diff({ patch: patch('src/app.js'), highlight: false }).mount(document.body);
	assert.equal(off.element.querySelectorAll('[class^="bui-code-"]').length, 0);
	assert.equal(off.element.querySelector('.bui-diff-lines').hasAttribute('data-language'), false);
	assert.equal(lines(off)[1].querySelector('.bui-diff-code').lastChild.nodeType, 3, 'plain text, as before');
	off.destroy();
	const unknown = new ui.Diff({ patch: patch('notes.txt') }).mount(document.body);
	assert.equal(unknown.element.querySelectorAll('[class^="bui-code-"]').length, 0);
	unknown.destroy();
	const hunks = [{ old: 1, new: 1, lines: ['-x = None', '+x = True', '\\ No newline at end of file'] }];
	const named = new ui.Diff({ files: [{ path: 'script', language: 'py', hunks }, { path: 'a.js', language: 'text', hunks: [{ old: 1, new: 1, lines: ['+const a = 1;'] }] }] }).mount(document.body);
	const [script, plain] = [...named.element.querySelectorAll('.bui-diff-file')];
	assert.deepEqual([...script.querySelectorAll('.bui-code-number')].map(node => node.textContent), ['None', 'True']);
	assert.equal(script.querySelector('.bui-diff-lines').dataset.language, 'python');
	assert.equal(script.querySelector('.bui-diff-line[data-kind="note"]').querySelectorAll('[class^="bui-code-"]').length, 0, 'the note is words, not code');
	assert.equal(plain.querySelectorAll('[class^="bui-code-"]').length, 0, 'a named language not read keeps the file plain');
	assert.deepEqual(named.files.map(file => file.language), ['py', 'text'], 'the named language travels with the data');
	named.destroy();
});

test('ActivitySection: a code box with a language colored folded and whole, Copy copies the raw text; without one, plain text as before', async () => {
	const text = Array.from({ length: 20 }, (_, at) => `const line${at} = ${at}; // ${at}`).join('\n');
	const row = new ui.ActivityRow({ glyph: 'file', title: 'Read a.js', body: () => [{ label: 'Output', text, language: 'js' }, { label: 'Log', text: 'const plain = 1;' }, { label: 'Other', text: 'const x = 1;', language: 'rust' }] }).mount(document.body);
	row.element.querySelector('.bui-activity-head').click();
	const [colored, plain, other] = [...row.element.querySelectorAll('.bui-activity-section code')];
	assert.equal(colored.dataset.language, 'javascript');
	assert.equal(colored.querySelectorAll('.bui-code-keyword').length, 12, 'the folded first lines colored');
	assert.equal(colored.textContent, text.split('\n').slice(0, 12).join('\n'));
	row.element.querySelector('.bui-activity-section [aria-expanded]').click();
	assert.equal(colored.querySelectorAll('.bui-code-comment').length, 20, 'every line colored after Show all');
	assert.equal(colored.textContent, text);
	for (const node of [plain, other]) {
		assert.equal(node.children.length, 0, 'no spans without a language read');
		assert.equal(node.hasAttribute('data-language'), false);
	}
	assert.equal(plain.textContent, 'const plain = 1;');
	const copied = [];
	Object.defineProperty(page.window.navigator, 'clipboard', { value: { writeText: async value => copied.push(value) }, configurable: true });
	[...row.element.querySelector('.bui-activity-section').querySelectorAll('button')].find(node => node.textContent === 'Copy').click();
	await page.until(() => copied.length === 1);
	assert.deepEqual(copied, [text], 'the raw text');
	row.destroy();
});
