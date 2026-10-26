import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Page as Window } from './support/page.mjs';

/**
 * A raised panel pinned beside the main column (0.38.0, D189): `Page`'s `pinned` and its setter mark a raised
 * side panel that holds the page's action, never a flat one or a panel kept in view, and keep the page's choice
 * across `raised` and the aside's content; the stylesheet keeps it in view only where it sits beside the main
 * column. Where it sits and what scrolls are measured in the browser acceptance (`checks/pinning.mjs`).
 */
const page = new Window();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const facts = () => [ui.el('p', { text: 'Start web' })];
const aside = region => region.element.querySelector('.bui-page-aside');
const marked = region => [...region.element.querySelectorAll('[data-pinned]')];

/** The bodies of every at-rule of the built sheet with this prelude, its braces matched. */
const blocks = (sheet, prelude) => {
	const found = [];
	for (let at = sheet.indexOf(prelude); at !== -1; at = sheet.indexOf(prelude, at + 1)) {
		const open = sheet.indexOf('{', at);
		let depth = 0;
		for (let index = open; index < sheet.length; index++) {
			if (sheet[index] === '{') depth++;
			else if (sheet[index] === '}' && --depth === 0) {
				found.push(sheet.slice(open + 1, index));
				break;
			}
		}
	}
	return found;
};
/** The sheet with every container query's block taken out: what holds at every width. */
const everywhere = sheet => {
	let rest = sheet;
	for (const body of blocks(sheet, '@container')) rest = rest.replace(body, '');
	return rest;
};
const sheet = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

test('a raised side panel that holds the page\'s action is pinned, with the option and the setter', () => {
	const region = new ui.Page({ aside: facts(), label: 'Start web', raised: true, pinned: true }).mount(document.body);
	assert.equal(region.pinned, true);
	assert.equal(region.raised, true, 'pinning keeps the panel raised');
	assert.deepEqual([aside(region).dataset.raised, aside(region).dataset.pinned], ['', ''], 'the aside says both');
	assert.equal(aside(region).getAttribute('aria-label'), 'Start web', 'its name is kept');
	region.pinned = false;
	assert.equal(region.pinned, false);
	assert.equal('pinned' in aside(region).dataset, false, 'the setter unpins it');
	assert.equal(region.raised, true, 'and leaves it raised');
	region.pinned = true;
	assert.equal(region.pinned, true, 'and pins it again');
	assert.deepEqual(marked(region), [aside(region)], 'only the aside is marked');
	region.destroy();
	assert.equal(document.querySelector('.bui-page'), null);
});

test('a flat side panel and a panel kept in view are never pinned', () => {
	const flat = new ui.Page({ aside: facts(), pinned: true }).mount(document.body);
	assert.equal(flat.pinned, false, 'a flat side panel flows');
	assert.deepEqual(marked(flat), []);
	const empty = new ui.Page({ raised: true, pinned: true }).mount(document.body);
	assert.equal(empty.element.querySelector('.bui-page-aside'), null, 'no side panel without content');
	const kept = new ui.Page({ aside: facts(), raised: true, pinned: true, panel: { cut: '68rem' } }).mount(document.body);
	assert.deepEqual([kept.raised, kept.pinned], [false, false], 'a panel kept in view is neither raised nor pinned');
	assert.deepEqual(marked(kept), [], 'its panel carries no mark');
	kept.raised = true;
	kept.pinned = true;
	assert.deepEqual([kept.pinned, marked(kept).length], [false, 0], 'nor after its setters');
	for (const region of [flat, empty, kept]) region.destroy();
});

test('the page\'s choice is kept: set before raised, across raised taken off and given back, and across the aside\'s content', () => {
	const region = new ui.Page({ aside: facts() }).mount(document.body);
	region.pinned = true;
	assert.equal(region.pinned, false, 'asked while flat, it waits');
	region.raised = true;
	assert.equal(region.pinned, true, 'and pins the panel once raised');
	region.raised = false;
	assert.deepEqual([region.pinned, 'pinned' in aside(region).dataset], [false, false], 'a flat panel loses the pin');
	region.raised = true;
	assert.equal(region.pinned, true, 'raised again, it is pinned again');
	region.aside = null;
	assert.equal(region.element.querySelector('.bui-page-aside'), null, 'the side panel is removed');
	region.aside = [ui.el('p', { text: 'Start api' })];
	assert.deepEqual([region.pinned, aside(region).textContent], [true, 'Start api'], 'pinned across an aside removed and given');
	region.pinned = 0;
	assert.equal(region.pinned, false, 'a falsy value unpins it');
	region.raised = false;
	region.raised = true;
	assert.equal(region.pinned, false, 'and the page keeps that choice too');
	region.destroy();
});

test('the stylesheet keeps a pinned raised panel in view only where it sits beside the main column, below a compact line', () => {
	const wide = blocks(sheet, '@container bui-page (min-width: 68rem)');
	assert.ok(wide.some(body => /\.bui-page-body:has\(> \.bui-page-aside:not\(\.bui-page-panel\)\)\s*\{[^}]*grid-template-columns/.test(body)), 'the side panel goes beside the main column from 68rem');
	const pinned = wide.find(body => body.includes('[data-pinned]')) ?? '';
	const rule = /(?:^|\})\s*\.bui-page-aside\[data-raised\]\[data-pinned\]\s*\{([^}]*)\}/.exec(pinned)?.[1] ?? '';
	assert.match(rule, /position:\s*sticky/, 'beside, it stays in view');
	assert.match(rule, /top:\s*var\(--bui-page-sticky, calc\(var\(--layout-family\) \+ var\(--space-6\)\)\)/, 'at the page\'s sticky edge, as a panel kept in view');
	assert.match(rule, /box-sizing:\s*border-box/, 'its whole box within its height');
	assert.match(rule, /max-height:\s*calc\(100dvh - var\(--bui-page-sticky, calc\(var\(--layout-family\) \+ var\(--space-6\)\)\) - var\(--space-6\)\)/, 'within the window');
	assert.match(rule, /overflow-y:\s*auto/, 'with a scroll of its own');
	assert.doesNotMatch(rule, /overscroll-behavior/, 'it never holds the wheel: a panel that fits lets the page scroll under the pointer (Chrome)');
	const compact = /\.bui-page:has\(> \.bui-page-frame > \.bui-page-compact\) \.bui-page-aside\[data-raised\]\[data-pinned\]\s*\{([^}]*)\}/.exec(pinned)?.[1] ?? '';
	assert.match(compact, /top:\s*calc\(var\(--bui-page-sticky, calc\(var\(--layout-family\) \+ var\(--space-6\)\)\) \+ var\(--bui-page-compact\)\)/, 'below a compact header\'s line');
	assert.match(compact, /max-height:\s*calc\(100dvh - [^;]*- var\(--bui-page-compact\) - var\(--space-6\)\)/);
	const flowing = everywhere(sheet);
	assert.doesNotMatch(flowing, /\[data-pinned\]/, 'below 68rem nothing pins it: it flows');
	assert.doesNotMatch(flowing, /\.bui-page-aside\[data-raised\][^{]*\{[^}]*(position|max-height|overflow)/, 'and a raised panel keeps its place in the flow at every width');
	assert.doesNotMatch(wide.join('\n'), /\.bui-page-aside\[data-raised\](?!\[data-pinned\])[^,{]*\{[^}]*position:\s*sticky/, 'a raised panel without pinned flows beside the main column too');
});
