import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { People } from './fixtures/people.mjs';

const page = new Page();
const { Picker } = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const options = element => [...element.querySelectorAll('[role="option"]')];
const status = picker => picker.element.querySelector('.bui-picker-status').textContent;
const settle = picker => page.until(() => picker.element.querySelector('[role="listbox"]').getAttribute('aria-busy') === 'false');

function type(picker, text) {
	picker.control.value = text;
	picker.control.dispatchEvent(new Event('input'));
}

test('lists the first page, pages with Load more, and keeps choices across pages and queries', async () => {
	const people = new People();
	const changes = [];
	const picker = new Picker({ label: 'People', source: people.source, limit: 20, delay: 0, name: 'people', onchange: items => changes.push(items.length) }).mount(document.body);
	await settle(picker);
	assert.equal(options(picker.element).length, 20);
	assert.equal(status(picker), '20 of 45 shown');
	options(picker.element)[0].click();
	picker.element.querySelector('.bui-picker-foot .bui-button-quiet').click();
	await settle(picker);
	assert.equal(options(picker.element).length, 40);
	options(picker.element)[25].click();
	type(picker, 'Person 4');
	await page.until(() => people.requests.at(-1).query === 'Person 4');
	await settle(picker);
	assert.ok(options(picker.element).length < 20);
	assert.deepEqual(picker.value, ['p1', 'p26']);
	assert.equal(picker.element.querySelector('.bui-picker-count').textContent, '2 selected');
	assert.deepEqual([...picker.element.querySelectorAll('input[type="hidden"]')].map(input => input.value), ['p1', 'p26']);
	type(picker, '');
	await page.until(() => people.requests.at(-1).query === '');
	await settle(picker);
	assert.equal(options(picker.element)[0].getAttribute('aria-selected'), 'true', 'a choice shows again when its page returns');
	assert.deepEqual(changes, [1, 2]);
});

test('keyboard: arrows set the active option, Enter chooses, disabled options explain and refuse', async () => {
	const picker = new Picker({ label: 'People', source: new People().source, delay: 0 }).mount(document.body);
	await settle(picker);
	page.key(picker.control, 'ArrowDown');
	page.key(picker.control, 'ArrowDown');
	page.key(picker.control, 'ArrowDown');
	const active = document.getElementById(picker.control.getAttribute('aria-activedescendant'));
	assert.equal(active.getAttribute('aria-disabled'), 'true');
	assert.match(active.textContent, /Already in another batch/);
	page.key(picker.control, 'Enter');
	assert.deepEqual(picker.value, []);
	page.key(picker.control, 'ArrowUp');
	assert.equal(page.key(picker.control, 'Enter').defaultPrevented, true, 'Enter never submits the form around it');
	assert.deepEqual(picker.value, ['p2']);
});

test('a single picker replaces its one choice', async () => {
	const picker = new Picker({ label: 'Owner', multiple: false, source: new People().source, delay: 0 }).mount(document.body);
	await settle(picker);
	assert.equal(picker.element.querySelector('[role="listbox"]').hasAttribute('aria-multiselectable'), false);
	options(picker.element)[0].click();
	options(picker.element)[1].click();
	assert.deepEqual(picker.value, ['p2']);
});

test('no matches, empty source, failure with retry', async () => {
	const people = new People();
	const picker = new Picker({ label: 'People', source: people.source, delay: 0, labels: { empty: 'Sin resultados para “{query}”.' } }).mount(document.body);
	await settle(picker);
	type(picker, 'zzz');
	await page.until(() => /Sin resultados para “zzz”/.test(status(picker)));
	people.fail = true;
	type(picker, 'Person');
	await page.until(() => status(picker) === 'The choices could not be loaded.');
	const retry = picker.element.querySelector('.bui-picker-foot .bui-button-secondary');
	assert.equal(retry.hidden, false);
	people.fail = false;
	retry.click();
	await settle(picker);
	assert.equal(retry.hidden, true);
	assert.ok(options(picker.element).length > 0);
	const empty = new Picker({ label: 'Nothing', source: async () => ({ items: [] }), delay: 0 }).mount(document.body);
	await settle(empty);
	assert.equal(status(empty), 'There is nothing to choose from yet.');
});

test('a late answer of an older query never replaces a newer one', async () => {
	let calls = 0;
	const source = async ({ query }) => {
		calls++;
		await new Promise(resolve => setTimeout(resolve, query === 'slow' ? 60 : 5));
		return { items: [{ id: query, label: `Result for ${query}` }] };
	};
	const picker = new Picker({ label: 'Search', source, delay: 0 }).mount(document.body);
	await settle(picker);
	type(picker, 'slow');
	await page.until(() => calls === 2);
	type(picker, 'fast');
	await page.until(() => calls === 3);
	await new Promise(resolve => setTimeout(resolve, 90));
	assert.deepEqual(options(picker.element).map(node => node.textContent), ['Result for fast']);
});

test('stale and ineligible choices stay listed with their reason until removed; removal keeps focus', async () => {
	const picker = new Picker({
		label: 'Requests',
		source: new People().source,
		delay: 0,
		selected: [{ id: 'r1', label: 'Export invoices' }, { id: 'r2', label: 'Dark mode', state: 'stale', reason: 'Moved to another area' }]
	}).mount(document.body);
	await settle(picker);
	assert.equal(picker.element.querySelector('.bui-picker-count').textContent, '2 selected · 1 needs attention');
	assert.match(picker.element.querySelector('.bui-chips').textContent, /No longer available.*Moved to another area/);
	picker.mark('r1', { state: 'ineligible', reason: 'Already released' });
	assert.equal(picker.selected.find(item => item.id === 'r1').state, 'ineligible');
	const remove = picker.element.querySelector('.bui-chip-remove');
	assert.equal(remove.getAttribute('aria-label'), 'Remove Export invoices');
	remove.focus();
	remove.click();
	assert.deepEqual(picker.value, ['r2']);
	assert.equal(document.activeElement.getAttribute('aria-label'), 'Remove Dark mode');
	document.activeElement.click();
	assert.equal(document.activeElement, picker.control);
});

test('filters narrow the source and keep the choice; destroy cancels pending work', async () => {
	const people = new People();
	const picker = new Picker({ label: 'People', source: people.source, delay: 0, filters: [{ name: 'team', label: 'Team', options: [{ value: '', label: 'All teams' }, { value: 'support', label: 'Support' }] }] }).mount(document.body);
	await settle(picker);
	options(picker.element)[0].click();
	const select = picker.element.querySelector('select');
	assert.equal(select.getAttribute('aria-label'), 'Team');
	select.value = 'support';
	select.dispatchEvent(new Event('change'));
	await page.until(() => people.requests.at(-1).filters.team === 'support');
	await settle(picker);
	assert.ok(options(picker.element).every(node => /Support/.test(node.textContent)));
	assert.deepEqual(picker.value, ['p1']);
	people.delay = 30;
	picker.refresh();
	picker.destroy();
	await new Promise(resolve => setTimeout(resolve, 50));
	assert.equal(picker.element.isConnected, false);
});
