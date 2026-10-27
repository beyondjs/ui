import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Page as Window } from './support/page.mjs';

/**
 * D187 (0.44.0): focus says what the keys do there. `Focus` warns in a development build, once per element,
 * when a place reading starts draws an outline or a ring, and when a box that takes typing draws an outline or
 * the ring's coral, or the danger while its value is not marked wrong. Computed styles are stubbed (`measure`)
 * with the strings an engine gives; the engines' own paint is measured by the browser acceptance.
 */
const page = new Window();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const roles = { focus: '#cb6245', danger: '#b3261e' };
const coral = 'rgb(203, 98, 69)';
const rest = { outline: 'none', width: 0, color: 'rgb(18, 31, 54)', borders: [], shadow: 'none', ...roles };
/** A paint per element, the resting one for any other. */
const painter = paints => node => ({ ...rest, ...(paints.get(node) ?? {}) });
const settle = () => new Promise(resolve => setTimeout(resolve, 20));
const nodes = html => {
	const root = document.body.appendChild(document.createElement('main'));
	root.innerHTML = html;
	return root;
};

test('a place reading starts that draws an outline or a ring is warned once, with the rule; one that draws nothing is not', async () => {
	const root = nodes('<h2 id="results" tabindex="-1">Results</h2><h2 id="ringed" tabindex="-1">Ringed</h2><section id="quiet" tabindex="-1" aria-label="Rows"></section><div id="raised" tabindex="-1">Raised</div><div id="clear" tabindex="-1">Clear</div>');
	const [results, ringed, quiet, raised, clear] = ['results', 'ringed', 'quiet', 'raised', 'clear'].map(id => document.getElementById(id));
	const paints = new Map([
		[results, { outline: 'solid', width: 2, color: coral }],
		[ringed, { shadow: `${coral} 0px 0px 0px 2px, rgba(0, 0, 0, 0.12) 0px 1px 3px 0px` }],
		[raised, { shadow: 'rgba(0, 0, 0, 0.12) 0px 1px 3px 0px, rgba(0, 0, 0, 0.08) 0px 4px 12px 0px' }],
		[clear, { outline: 'solid', width: 2, color: 'rgba(0, 0, 0, 0)' }]
	]);
	const warned = [];
	const focus = new ui.Focus({ root: document, warn: (message, node) => warned.push([message, node]), measure: painter(paints) });
	for (const node of [results, ringed, quiet, raised, clear]) {
		node.focus();
		await settle();
	}
	assert.deepEqual(warned.map(([, node]) => node.id), ['results', 'ringed'], 'an outline and a ring; nothing, an elevation and a transparent outline pass');
	assert.equal(warned[0][0], '@beyond-js/ui: the h2 "Results", focused for reading, draws an outline; D187: a place reading starts draws nothing.');
	assert.match(warned[1][0], /the h2 "Ringed", focused for reading, draws a ring; D187: a place reading starts draws nothing\.$/);
	results.focus();
	await settle();
	assert.equal(warned.length, 2, 'once per element');
	assert.deepEqual(focus.check(results), { node: results, reason: 'reading', drawn: ['outline'] }, 'check() still says what it draws');
	focus.destroy();
	assert.equal(ui.Focus.enabled, false, 'off outside a development build');
});

test('a control the keyboard reached is not a place reading starts: its ring is the family\'s', async () => {
	const root = nodes('<button id="button">Open files</button><a id="link" href="#x">Docs</a><div id="option" role="option" tabindex="-1">Europe</div><section id="card" class="bui-command" tabindex="-1">Run</section><div id="hunk" class="bui-diff-hunk" tabindex="-1">@@ -1 +1 @@</div><input id="check" type="checkbox" aria-label="Notify" />');
	const ring = { outline: 'solid', width: 2, color: coral };
	const paints = new Map([...root.querySelectorAll('*')].map(node => [node, ring]));
	const warned = [];
	const focus = new ui.Focus({ root, warn: message => warned.push(message), measure: painter(paints) });
	for (const node of root.querySelectorAll('*')) {
		node.focus();
		await settle();
	}
	assert.deepEqual(warned, []);
	assert.equal(focus.check(document.getElementById('check')), null, 'a checkbox is a control, not a box that takes typing');
	focus.destroy();
});

test('a box that takes typing that draws an outline, the ring\'s coral or an unmarked danger is warned; its lit edge and a wrong value\'s danger are not', async () => {
	const root = nodes(
		[
			'<label>Name <input id="outlined" /></label>',
			'<input id="bordered" aria-label="Branch" />',
			'<textarea id="haloed" aria-label="Message"></textarea>',
			'<select id="danger" aria-label="Region"><option>Europe</option></select>',
			'<input id="wrong" aria-label="Email" aria-invalid="true" />',
			'<input id="lit" aria-label="Repository name" />',
			'<div class="bui-edge" id="box"><input id="inside" aria-label="Search" /></div>',
			'<div class="bui-edge" id="refused" data-invalid><input id="refusing" aria-label="Host" /></div>'
		].join('')
	);
	const by = id => document.getElementById(id);
	const paints = new Map([
		[by('outlined'), { outline: 'auto', width: 3, color: 'rgb(0, 95, 204)' }],
		[by('bordered'), { borders: [coral, coral, coral, coral] }],
		[by('haloed'), { borders: ['rgb(18, 31, 54)'], shadow: 'color(srgb 0.796 0.384 0.271 / 0.14) 0px 0px 0px 3px' }],
		[by('danger'), { borders: ['rgb(179, 38, 30)'] }],
		[by('wrong'), { borders: ['rgb(179, 38, 30)'], shadow: 'color(srgb 0.702 0.149 0.118 / 0.16) 0px 0px 0px 3px' }],
		[by('lit'), { borders: ['rgb(18, 31, 54)'], shadow: 'color(srgb 0.0706 0.1216 0.2118 / 0.14) 0px 0px 0px 3px' }],
		[by('box'), { borders: ['#CB6245'] }],
		[by('refused'), { borders: ['rgb(179, 38, 30)'] }]
	]);
	const warned = [];
	const focus = new ui.Focus({ root, warn: (message, node) => warned.push([node.id, message]), measure: painter(paints) });
	for (const id of ['outlined', 'bordered', 'haloed', 'danger', 'wrong', 'lit', 'inside', 'refusing']) {
		by(id).focus();
		await settle();
	}
	assert.deepEqual(
		warned.map(([id]) => id),
		['outlined', 'bordered', 'haloed', 'danger', 'inside']
	);
	const said = Object.fromEntries(warned);
	assert.equal(said.outlined, '@beyond-js/ui: the input "Name" draws an outline when focused; D187: a box that takes typing lights its edge.');
	assert.match(said.bordered, /the input "Branch" draws the ring's coral \(--color-focus\) when focused/);
	assert.match(said.danger, /the select "Region" draws the danger \(--color-danger\) with no wrong value marked when focused; D187: a box that takes typing lights its edge\.$/);
	assert.match(said.inside, /the input "Search" draws the ring's coral/, "its box's coral border is the field's");
	assert.deepEqual(focus.check(by('lit')), null);
	focus.destroy();
});

test('it checks once the focus has settled, only while the element still has it, and never in a forced-colors theme or once destroyed', async () => {
	const root = nodes('<h2 id="first" tabindex="-1">First</h2><h2 id="second" tabindex="-1">Second</h2><h2 id="third" tabindex="-1">Third</h2>');
	const [first, second, third] = ['first', 'second', 'third'].map(id => document.getElementById(id));
	const outline = { outline: 'solid', width: 2, color: coral };
	const paints = new Map([first, second, third].map(node => [node, outline]));
	const warned = [];
	const focus = new ui.Focus({ root, warn: (message, node) => warned.push(node.id), measure: painter(paints) });
	first.focus();
	second.focus();
	await settle();
	assert.deepEqual(warned, ['second'], 'the first lost the focus before it settled');
	const media = window.matchMedia;
	window.matchMedia = query => ({ matches: query === '(forced-colors: active)', media: query });
	try {
		assert.equal(focus.check(third), null, 'a forced-colors theme draws every form as a system outline');
	} finally {
		window.matchMedia = media;
	}
	focus.destroy();
	third.focus();
	await settle();
	assert.deepEqual(warned, ['second'], 'destroyed, it hears nothing');
});

test('a Page follows focus over its document in a development build, and stops when it is destroyed', async () => {
	const warnings = [];
	const original = console.warn;
	console.warn = message => warnings.push(message);
	ui.Focus.enabled = true;
	try {
		const heading = Object.assign(document.createElement('h2'), { textContent: 'Results', tabIndex: -1 });
		heading.style.outline = '2px solid rgb(203, 98, 69)';
		const view = new ui.Page({ header: new ui.PageHeader({ title: 'Repositories' }), children: [heading] }).mount(document.body);
		heading.focus();
		await page.until(() => warnings.some(message => /D187/.test(message)));
		assert.equal(warnings.filter(message => /D187/.test(message)).length, 1);
		assert.match(warnings.find(message => /D187/.test(message)), /the h2 "Results", focused for reading, draws an outline/);
		view.destroy();
		const later = document.body.appendChild(Object.assign(document.createElement('h2'), { textContent: 'Later', tabIndex: -1 }));
		later.style.outline = '2px solid rgb(203, 98, 69)';
		later.focus();
		await settle();
		assert.equal(warnings.filter(message => /D187/.test(message)).length, 1, 'a destroyed page stops following');
	} finally {
		ui.Focus.enabled = false;
		console.warn = original;
	}
});

test("a product's unlayered reset draws nothing of its own in Firefox: the ring restated above it, under every component's own rule; the palette's field says it draws none on :focus-visible", () => {
	const sheet = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
	const rules = [...sheet.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({ selector: selector.trim().replace(/\s+/g, ' '), body }));
	const raised = rules.filter(rule => rule.selector.includes(':-moz-focusring'));
	assert.equal(raised.length, 1, 'one rule, which Chromium and WebKit drop');
	// One type selector above Tailwind 3's `:-moz-focusring` (0,1,1), under a component's rule on a pseudo-class (0,2,0); a box that takes typing is left to its edge
	assert.equal(raised[0].selector, ":is(:not(input, textarea, select), input:where([type='checkbox'], [type='radio'], [type='range'], [type='color'], [type='file'], [type='button'], [type='submit'], [type='reset'], [type='image'])):-moz-focusring");
	assert.match(raised[0].body, /^\s*outline: 2px solid var\(--color-focus\);\s*$/, 'it restates the ring alone: the offset and the settling stay the ring rule\'s');
	assert.ok(rules.some(rule => rule.selector === '.bui-palette-field:focus-visible' && /outline: none/.test(rule.body)), "the palette's field draws no ring at 0,2,0");
	assert.ok(rules.some(rule => rule.selector === ':is(.bui-edge, .bui-navmenu-search, .bui-composer-box) :is(input, textarea, select):focus-visible' && /outline: none/.test(rule.body)), "the bar's search field draws none at 0,2,1");
});
