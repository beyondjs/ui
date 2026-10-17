import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/** `CommandPalette` (0.16.0, DQ-21): a modal field, grouped results from the product's sources asked as one types (bounded, aborted), recent items on this device, keyboard first, ⌘K / Ctrl+K. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const memory = () => {
	const kept = new Map();
	return { getItem: key => kept.get(key) ?? null, setItem: (key, value) => kept.set(key, value) };
};
const machines = { key: 'machines', label: 'Machines', search: query => ['web', 'lab', 'api'].filter(name => name.includes(query)).map(name => ({ id: `m-${name}`, label: name, detail: 'Machine', href: `/machines/${name}`, glyph: 'box' })) };
const actions = { key: 'actions', label: 'Actions', empty: true, search: query => [{ id: 'new', label: 'New conversation', keys: 'N', run: () => (actions.ran = (actions.ran ?? 0) + 1) }].filter(item => item.label.toLowerCase().includes(query.toLowerCase())) };
const groups = palette => [...palette.element.querySelectorAll('.bui-palette-group')].map(group => [group.querySelector('.bui-palette-heading').textContent, [...group.querySelectorAll('[role="option"]')].map(option => option.querySelector('.bui-palette-label').textContent)]);
const type = async (palette, text) => {
	const field = palette.element.querySelector('input');
	field.value = text;
	field.dispatchEvent(new page.window.Event('input'));
	await wait(20);
};

test('opened, the field is a combobox over grouped results; empty sources and recent items show before typing', async () => {
	const storage = memory();
	storage.setItem('bui-palette:conduict', JSON.stringify([{ id: 'm-lab', label: 'lab', href: '/machines/lab' }]));
	const palette = new ui.CommandPalette({ sources: [machines, actions], recent: { key: 'conduict', storage }, delay: 0 });
	palette.open();
	await wait(10);
	const field = palette.element.querySelector('input');
	assert.equal(document.activeElement, field);
	assert.equal(field.getAttribute('role'), 'combobox');
	assert.equal(field.getAttribute('aria-controls'), palette.element.querySelector('[role="listbox"]').id);
	assert.deepEqual(groups(palette), [['Recent', ['lab']], ['Actions', ['New conversation']]], 'machines only when typed');
	assert.equal(field.getAttribute('aria-activedescendant'), palette.element.querySelector('[role="option"]').id);
	await type(palette, 'a');
	assert.deepEqual(groups(palette), [['Machines', ['lab', 'api']], ['Actions', ['New conversation']]]);
	assert.equal(palette.element.querySelector('.bui-palette-status').textContent, '3 results');
	palette.destroy();
});

test('the keys: arrows move across groups and wrap, Enter opens, Escape clears then closes and focus returns', async () => {
	const opener = document.createElement('button');
	document.body.append(opener);
	opener.focus();
	const navigated = [];
	actions.ran = 0;
	const palette = new ui.CommandPalette({ sources: [machines, actions], delay: 0, onnavigate: item => navigated.push(item.href) });
	palette.open('a');
	await wait(10);
	const field = palette.element.querySelector('input');
	const active = () => document.getElementById(field.getAttribute('aria-activedescendant'))?.querySelector('.bui-palette-label').textContent;
	assert.equal(active(), 'lab');
	page.key(field, 'ArrowDown');
	page.key(field, 'ArrowDown');
	assert.equal(active(), 'New conversation', 'across the groups');
	page.key(field, 'ArrowDown');
	assert.equal(active(), 'lab', 'wrapping');
	page.key(field, 'ArrowUp');
	page.key(field, 'Enter');
	assert.equal(actions.ran, 1, 'an action runs');
	assert.equal(palette.opened, false);
	assert.equal(document.activeElement, opener, 'focus back where it was');
	palette.open('w');
	await wait(10);
	page.key(palette.element.querySelector('input'), 'Enter');
	assert.deepEqual(navigated, ['/machines/web'], 'an address goes through onnavigate');
	palette.open('w');
	await wait(10);
	page.key(palette.element.querySelector('input'), 'Escape');
	assert.equal(palette.element.querySelector('input').value, '', 'Escape clears first');
	assert.equal(palette.opened, true);
	page.key(palette.element.querySelector('input'), 'Escape');
	assert.equal(palette.opened, false, 'then closes');
	palette.destroy();
});

test('a slow source is bounded and said unavailable; a failing one too; the others answer; nothing matches is said', async () => {
	const signals = [];
	const silent = { key: 'repositories', label: 'Repositories', search: (query, { signal }) => (signals.push(signal), new Promise(() => {})) };
	const broken = { key: 'conversations', label: 'Conversations', search: () => Promise.reject(new Error('down')) };
	const palette = new ui.CommandPalette({ sources: [silent, broken, machines], delay: 0, bound: 30, labels: ui.CommandPalette.labels.es });
	palette.open('web');
	await wait(5);
	assert.match(palette.element.textContent, /Buscando…/);
	await wait(60);
	assert.deepEqual([...palette.element.querySelectorAll('.bui-palette-state')].map(node => node.textContent), ['No disponible ahora', 'No disponible ahora']);
	assert.deepEqual(groups(palette).at(-1), ['Machines', ['web']], 'never held back by the others');
	assert.equal(signals[0].aborted, true, 'the slow ask was aborted at its bound');
	await type(palette, 'zzz');
	await wait(60);
	assert.match(palette.element.querySelector('.bui-palette-status').textContent, /Nada coincide con «zzz»/);
	palette.destroy();
	for (const key of Object.keys(ui.CommandPalette.labels.en)) assert.ok(key in ui.CommandPalette.labels.es, key);
});

test('an opened item with an address is kept as recent on this device, newest first; a refused storage keeps nothing', async () => {
	const storage = memory();
	const palette = new ui.CommandPalette({ sources: [machines], recent: { key: 'conduict', storage, limit: 2 }, delay: 0, onnavigate: () => {} });
	for (const name of ['web', 'lab', 'api']) {
		palette.open(name);
		await wait(10);
		page.key(palette.element.querySelector('input'), 'Enter');
	}
	assert.deepEqual(JSON.parse(storage.getItem('bui-palette:conduict')).map(item => item.label), ['api', 'lab']);
	palette.destroy();
	const refused = new ui.CommandPalette({ sources: [machines], recent: { key: 'x', storage: { getItem: () => { throw new Error('no'); }, setItem: () => { throw new Error('no'); } } }, delay: 0, onnavigate: () => {} });
	refused.open('web');
	await wait(10);
	page.key(refused.element.querySelector('input'), 'Enter');
	refused.open();
	await wait(10);
	assert.deepEqual(groups(refused), [], 'nothing kept, nothing broken');
	refused.destroy();
});

test('⌘K / Ctrl+K opens and closes it when the product asks; sources can change while it is open', async () => {
	const palette = new ui.CommandPalette({ sources: [], shortcut: true, delay: 0 });
	document.dispatchEvent(new page.window.KeyboardEvent('keydown', { key: 'k', ctrlKey: true, metaKey: true, bubbles: true, cancelable: true }));
	const apple = /mac|iphone|ipad/i.test(page.window.navigator.platform ?? '');
	document.dispatchEvent(new page.window.KeyboardEvent('keydown', { key: 'k', ctrlKey: !apple, metaKey: apple, bubbles: true, cancelable: true }));
	assert.equal(palette.opened, true);
	palette.sources = [actions];
	await wait(10);
	assert.deepEqual(groups(palette), [['Actions', ['New conversation']]]);
	document.dispatchEvent(new page.window.KeyboardEvent('keydown', { key: 'k', ctrlKey: !apple, metaKey: apple, bubbles: true, cancelable: true }));
	assert.equal(palette.opened, false);
	palette.destroy();
});
