import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { refs } from './fixtures/refs.mjs';
import { inside } from './fixtures/family.mjs';

/** 0.7.4: the independent review of 0.7.0–0.7.3 (DOM). Each case fails without its fix. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const button = text => Object.assign(document.createElement('button'), { textContent: text });

test('Tab in a SideSheet passes over what is not rendered: a closed <details> and a collection’s hidden column (finding 2)', async () => {
	const first = button('First');
	const details = document.createElement('details');
	details.append(Object.assign(document.createElement('summary'), { textContent: 'Technical details' }), button('Copy details'));
	const cell = document.createElement('td');
	cell.setAttribute('data-bui-hidden', '');
	cell.append(button('Hidden column'));
	const last = button('Last');
	const footer = button('Add');
	const sheet = new ui.SideSheet({ title: 'Add repositories', children: [first, details, cell, last], actions: [footer] });
	void sheet.open();
	first.focus();
	page.key(first, 'Tab');
	assert.equal(document.activeElement, details.querySelector('summary'), 'the summary of the closed details');
	page.key(document.activeElement, 'Tab');
	assert.equal(document.activeElement, last, 'past the folded copy button and the hidden column');
	page.key(last, 'Tab');
	assert.equal(document.activeElement, footer, 'and on to the footer');
	sheet.dismiss();
});

test('Tab from an element inside a SideSheet that is not a target goes to the next target after it, not to Close (finding 9a)', async () => {
	const before = button('Before');
	const option = Object.assign(document.createElement('div'), { tabIndex: -1, textContent: 'An option of an open menu' });
	const after = button('After');
	const sheet = new ui.SideSheet({ title: 'Add repositories', children: [before, option, after] });
	void sheet.open();
	option.focus();
	page.key(option, 'Tab');
	assert.equal(document.activeElement, after);
	option.focus();
	page.key(option, 'Tab', { shiftKey: true });
	assert.equal(document.activeElement, before, 'Shift+Tab to the target before it');
	sheet.dismiss();
});

test('a recognized paste is chosen once: removed, a later page does not choose it again (finding 3)', async () => {
	const rows = [{ id: '101', label: 'acme/web', full: 'acme/web' }, { id: '102', label: 'acme/api', full: 'acme/api' }];
	const source = async ({ cursor }) => (cursor ? { items: [{ id: '103', label: 'acme/docs', full: 'acme/docs' }] } : { items: rows, next: 'page-2' });
	const found = [];
	const recognize = text => (text === 'acme/api' ? { label: 'acme/api', query: 'acme', match: item => item.full === 'acme/api' } : null);
	const picker = new ui.Picker({ label: 'Repositories', source, delay: 0, recognize, onrecognize: result => found.push(result?.outcome ?? null) }).mount(document.body);
	picker.control.value = 'acme/api';
	picker.control.dispatchEvent(new Event('paste'));
	await page.until(() => picker.value.includes('102'));
	picker.remove('102');
	const more = [...picker.element.querySelectorAll('.bui-picker-foot button')].find(node => node.textContent === 'Load more');
	more.click();
	await page.until(() => picker.element.querySelectorAll('[role="option"]').length === 3);
	assert.deepEqual(picker.value, [], 'the person’s removal stands');
	assert.deepEqual(found.filter(Boolean), ['picked'], 'recognized and reported once');
	picker.destroy();
});

test('"Select all shown" adds the suggested group too (finding 9f)', async () => {
	const source = async () => ({ items: [{ id: 'b', label: 'acme/api' }], suggested: { label: 'Recent', items: [{ id: 'a', label: 'acme/web' }] } });
	const picker = new ui.Picker({ label: 'Repositories', source, delay: 0, all: true }).mount(document.body);
	await page.until(() => picker.element.querySelectorAll('[role="option"]').length === 2);
	[...picker.element.querySelectorAll('.bui-picker-foot button')].find(node => node.textContent === 'Select all shown').click();
	assert.deepEqual([...picker.value].sort(), ['a', 'b']);
	picker.destroy();
});

test('RefChooser keeps a typed ref while the branches can’t be read: stated, submitted and focus on what exists (finding 4)', () => {
	const form = document.createElement('form');
	document.body.append(form);
	const chooser = new ui.RefChooser({ refs: refs().slice(0, 3), name: 'branch' }).mount(form);
	chooser.unavailable = { retry: () => {} };
	chooser.element.querySelector('.bui-refs-escape').click();
	const field = chooser.element.querySelector('.bui-refs-other input');
	field.value = 'v1.2.0';
	[...chooser.element.querySelectorAll('.bui-refs-other button')].find(node => node.textContent === 'Use').click();
	assert.equal(chooser.value, 'v1.2.0');
	assert.match(chooser.element.querySelector('.bui-refs-kept').textContent, /^v1\.2\.0/);
	assert.equal(new FormData(form).get('branch'), 'v1.2.0', 'submitted with the form');
	assert.ok(document.activeElement.isConnected && chooser.element.contains(document.activeElement), 'focus on an element in the page');
	chooser.refs = refs().slice(0, 3);
	assert.equal(chooser.control.textContent.includes('v1.2.0'), true, 'and chosen once the branches answer');
	chooser.destroy();
});

test('a ref Git refuses is refused: a leading “-”, a part starting with “.”, “.lock” in a part, control characters (finding 5)', () => {
	const check = value => {
		const chooser = new ui.RefChooser({ refs: refs().slice(0, 1) }).mount(document.body);
		chooser.other();
		chooser.element.querySelector('.bui-refs-other input').value = value;
		[...chooser.element.querySelectorAll('.bui-refs-other button')].find(node => node.textContent === 'Use').click();
		const taken = chooser.value === value;
		chooser.destroy();
		return taken;
	};
	for (const value of ['-x', 'a/.b', 'a.lock/b', 'a\u0001b', 'a\u007fb']) assert.equal(check(value), false, JSON.stringify(value));
	for (const value of ['v1.2.0', 'feature/x', 'release-1']) assert.equal(check(value), true, value);
});

test('ProjectPicker keeps the value it was built with (finding 6) and says “Choose” in the person’s language (finding 9c)', () => {
	const projects = inside.projects.map(project => ({ ...project, here: 'used' }));
	const chosen = projects[1].id;
	const picker = new ui.ProjectPicker({ projects, product: 'Delegate', value: chosen }).mount(document.body);
	assert.equal(picker.value, chosen);
	const empty = new ui.ProjectPicker({ projects, product: 'Delegate', labels: ui.ProjectPicker.labels?.es ?? { placeholder: 'Elegir' } }).mount(document.body);
	assert.match(empty.control.textContent, /Elegir/);
	assert.doesNotMatch(empty.control.textContent, /Choose/);
	const branch = new ui.RefChooser({ refs: refs().slice(0, 3), labels: ui.RefChooser.labels.es }).mount(document.body);
	assert.match(branch.control.textContent, /Elegir/, 'RefChooser in Spanish');
	picker.destroy();
	empty.destroy();
	branch.destroy();
});

test('a first suggestion that arrives late keeps what the person typed (finding 7)', () => {
	const field = new ui.Field({ label: 'Name', name: 'name' }).mount(document.body);
	field.control.value = 'my-own';
	field.control.dispatchEvent(new Event('input'));
	field.suggest = 'storefront';
	assert.equal(field.control.value, 'my-own');
	assert.equal(field.edited, true);
	field.destroy();
});

test('Draft.address keeps a relative path as written (finding 9b)', () => {
	const draft = new ui.Draft({ environment: 'web' });
	assert.match(draft.address('new'), /^new\?/);
	assert.match(draft.address('../edit'), /^\.\.\/edit\?/);
	assert.match(draft.address('/new'), /^\/new\?/);
});

test('ProviderWindow drops the window’s opener, so the pages it passes through cannot navigate this tab (finding 9e)', () => {
	const popup = { closed: false, opener: window, close() {}, location: { replace: address => (popup.address = address) } };
	const opened = [];
	const original = window.open;
	window.open = (...args) => (opened.push(args), popup);
	const provider = new ui.ProviderWindow({ provider: 'GitHub', href: 'https://github.test/apps/beyond/installations/new', read: async () => ({ state: 'waiting' }), same: false }).mount(document.body);
	provider.open();
	assert.equal(opened.length, 1);
	assert.equal(opened[0][0], '', 'opened blank on this origin (0.7.5)');
	assert.equal(popup.opener, null, 'its opener dropped before it leaves this origin');
	assert.equal(popup.address, 'https://github.test/apps/beyond/installations/new', 'then sent to the address');
	window.open = original;
	provider.destroy();
});

test('Awaited and AwaitedLine end a check that never settles within their bound (finding 9g)', async () => {
	const never = () => new Promise(() => {});
	const card = new ui.Awaited({ title: 'Preparing', since: new Date().toISOString(), expected: { median: 1, p90: 2 }, check: never, bound: 20 }).mount(document.body);
	await card.again();
	assert.equal(card.element.querySelector('.bui-awaited-note').textContent, 'The check did not finish. Try again.');
	const line = new ui.AwaitedLine({ title: 'Cloning', since: new Date().toISOString(), expected: { median: 1, p90: 2 }, check: never, bound: 20 }).mount(document.body);
	await line.again();
	assert.equal(line.element.querySelector('.bui-line-check').getAttribute('aria-disabled'), null, 'Check again can be pressed again');
	card.destroy();
	line.destroy();
});

test('a window that stays open is read every interval, one read at a time, and ends once the server says done (0.7.5)', async () => {
	const popup = { closed: false, opener: window, close() { this.closed = true; }, location: { replace() {} } };
	const original = window.open;
	window.open = () => popup;
	let reads = 0;
	let state = 'next';
	let release = null;
	const ended = [];
	const read = () => {
		reads += 1;
		// The first read never answers in this case: no second read starts while it waits
		if (reads === 1) return new Promise(resolve => (release = resolve));
		return Promise.resolve({ state });
	};
	const provider = new ui.ProviderWindow({ provider: 'GitHub', href: 'https://projects.test/connect', read, same: false, poll: 5, interval: 20, onend: outcome => ended.push(outcome) }).mount(document.body);
	provider.open();
	await page.until(() => reads === 1);
	await new Promise(resolve => setTimeout(resolve, 80));
	assert.equal(reads, 1, 'one read at a time');
	release({ state: 'next' });
	await page.until(() => reads >= 2);
	assert.equal(provider.state, 'open', 'a window on its first leg stays followed');
	state = 'done';
	await page.until(() => ended.length === 1);
	assert.deepEqual(ended, ['done']);
	assert.equal(popup.closed, true, 'the window is closed once the server says done');
	window.open = original;
	provider.destroy();
});

test('a landing on the page’s own origin wakes it on the BroadcastChannel, and a ProviderWindow with no interval waits for it (0.7.5)', async () => {
	const channels = [];
	const original = window.BroadcastChannel;
	window.BroadcastChannel = class {
		constructor(name) {
			this.name = name;
			channels.push(this);
		}
		close() {
			this.closed = true;
		}
	};
	const popup = { closed: false, close() { this.closed = true; }, location: { replace() {} } };
	const opener = window.open;
	window.open = () => popup;
	let reads = 0;
	const provider = new ui.ProviderWindow({ provider: 'GitHub', href: '/connect', read: async () => (reads++, { state: 'done' }), same: false, interval: 0 }).mount(document.body);
	assert.equal(channels[0]?.name, 'beyond-provider');
	provider.open();
	await new Promise(resolve => setTimeout(resolve, 30));
	assert.equal(reads, 0, 'nothing read while nothing woke it');
	channels[0].onmessage({ data: { type: 'beyond-provider' } });
	await page.until(() => provider.state === 'done');
	assert.equal(reads, 1);
	provider.destroy();
	assert.equal(channels[0].closed, true, 'the channel closes with it');
	window.BroadcastChannel = original;
	window.open = opener;
});
