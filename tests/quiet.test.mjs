import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page as Window } from './support/page.mjs';

/**
 * 0.14.0's quiet parts and exits: `ActionLine` (D102) in the DOM and in React, `Facts`' value column and
 * numbers (D99), and the exits of menus and side sheets (D95): hidden at once, an inert picture easing out,
 * none under reduced motion, never a copy beside a reopened one. Their motion is measured in the browser.
 */
const page = new Window();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
const dom = await import('@beyond-js/ui/dom');
const ui = await import('@beyond-js/ui/react');
const h = React.createElement;
const { act } = React;
let root = null;
let host = null;

after(() => page.close());
beforeEach(async () => {
	if (root) await act(() => root.unmount());
	page.reset();
	host = document.body.appendChild(document.createElement('div'));
	root = createRoot(host);
});

test('an action line: the actions in one quiet group, then the facts joined by a separator assistive technology skips', () => {
	const copy = new dom.Button({ label: 'Copy', variant: 'quiet' });
	const line = new dom.ActionLine({ actions: [copy, null], facts: ['42 s', '12k tokens', null, '$0.08'], label: 'Answer actions' }).mount(document.body);
	const element = line.element;
	assert.equal(element.getAttribute('role'), 'group');
	assert.equal(element.getAttribute('aria-label'), 'Answer actions');
	assert.equal(element.querySelector('.bui-action-line-actions').firstElementChild, copy.element);
	const facts = element.querySelector('.bui-action-line-facts');
	assert.equal(facts.textContent, '42 s · 12k tokens · $0.08');
	assert.equal(facts.querySelectorAll('.bui-action-line-fact').length, 3);
	assert.ok([...facts.querySelectorAll('.bui-action-line-dot')].every(node => node.getAttribute('aria-hidden') === 'true'));
	copy.element.focus();
	line.actions = [copy];
	assert.equal(document.activeElement, copy.element, 'an action that stays keeps focus');
	line.facts = [];
	assert.equal(facts.hidden, true);
	line.actions = [];
	assert.equal(element.querySelector('.bui-action-line-actions').hidden, true);
	assert.equal(new dom.ActionLine().element.hasAttribute('role'), false, 'no name, no group role');
	line.destroy();
});

test('React ActionLine renders the DOM markup: children as actions, facts as a muted group', async () => {
	await act(() => root.render(h(ui.ActionLine, { facts: ['42 s', '$0.08'], label: 'Answer actions' }, h('button', { type: 'button', className: 'bui-button bui-button-quiet' }, 'Copy'))));
	const line = host.querySelector('.bui-action-line');
	assert.equal(line.getAttribute('aria-label'), 'Answer actions');
	assert.equal(line.querySelector('.bui-action-line-actions button').textContent, 'Copy');
	assert.equal(line.querySelector('.bui-action-line-facts').textContent, '42 s · $0.08');
	const made = new dom.ActionLine({ facts: ['42 s', '$0.08'], label: 'Answer actions' }).element;
	assert.equal(line.querySelector('.bui-action-line-facts').innerHTML, made.querySelector('.bui-action-line-facts').innerHTML);
});

test('Facts: a number is marked to align to the end; a string, a long value or numeric: false is not; React marks the same', async () => {
	const rows = [{ key: 'files', label: 'Files', value: 3 }, { key: 'cost', label: 'Cost', value: '$0.08', numeric: true }, { key: 'model', label: 'Model', value: 'Opus' }, { key: 'n', label: 'Count', value: 7, numeric: false }];
	const facts = new dom.Facts({ rows });
	const marked = [...facts.element.querySelectorAll('.bui-facts-row')].map(row => row.hasAttribute('data-numeric'));
	assert.deepEqual(marked, [true, true, false, false]);
	assert.equal(facts.element.querySelector('.bui-facts-value').textContent, '3');
	assert.equal(dom.Facts.numeric({ value: 3 }), true);
	assert.equal(dom.Facts.numeric({ value: 'x'.repeat(50), numeric: true, long: true }), false, 'a value under its label is read from its start');
	await act(() => root.render(h(ui.Facts, { rows })));
	assert.deepEqual([...host.querySelectorAll('.bui-facts-row')].map(row => row.hasAttribute('data-numeric')), marked);
	assert.equal(host.querySelector('.bui-facts-value').textContent, '3');
});

test('a closed menu is hidden at once and its picture eases out, inert and nameless; reopening removes the picture', () => {
	const style = document.head.appendChild(Object.assign(document.createElement('style'), { textContent: '.bui-menu { position: absolute; }' }));
	try {
		const menu = new dom.ActionMenu({ label: 'More', items: [{ label: 'Rename', run: () => {} }] }).mount(document.body);
		const list = menu.element.querySelector('ul.bui-menu');
		menu.open();
		menu.close(true);
		assert.equal(list.hidden, true, 'nothing in it is reachable once close returns');
		const picture = menu.element.querySelector('.bui-leaving');
		if (page.window.getComputedStyle(list).position === 'absolute') {
			assert.ok(picture, 'a picture eases out');
			assert.equal(picture.getAttribute('aria-hidden'), 'true');
			assert.equal(picture.inert, true);
			assert.equal(picture.querySelector('[id]'), null);
			assert.equal(picture.hasAttribute('role'), false);
			menu.open();
			assert.equal(menu.element.querySelector('.bui-leaving'), null, 'no copy beside a reopened menu');
			menu.close();
			picture.remove();
		}
		menu.destroy();
		const choice = new dom.ChoiceMenu({ label: 'Model', options: [{ value: 'a', label: 'Opus' }, { value: 'b', label: 'Sonnet' }], value: 'a' }).mount(document.body);
		choice.open();
		choice.close();
		assert.equal(choice.element.querySelector('.bui-choice-list:not(.bui-leaving)').hidden, true);
		choice.destroy();
		assert.equal(document.querySelector('.bui-leaving'), null, 'destroy removes a picture');
	} finally {
		style.remove();
	}
});

test('a side sheet closes at once and slides out as a picture over a fading veil; none under reduced motion', async () => {
	const sheet = new dom.SideSheet({ title: 'Add repositories', children: [Object.assign(document.createElement('p'), { textContent: 'Body' })] });
	const done = sheet.open();
	sheet.close('chosen');
	assert.equal(await done, 'chosen');
	assert.equal(sheet.shown, false);
	const picture = document.body.querySelector('div.bui-sheet.bui-leaving');
	assert.ok(picture, 'the picture of the sheet');
	assert.equal(picture.getAttribute('aria-hidden'), 'true');
	assert.equal(picture.textContent.includes('Body'), true);
	assert.ok(picture.previousElementSibling.classList.contains('bui-sheet-veil'));
	sheet.open();
	assert.equal(document.body.querySelector('.bui-leaving'), null, 'reopening removes it');
	const media = page.window.matchMedia;
	page.window.matchMedia = query => ({ matches: query.includes('reduce'), addEventListener() {}, removeEventListener() {} });
	try {
		sheet.close();
		assert.equal(document.body.querySelector('.bui-leaving'), null, 'no picture under reduced motion');
	} finally {
		page.window.matchMedia = media;
	}
	sheet.destroy();
});

test('a host that removes animations by its own preference gets no still picture: the menu and the sheet leave none (0.14.1)', () => {
	const computed = page.window.getComputedStyle;
	// What a host's stylesheet computes for a picture; happy-dom reports no animation, so it is given here
	let motion = { animationName: 'none', animationDuration: '0s' };
	page.window.getComputedStyle = node => (node.classList?.contains('bui-leaving') ? { position: 'absolute', ...motion } : { ...computed(node), position: 'absolute' });
	try {
		const menu = new dom.ActionMenu({ label: 'More', items: [{ label: 'Rename', run: () => {} }] }).mount(document.body);
		const sheet = new dom.SideSheet({ title: 'Add repositories', children: [Object.assign(document.createElement('p'), { textContent: 'Body' })] });
		const close = () => {
			menu.open();
			menu.close(true);
			sheet.open();
			sheet.close();
			return [document.querySelectorAll('.bui-leaving').length, document.querySelectorAll('.bui-sheet-veil').length];
		};
		assert.deepEqual(close(), [0, 0], 'an animation named none: removed at once, veil and all');
		motion = { animationName: 'bui-leave', animationDuration: '0s' };
		assert.deepEqual(close(), [0, 0], 'an animation that lasts no time: removed at once');
		motion = { animationName: 'bui-leave, none', animationDuration: '0ms, 0s' };
		assert.deepEqual(close(), [0, 0], 'every listed duration zero');
		// A recovery: once the host allows motion again, the pictures ease out as before
		motion = { animationName: 'bui-leave', animationDuration: '120ms' };
		assert.deepEqual(close(), [2, 1], 'a moving picture stays until its animation ends');
		for (const picture of document.querySelectorAll('.bui-leaving')) picture.dispatchEvent(new page.window.Event('animationend'));
		assert.equal(document.querySelectorAll('.bui-leaving, .bui-sheet-veil').length, 0, 'and removes itself, veil and all');
		// An engine that reports nothing is not taken as still: the bound ends that picture
		motion = { animationName: '', animationDuration: '' };
		assert.deepEqual(close(), [2, 1], 'an unreported animation keeps the picture to its bound');
		menu.destroy();
		sheet.destroy();
		assert.equal(document.querySelectorAll('.bui-leaving, .bui-sheet-veil').length, 0);
	} finally {
		page.window.getComputedStyle = computed;
	}
});

test('an action line quiets every kind of action it holds, a disclosure (an answer\'s Details) included (0.14.2)', async () => {
	const { readFileSync } = await import('node:fs');
	const sheet = readFileSync(new URL('../src/styles/quiet.css', import.meta.url), 'utf8');
	const rules = sheet.match(/\.bui-action-line-actions :is\([^)]*\)/g) ?? [];
	assert.ok(rules.length >= 2, 'the quiet rule and its hover rule');
	for (const rule of rules) assert.match(rule, /\.bui-disclosure-button/, `${rule} leaves a disclosure bordered`);
});
