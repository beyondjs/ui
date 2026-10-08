import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/** ActivityRow and ActivityGroup (0.10.0): disclosure rows with their state in words, a lazy body, updates that keep open state and focus, groups. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const start = Date.parse('2026-10-07T10:00:00Z');
function clock(seconds) {
	let now = start + seconds * 1000;
	const made = new ui.Clock({ now: () => now });
	made.at = value => {
		now = start + value * 1000;
		made.tick();
	};
	return made;
}
const head = row => row.element.querySelector('.bui-activity-head');
const lines = count => Array.from({ length: count }, (_, index) => `line ${index + 1}`).join('\n');

test('a row: the kind glyph, title, meta, time and state in words, as a disclosure button', () => {
	const row = new ui.ActivityRow({ glyph: 'terminal', title: 'Ran npm test', meta: 'exit 1', state: 'failed', duration: 64_000, body: () => [] }).mount(document.body);
	const button = head(row);
	assert.equal(button.tagName, 'BUTTON');
	assert.equal(button.getAttribute('aria-expanded'), 'false');
	assert.equal(button.getAttribute('aria-controls'), row.element.querySelector('.bui-activity-body').id);
	assert.equal(button.querySelector('.bui-activity-mark svg').dataset.icon, 'terminal');
	assert.equal(button.querySelector('.bui-activity-title').textContent, 'Ran npm test');
	assert.equal(button.querySelector('.bui-activity-meta').textContent, ', exit 1');
	assert.equal(button.querySelector('.bui-activity-time').textContent, ', 1 min 4 s');
	assert.equal(button.querySelector('.bui-activity-word .bui-status').textContent, 'Failed');
	assert.equal(button.textContent.replace(/\s+/g, ' ').trim(), 'Ran npm test, exit 1, 1 min 4 s, Failed', 'its accessible name says everything once');
	assert.equal(row.element.dataset.state, 'failed');
	row.update({ state: 'done' });
	assert.equal(button.querySelector('.bui-activity-word').textContent, ', Done');
	assert.ok(button.querySelector('.bui-activity-word .bui-hidden'), '"Done" for assistive technology only');
	row.update({ state: 'mystery' });
	assert.equal(row.state, 'waiting', 'an unknown state reads as waiting');
	row.destroy();
	const plain = new ui.ActivityRow({ glyph: 'file', title: 'Read src/a.js' }).mount(document.body);
	assert.equal(head(plain).tagName, 'DIV', 'a row without a body is plain text');
	assert.equal(head(plain).querySelector('.bui-activity-chevron'), null);
	plain.destroy();
	assert.throws(() => new ui.ActivityRow({ glyph: 'nope', title: 'x' }), /Unknown icon/);
});

test('a running row shows a spinner and its time so far on the clock, then how long it took', () => {
	const moving = clock(5);
	const row = new ui.ActivityRow({ glyph: 'terminal', title: 'Running npm test', state: 'running', since: start, clock: moving }).mount(document.body);
	assert.ok(head(row).querySelector('.bui-activity-mark .bui-spinner'), 'a spinner in place of the glyph');
	assert.equal(head(row).querySelector('.bui-activity-word .bui-status').textContent, 'Running');
	assert.equal(head(row).querySelector('.bui-activity-time').textContent, ', 5 s');
	assert.equal(moving.size, 1, 'it follows the clock while running');
	moving.at(72);
	assert.equal(head(row).querySelector('.bui-activity-time').textContent, ', 1 min 12 s');
	row.update({ state: 'done', title: 'Ran npm test', until: start + 80_000 });
	assert.equal(head(row).querySelector('.bui-activity-time').textContent, ', 1 min 20 s');
	assert.equal(head(row).querySelector('.bui-activity-mark svg').dataset.icon, 'terminal');
	assert.equal(moving.size, 0, 'a finished row does not listen to the clock');
	row.destroy();
});

test('the body is built on first open, from sections: the first 12 lines, Show all, Copy', async () => {
	let builds = 0;
	const row = new ui.ActivityRow({ glyph: 'terminal', title: 'Ran npm test', body: () => (builds++, [{ label: 'Input', text: 'npm test' }, { label: 'Output', text: lines(20) }, 'Exit status 0']) }).mount(document.body);
	assert.equal(builds, 0, 'nothing is built before it opens');
	head(row).click();
	assert.equal(builds, 1);
	assert.equal(row.expanded, true);
	assert.equal(head(row).getAttribute('aria-expanded'), 'true');
	const sections = [...row.element.querySelectorAll('.bui-activity-section')];
	assert.deepEqual(sections.map(node => node.querySelector('.bui-activity-label').textContent), ['Input', 'Output']);
	assert.equal(sections[0].getAttribute('role'), 'group');
	const code = sections[1].querySelector('code');
	assert.equal(code.textContent.split('\n').length, 12);
	const more = sections[1].querySelector('[aria-expanded]');
	assert.equal(more.textContent, 'Show all 20 lines');
	more.click();
	assert.equal(code.textContent.split('\n').length, 20);
	assert.equal(more.textContent, 'Show fewer lines');
	assert.equal(more.getAttribute('aria-expanded'), 'true');
	assert.equal(row.element.querySelector('.bui-activity-note').textContent, 'Exit status 0');
	const copied = [];
	Object.defineProperty(page.window.navigator, 'clipboard', { value: { writeText: async text => copied.push(text) }, configurable: true });
	[...sections[1].querySelectorAll('button')].find(node => node.textContent === 'Copy').click();
	await page.until(() => sections[1].querySelector('.bui-activity-result').textContent === 'Copied');
	assert.deepEqual(copied, [lines(20)], 'the whole text, not the shown lines');
	head(row).click();
	head(row).click();
	assert.equal(builds, 1, 'built once');
	row.destroy();
});

test('update keeps the row open and focus where it is; a new body is built again at once when open, at the next opening otherwise', () => {
	let version = 1;
	const row = new ui.ActivityRow({ glyph: 'terminal', title: 'Running npm test', state: 'running', body: () => [{ label: 'Input', text: `v${version}` }] }).mount(document.body);
	row.open();
	const button = head(row);
	button.focus();
	row.update({ title: 'Ran npm test', state: 'done', meta: 'exit 0' });
	assert.ok(head(row) === button, 'the button stays');
	assert.ok(document.activeElement === button, 'focus stays');
	assert.equal(row.expanded, true);
	version = 2;
	row.update({ body: () => [{ label: 'Output', text: `v${version}` }] });
	assert.equal(row.element.querySelector('.bui-activity-label').textContent, 'Output');
	row.close();
	version = 3;
	row.update({ body: () => [{ label: 'Diff', text: `v${version}` }] });
	row.open();
	assert.equal(row.element.querySelector('.bui-activity-label').textContent, 'Diff');
	row.element.querySelector('.bui-activity-section button').focus();
	row.close();
	assert.ok(document.activeElement === head(row), 'closing with focus inside returns it to the row');
	row.destroy();
});

test('a live tail keeps the last lines of output under the row; a title cut is shown whole at the top of the body', () => {
	const row = new ui.ActivityRow({ glyph: 'terminal', title: 'Running npm test', state: 'running', tail: lines(9), body: () => [] }).mount(document.body);
	const tail = row.element.querySelector('.bui-activity-tail');
	assert.equal(tail.hidden, false);
	assert.equal(tail.textContent, ['line 4', 'line 5', 'line 6', 'line 7', 'line 8', 'line 9'].join('\n'));
	row.update({ tail: null });
	assert.equal(tail.hidden, true);
	const title = row.element.querySelector('.bui-activity-title');
	Object.defineProperty(title, 'scrollHeight', { value: 80, configurable: true });
	Object.defineProperty(title, 'clientHeight', { value: 40, configurable: true });
	row.open();
	const whole = row.element.querySelector('.bui-activity-whole');
	assert.equal(whole.hidden, false);
	assert.equal(whole.textContent, 'Running npm test');
	row.destroy();
});

test('a group folds rows under one title of their count and the state that matters most; rows that stay keep focus', () => {
	const read = name => new ui.ActivityRow({ glyph: 'file', title: `Read ${name}`, body: () => [] });
	const [a, b, c] = [read('a.js'), read('b.js'), read('c.js')];
	const group = new ui.ActivityGroup({ glyph: 'file', title: count => `Read ${count} files`, rows: [a, b] }).mount(document.body);
	const button = group.element.querySelector(':scope > .bui-activity-head');
	assert.equal(button.querySelector('.bui-activity-title').textContent, 'Read 2 files');
	assert.equal(button.getAttribute('aria-expanded'), 'false');
	assert.equal(group.element.querySelector('.bui-activity-list').hidden, true);
	group.add(c);
	assert.equal(button.querySelector('.bui-activity-title').textContent, 'Read 3 files');
	assert.equal(group.element.querySelectorAll('.bui-activity-list > li').length, 3);
	button.click();
	assert.equal(group.expanded, true);
	c.update({ state: 'running' });
	assert.equal(group.state, 'running');
	assert.equal(group.element.dataset.state, 'running');
	c.update({ state: 'failed' });
	assert.equal(group.state, 'failed');
	head(b).focus();
	group.rows = [c, b];
	assert.ok(document.activeElement === head(b), 'a row that stays keeps focus');
	assert.equal(a.destroyed, true, 'a row that leaves is destroyed');
	assert.deepEqual([...group.element.querySelectorAll('.bui-activity-list .bui-activity-title')].map(node => node.textContent), ['Read c.js', 'Read b.js']);
	head(c).focus();
	group.rows = [b];
	assert.ok(document.activeElement === head(b), 'focus on a row that leaves moves to the row at its place');
	assert.ok(group.remove(b) === b && !b.destroyed && group.rows.length === 0);
	group.update({ title: 'Searched 0 places' });
	assert.equal(button.querySelector('.bui-activity-title').textContent, 'Searched 0 places');
	group.rows = [b];
	group.destroy();
	assert.equal(b.destroyed, true, 'the group destroys the rows it holds');
	assert.deepEqual(Object.keys(ui.ActivityRow.labels.es).sort(), Object.keys(ui.ActivityRow.labels.en).sort());
	assert.equal(ui.ActivityGroup.labels, ui.ActivityRow.labels);
});

test('a duration under a second says nothing rather than "0 s"', () => {
	const quick = new ui.ActivityRow({ glyph: 'code', title: 'Edited a.js', duration: 900 }).mount(document.body);
	assert.equal(head(quick).querySelector('.bui-activity-time').hidden, true);
	quick.update({ duration: 1500 });
	assert.equal(head(quick).querySelector('.bui-activity-time').textContent, ', 1 s');
	quick.destroy();
});
