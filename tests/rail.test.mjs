import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/** The rail of 0.12.0 (Rail, RailItem, RailMoment) and ActivityExchange, an opened row's input and output in one box. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

test('a rail adopts a product container or makes its own, named only when it is a group', () => {
	const own = new ui.Rail({ label: 'Work of this turn' }).mount(document.body);
	assert.ok(own.element.classList.contains('bui-rail'));
	assert.equal(own.element.getAttribute('role'), 'group');
	assert.equal(own.element.getAttribute('aria-label'), 'Work of this turn');
	const container = document.createElement('div');
	container.className = 'product-flow';
	const adopted = new ui.Rail({ element: container, children: [document.createElement('p')] });
	assert.equal(adopted.element, container, 'the product keeps its element');
	assert.ok(container.classList.contains('product-flow') && container.classList.contains('bui-rail'));
	assert.equal(container.getAttribute('role'), null, 'unnamed, it adds no role');
	assert.equal(container.childElementCount, 1);
	assert.equal(ui.Rail.tone('danger'), 'danger');
	assert.equal(ui.Rail.tone('purple'), 'neutral', 'an unknown tone reads as neutral');
});

test('a rail item: a glyph or a dot on the line, its tone, a spinner while in progress, content patched in place', () => {
	const item = new ui.RailItem({ content: 'The session check reads the cookie first.' }).mount(document.body);
	const mark = () => item.element.querySelector('.bui-rail-mark');
	assert.equal(mark().getAttribute('aria-hidden'), 'true', 'the mark is decoration: the content says the state');
	assert.ok(mark().querySelector('.bui-rail-dot'), 'without a glyph, a dot');
	assert.equal(item.element.dataset.tone, 'neutral');
	assert.equal(item.body.textContent, 'The session check reads the cookie first.');
	item.update({ glyph: 'clock' });
	assert.equal(mark().querySelector('svg').dataset.icon, 'clock');
	item.update({ tone: 'progress' });
	assert.ok(mark().querySelector('.bui-spinner'), 'in progress, a spinner in place of the glyph');
	item.update({ tone: 'danger' });
	assert.equal(mark().querySelector('svg').dataset.icon, 'clock', 'out of progress, the glyph again');
	assert.equal(item.element.dataset.tone, 'danger');
	const button = document.createElement('button');
	item.update({ content: button });
	button.focus();
	item.update({ tone: 'warning' });
	assert.equal(document.activeElement, button, 'a tone change keeps the content and its focus');
	item.update({ content: null });
	assert.equal(item.body.childElementCount, 0);
	item.update({ tone: 'nonsense' });
	assert.equal(item.element.dataset.tone, 'neutral');
	assert.throws(() => new ui.RailItem({ glyph: 'nope' }), /Unknown icon/);
	item.destroy();
	assert.equal(item.update({ tone: 'danger' }), item, 'a destroyed item ignores updates');
});

test('a moment says a time at the far end, with the whole moment for hover and assistive technology', () => {
	const moment = new ui.RailMoment({ text: '10:51', datetime: '2026-10-09T10:51:00Z', title: '9 Oct 2026, 10:51' }).mount(document.body);
	const time = moment.element.querySelector('time');
	assert.equal(moment.element.className, 'bui-rail-moment');
	assert.equal(time.textContent, '10:51');
	assert.equal(time.getAttribute('datetime'), '2026-10-09T10:51:00Z');
	assert.equal(time.getAttribute('title'), '9 Oct 2026, 10:51');
	moment.update({ text: '11:02', title: null });
	assert.equal(time.textContent, '11:02');
	assert.equal(time.getAttribute('title'), null);
	assert.equal(time.getAttribute('datetime'), '2026-10-09T10:51:00Z', 'what is not given stays');
});

test('an exchange: what a step was given and gave back in one box, a part without text left out, each part folding and copying', async () => {
	const lines = Array.from({ length: 20 }, (_, index) => `line ${index + 1}`).join('\n');
	const row = new ui.ActivityRow({ glyph: 'terminal', title: 'Ran npm test', body: () => [{ exchange: [{ label: 'In', text: 'npm test' }, { label: 'Out', text: lines }, { label: 'Error', text: '' }] }] }).mount(document.body);
	row.open();
	const box = row.element.querySelector('.bui-activity-exchange');
	assert.ok(box, 'one box');
	const parts = box.querySelectorAll('.bui-activity-section');
	assert.equal(parts.length, 2, 'the empty part is left out');
	assert.deepEqual([...parts].map(part => part.querySelector('.bui-activity-label').textContent), ['In', 'Out']);
	assert.equal(parts[0].querySelector('code').textContent, 'npm test');
	assert.equal(parts[1].querySelector('code').textContent.split('\n').length, 12, 'a long part shows its first lines');
	const more = parts[1].querySelector('button[aria-expanded]');
	assert.equal(more.textContent, 'Show all 20 lines');
	more.click();
	assert.equal(parts[1].querySelector('code').textContent.split('\n').length, 20);
	const labels = { text: key => key };
	const exchange = new ui.ActivityExchange([{ label: 'In', text: 'ls' }, null, { label: 'Out' }], labels);
	assert.equal(exchange.parts.length, 1, 'parts without text, or none at all, are left out');
	assert.equal(new ui.ActivityExchange(undefined, labels).parts.length, 0);
	row.destroy();
});

test('a row on a rail takes its state color: running, waiting and denied as well as failed', () => {
	for (const state of ['running', 'waiting', 'denied', 'failed', 'done']) {
		const row = new ui.ActivityRow({ glyph: 'terminal', title: state, state }).mount(document.body);
		assert.equal(row.element.dataset.state, state, 'the stylesheet colors the mark by this state');
		row.destroy();
	}
});
