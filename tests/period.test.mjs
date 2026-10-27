import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { usage, clock, UsageSource } from './fixtures/periods.mjs';

/** 0.44.0 (D162 L8): the shared tools' period filter, a chooser of periods kept in the filter state. */
const page = new Page();
const { Collection, Period } = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const filter = { name: 'period', label: 'Period', kind: 'period', now: clock };
const iso = range => range && [range.start.toISOString(), range.end.toISOString()];
const options = select => [...select.options].map(option => [option.value, option.textContent, option.disabled]);

test('a period value is one of three forms, its range in UTC days, and anything else is no period', () => {
	assert.equal(Collection.Tools.Period, Period, 'the tools carry the same class');
	const now = Date.UTC(2026, 9, 27, 15, 30);
	assert.deepEqual(iso(Period.range('P30D', { now })), ['2026-09-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'], 'the last 30 days include today');
	assert.deepEqual(iso(Period.range('P1D', { now })), ['2026-10-27T00:00:00.000Z', '2026-10-28T00:00:00.000Z']);
	assert.deepEqual(iso(Period.range('2026-02')), ['2026-02-01T00:00:00.000Z', '2026-03-01T00:00:00.000Z']);
	assert.deepEqual(iso(Period.range('2025-12')), ['2025-12-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z']);
	assert.deepEqual(iso(Period.range('2026-09-01/2026-09-15')), ['2026-09-01T00:00:00.000Z', '2026-09-16T00:00:00.000Z'], 'a span includes its last day');
	for (const value of ['', null, undefined, 'P0D', 'P1000D', 'P7W', '2026-13', '2026-9', '2026-02-30/2026-03-01', '2026-09-15/2026-09-01', 'last month'])
		assert.equal(Period.range(value), null, `${value} is no period`);
	assert.equal(Period.valid('2026-10'), true);
	assert.equal(Period.valid('October'), false);
});

test('the chooser names its periods in the words\' language', () => {
	const english = new Period({ days: [1, 7], months: 2, now: clock });
	assert.deepEqual(english.options, [{ value: 'P1D', label: 'Today' }, { value: 'P7D', label: 'Last 7 days' }, { value: '2026-10', label: 'October 2026' }, { value: '2026-09', label: 'September 2026' }]);
	const spanish = new Period({ days: [30], months: 1, now: clock }, Collection.Tools.labels.es);
	assert.deepEqual(spanish.options.map(option => option.label), ['Últimos 30 días', 'octubre de 2026']);
	assert.equal(english.option('2026-09-01/2026-09-15').label, 'Sep 1, 2026 – Sep 15, 2026');
	assert.equal(english.option('nonsense'), null);
	assert.deepEqual(new Period({ days: [], months: 0 }).options, [], 'a filter may offer no generated period');
});

test('the tools offer the periods, keep the chosen one as text and remove it like any filter', () => {
	const changes = [];
	const tools = new Collection.Tools({ label: 'Usage', search: false, filters: [filter], onchange: state => changes.push(state) }).mount(document.body);
	const select = tools.element.querySelector('select');
	assert.deepEqual(options(select).map(([value, label]) => [value, label]), [['', 'Any time'], ['P7D', 'Last 7 days'], ['P30D', 'Last 30 days'], ['2026-10', 'October 2026'], ['2026-09', 'September 2026'], ['2026-08', 'August 2026']]);
	select.value = '2026-09';
	select.dispatchEvent(new Event('change'));
	assert.deepEqual(changes.at(-1), { query: '', filters: { period: '2026-09' } });
	const chip = tools.element.querySelector('.bui-list-restriction:not([hidden])');
	assert.equal(chip.textContent, 'Period: September 2026');
	assert.equal(chip.getAttribute('aria-label'), 'Remove Period: September 2026');
	chip.click();
	assert.deepEqual(changes.at(-1), { query: '', filters: { period: '' } });
	assert.equal(tools.element.querySelector('.bui-list-restriction:not([hidden])'), null);
	tools.destroy();
});

test('a period the address holds outside the offered ones is a choice of its own; a malformed one stays unavailable', () => {
	const changes = [];
	const tools = new Collection.Tools({ label: 'Usage', search: false, filters: [{ ...filter, all: 'This month', months: 0 }], state: { filters: { period: '2026-03' } }, onchange: state => changes.push(state) }).mount(document.body);
	const select = tools.element.querySelector('select');
	assert.equal(select.value, '2026-03');
	assert.deepEqual(options(select).at(-1), ['2026-03', 'March 2026', false], 'an older month is named and can stay chosen');
	assert.equal(options(select)[0][1], 'This month', 'a product names its default period with `all`');
	assert.equal(tools.element.querySelector('.bui-list-restriction:not([hidden])').textContent, 'Period: March 2026');
	tools.state = { filters: { period: '2026-09-01/2026-09-15' } };
	assert.deepEqual(options(select).at(-1), ['2026-09-01/2026-09-15', 'Sep 1, 2026 – Sep 15, 2026', false]);
	assert.equal(select.querySelectorAll('[data-bui-unknown]').length, 1, 'one restored choice at a time');
	tools.state = { filters: { period: 'yesterday-ish' } };
	assert.deepEqual(options(select).at(-1), ['yesterday-ish', 'Unavailable choice', true]);
	assert.equal(tools.element.querySelector('.bui-list-restriction:not([hidden])').textContent, 'Period: Unavailable choice');
	tools.state = { filters: {} };
	assert.equal(select.querySelector('[data-bui-unknown]'), null, 'recovering from the address leaves nothing behind');
	assert.deepEqual(changes, [], 'restoring is silent');
	tools.destroy();
});

test('a collection sends the chosen period to its source, which reads its range, and clears it with the others', async () => {
	const source = new UsageSource();
	const list = new Collection({ label: 'Usage', columns: [{ key: 'name', label: 'Project', primary: true }], filters: [filter], source: source.read, state: { filters: { period: '2026-09' } } }).mount(document.body);
	await page.until(() => list.element.querySelectorAll('tbody tr').length);
	assert.deepEqual(source.requests.at(-1).filters, { period: '2026-09' });
	assert.deepEqual([...list.element.querySelectorAll('tbody tr > :first-child')].map(cell => cell.textContent), usage.filter(row => row.month === '2026-09').map(row => row.name));
	const select = list.element.querySelector('select');
	select.value = 'P7D';
	select.dispatchEvent(new Event('change'));
	await page.until(() => /No matches|Nothing matches/.test(list.element.textContent));
	assert.equal(list.state.filters.period, 'P7D');
	list.element.querySelector('.bui-empty-actions button').click();
	await page.until(() => source.requests.at(-1).filters.period === undefined && list.element.querySelectorAll('tbody tr').length === usage.length);
	list.destroy();
});

test('Spanish tools name no period and the periods in Spanish', () => {
	const tools = new Collection.Tools({ label: 'Uso', search: false, filters: [{ ...filter, label: 'Periodo', days: [1] }], labels: Collection.Tools.labels.es, state: { filters: { period: '2026-10' } } }).mount(document.body);
	assert.deepEqual([...tools.element.querySelectorAll('option')].slice(0, 3).map(option => option.textContent), ['Cualquier fecha', 'Hoy', 'octubre de 2026']);
	assert.equal(tools.element.querySelector('.bui-list-restriction:not([hidden])').getAttribute('aria-label'), 'Quitar Periodo: octubre de 2026');
	tools.destroy();
});
