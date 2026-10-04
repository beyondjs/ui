import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { Repositories, accounts, recognize } from './fixtures/repositories.mjs';

/** The resource picker of 0.7.0 (CNT-93): From [account], the gate, rows, the suggested group, the paste recognizer and "Can't find it?". */
const page = new Page();
const { Picker } = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const options = picker => [...picker.element.querySelectorAll('[role="option"]')];
const status = picker => picker.element.querySelector('.bui-picker-status').textContent;
const settle = picker => page.until(() => picker.element.querySelector('[role="listbox"]').getAttribute('aria-busy') === 'false' && status(picker) !== 'Loading…');
const escape = picker => picker.element.querySelector('.bui-picker-escape');
const footer = () => [Object.assign(document.createElement('button'), { textContent: 'Choose which repositories Beyond can see on GitHub' })];

function type(picker, text) {
	picker.control.value = text;
	picker.control.dispatchEvent(new Event('input'));
}

test('From [account]: the first usable account is in view, the source gets it, a suspended one explains and is never chosen', async () => {
	const repositories = new Repositories();
	let connected = 0;
	const picker = new Picker({ label: 'Repositories', source: repositories.source, delay: 0, accounts: { items: accounts, connect: { label: 'Install on another GitHub organization', run: () => connected++ } } }).mount(document.body);
	await settle(picker);
	assert.equal(picker.account, 'con_acme');
	assert.equal(repositories.requests.at(-1).account, 'con_acme');
	const from = picker.element.querySelector('.bui-picker-from .bui-choice-button');
	assert.match(from.textContent, /^From.*acme/);
	from.click();
	const items = [...picker.element.querySelectorAll('.bui-picker-from [role="menuitemradio"]')];
	assert.equal(items[2].getAttribute('aria-disabled'), 'true');
	assert.match(items[2].textContent, /Suspended on GitHub/);
	items[2].click();
	assert.equal(picker.account, 'con_acme', 'a suspended account is never chosen');
	picker.element.querySelector('.bui-picker-from [role="menuitem"]').click();
	assert.equal(connected, 1, '"Connect another" is the product\'s own action');
	options(picker)[1].click();
	from.click();
	picker.element.querySelectorAll('.bui-picker-from [role="menuitemradio"]')[1].click();
	await page.until(() => repositories.requests.at(-1).account === 'con_ada');
	await settle(picker);
	assert.deepEqual(options(picker).map(node => node.querySelector('.bui-option-label').textContent), ['ada-gh/notes']);
	assert.deepEqual(picker.selected.map(item => [item.id, item.account]), [['102', 'con_acme']], 'a choice keeps the account it came from');
	picker.destroy();
});

test('one usable account and no action is a statement; replacing the accounts keeps the one in view while it can be used', async () => {
	const repositories = new Repositories();
	const picker = new Picker({ label: 'Repositories', source: repositories.source, delay: 0, accounts: { items: [accounts[0]] } }).mount(document.body);
	await settle(picker);
	assert.ok(!picker.element.querySelector('.bui-picker-from .bui-choice-button'), 'no menu for one account');
	assert.match(picker.element.querySelector('.bui-picker-from .bui-statement').textContent, /From acme/);
	const asked = repositories.requests.length;
	picker.accounts = { items: accounts };
	assert.equal(picker.account, 'con_acme');
	assert.equal(repositories.requests.length, asked, 'the same account in view searches nothing again');
	picker.accounts = { items: accounts, value: 'con_ada' };
	await page.until(() => repositories.requests.at(-1).account === 'con_ada');
	picker.destroy();
});

test('rows show their picture, "Private" in words, the branch, the update time, marks with reasons and nothing to press but the row', async () => {
	const picker = new Picker({ label: 'Repositories', source: new Repositories().source, delay: 0, accounts: { items: accounts } }).mount(document.body);
	await settle(picker);
	const rows = options(picker);
	assert.match(rows[0].textContent, /acme\/web.*Private.*main.*Updated 2 h ago/);
	assert.ok(rows[0].querySelector('.bui-option-private [data-icon="lock"]'), 'the lock stands beside the word, never alone (D11)');
	const docs = rows.find(row => /acme\/docs/.test(row.textContent));
	assert.match(docs.textContent, /Public.*Updated 3 d ago.*Also in Website/);
	assert.equal(docs.querySelector('.bui-badge').textContent, 'In Website');
	const site = rows.find(row => /acme\/site/.test(row.textContent));
	assert.equal(site.getAttribute('aria-disabled'), 'true');
	assert.match(site.textContent, /Already in Storefront/);
	site.click();
	assert.deepEqual(picker.value, [], 'a conflict mark that blocks never chooses');
	for (const row of rows) assert.ok(!row.querySelector('a, button, input, select, textarea'), 'a row\'s one action is choosing it');
	picker.destroy();
});

test('the suggested group comes first, named, and its items are not listed twice', async () => {
	const picker = new Picker({ label: 'Repositories', source: new Repositories().source, delay: 0, accounts: { items: accounts } }).mount(document.body);
	await settle(picker);
	const group = picker.element.querySelector('[role="listbox"] > [role="group"]');
	assert.ok(group);
	assert.equal(document.getElementById(group.getAttribute('aria-labelledby')).textContent, 'Recent');
	assert.deepEqual([...group.querySelectorAll('[role="option"] .bui-option-label')].map(node => node.textContent), ['acme/web']);
	assert.equal(options(picker).filter(node => /acme\/web/.test(node.textContent)).length, 1);
	assert.equal(status(picker), '5 of 5 shown');
	page.key(picker.control, 'ArrowDown');
	page.key(picker.control, 'Enter');
	assert.deepEqual(picker.value, ['101'], 'the keyboard reaches the group first');
	picker.destroy();
});

test('"Can\'t find it?" shows in the results, no match, an empty source, a failure and the gate', async () => {
	const repositories = new Repositories();
	const picker = new Picker({ label: 'Repositories', source: repositories.source, delay: 0, accounts: { items: accounts }, footer: footer() }).mount(document.body);
	await settle(picker);
	const shown = () => !escape(picker).hidden && escape(picker).textContent.startsWith('Can’t find it?');
	assert.ok(shown(), 'with results');
	type(picker, 'zzz');
	await page.until(() => /No matches/.test(status(picker)));
	assert.ok(shown(), 'with no match');
	repositories.fail = true;
	type(picker, 'acme');
	await page.until(() => status(picker) === 'The choices could not be loaded.');
	assert.ok(shown(), 'with a failure');
	picker.gate = { title: 'GitHub isn’t connected to Northwind', reason: 'Owners and admins set it up.' };
	assert.ok(shown(), 'with the gate');
	const empty = new Picker({ label: 'Repositories', source: async () => ({ items: [] }), delay: 0, footer: footer() }).mount(document.body);
	await settle(empty);
	assert.equal(status(empty), 'There is nothing to choose from yet.');
	assert.equal(escape(empty).hidden, false);
	const plain = new Picker({ label: 'People', source: async () => ({ items: [] }), delay: 0 }).mount(document.body);
	assert.equal(escape(plain).hidden, true, 'nothing to show without the product\'s actions');
	picker.footer = null;
	assert.equal(escape(picker).hidden, true);
	for (const item of [picker, empty, plain]) item.destroy();
});

test('the gate replaces the list with one action and asks the source nothing until it is lifted', async () => {
	const repositories = new Repositories();
	let connects = 0;
	const action = Object.assign(document.createElement('button'), { textContent: 'Connect GitHub', onclick: () => connects++ });
	const picker = new Picker({ label: 'Repositories', source: repositories.source, delay: 0, footer: footer(), gate: { title: 'Connect your GitHub account to see the repositories you can choose', reason: 'Signing in with GitHub doesn’t give Beyond access to repositories.', action } }).mount(document.body);
	assert.equal(repositories.requests.length, 0);
	const gate = picker.element.querySelector('.bui-picker-gate');
	assert.equal(gate.hidden, false);
	assert.equal(picker.element.querySelector('.bui-picker-work').hidden, true);
	assert.equal(gate.querySelector('.bui-unavailable').dataset.unavailable, 'association');
	assert.equal(gate.querySelector('h3').textContent, 'Connect your GitHub account to see the repositories you can choose');
	gate.querySelector('button').click();
	assert.equal(connects, 1);
	picker.refresh();
	assert.equal(repositories.requests.length, 0, 'refresh waits for the gate');
	picker.gate = null;
	await settle(picker);
	assert.equal(repositories.requests.length, 1);
	assert.equal(gate.hidden, true);
	picker.destroy();
});

test('a source that does not answer within the bound is unavailable, never "nothing to choose"; Try again recovers', async () => {
	const repositories = new Repositories();
	repositories.stall = true;
	const picker = new Picker({ label: 'Repositories', source: repositories.source, delay: 0, bound: 30, accounts: { items: accounts } }).mount(document.body);
	await page.until(() => /didn’t answer in time/.test(status(picker)));
	assert.equal(status(picker), 'The choices didn’t answer in time, so they can’t be listed now.');
	const retry = picker.element.querySelector('.bui-picker-foot .bui-button-secondary');
	assert.equal(retry.hidden, false);
	repositories.stall = false;
	retry.click();
	await settle(picker);
	assert.equal(options(picker).length, 5);
	picker.destroy();
	const explained = new Picker({ label: 'Repositories', source: async () => Promise.reject(new Error('down')), delay: 0, explain: () => 'Beyond Projects didn’t answer, so repositories can’t be listed now.' }).mount(document.body);
	await page.until(() => /Beyond Projects/.test(status(explained)));
	explained.destroy();
});

test('a pasted address is recognized: chosen when listed, refused with its reason, or reported as missing for the product to act', async () => {
	const found = [];
	const picker = new Picker({ label: 'Repositories', source: new Repositories().source, delay: 1000, accounts: { items: accounts }, recognize, onrecognize: result => found.push(result && [result.label, result.outcome, result.value?.name]) }).mount(document.body);
	await settle(picker);
	picker.control.value = 'https://github.com/acme/api.git';
	picker.control.dispatchEvent(new Event('paste'));
	await page.until(() => picker.value.includes('102'));
	assert.equal(status(picker), 'acme/api selected');
	assert.deepEqual(picker.recognized.value, { owner: 'acme', name: 'api' });
	assert.equal(document.getElementById(picker.control.getAttribute('aria-activedescendant')).textContent.includes('acme/api'), true);
	picker.control.value = 'git@github.com:acme/site.git';
	picker.control.dispatchEvent(new Event('paste'));
	await page.until(() => /can’t be chosen/.test(status(picker)));
	assert.equal(status(picker), 'acme/site can’t be chosen: Already in Storefront');
	picker.control.value = 'acme/elsewhere';
	picker.control.dispatchEvent(new Event('paste'));
	await page.until(() => /isn’t in this list/.test(status(picker)));
	assert.equal(status(picker), 'acme/elsewhere isn’t in this list.', 'the parsed value, never the raw text');
	assert.deepEqual(found.filter(Boolean).slice(-3), [['acme/api', 'picked', 'api'], ['acme/site', 'refused', 'site'], ['acme/elsewhere', 'missing', 'elsewhere']]);
	assert.deepEqual(picker.value, ['102']);
	picker.control.value = '';
	picker.control.dispatchEvent(new Event('paste'));
	await page.until(() => found.at(-1) === null);
	picker.destroy();
});

test('a recognizer that throws is ignored and the text is searched as typed', async () => {
	const repositories = new Repositories();
	const picker = new Picker({ label: 'Repositories', source: repositories.source, delay: 0, accounts: { items: accounts }, recognize: () => { throw new Error('bad'); } }).mount(document.body);
	await settle(picker);
	type(picker, 'web');
	await page.until(() => repositories.requests.at(-1).query === 'web');
	await settle(picker);
	assert.equal(picker.recognized, null);
	picker.destroy();
});

test('Spanish copy ships with the picker', async () => {
	const picker = new Picker({ label: 'Repositorios', source: new Repositories().source, delay: 0, accounts: { items: accounts }, footer: footer(), labels: Picker.labels.es }).mount(document.body);
	await settle(picker);
	assert.match(picker.element.querySelector('.bui-picker-from').textContent, /^Desde/);
	assert.equal(picker.element.querySelector('.bui-picker-escape-title').textContent, '¿No lo encuentras?');
	assert.match(options(picker)[0].textContent, /Privado.*Actualizado hace 2 h/);
	assert.equal(status(picker), '5 de 5 mostrados');
	picker.destroy();
});
