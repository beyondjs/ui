import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/** Facts and Meter (0.11.0): label and value rows patched by key with their actions and stale notes; a use against a limit said in words, stale, reset since, and its clock released. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

/** A clock whose time the test sets. */
const clock = (at = Date.parse('2026-10-08T10:00:00Z')) => {
	let now = at;
	const made = new ui.Clock({ now: () => now });
	return { clock: made, set: value => ((now = value), made.tick()) };
};

test('Facts: a head with its title, one summary and one state in words, and rows as a description list with values at their end', () => {
	const copy = new ui.Button({ label: 'Copy', variant: 'quiet' });
	const facts = new ui.Facts({ head: { title: 'Changes', value: '3 files · +52 −3', state: ['Not pushed', 'warning'] }, rows: [{ key: 'branch', label: 'Branch', value: 'conduict/fix-redirect', mono: true, action: copy }, { label: 'Not committed', value: '1 file' }] }).mount(document.body);
	const root = facts.element;
	assert.equal(root.getAttribute('role'), 'group');
	const title = root.querySelector('h3.bui-facts-title');
	assert.equal(title.textContent, 'Changes');
	assert.equal(root.getAttribute('aria-labelledby'), title.id, 'the head names the rows');
	assert.equal(root.querySelector('.bui-facts-summary').textContent, '3 files · +52 −3');
	const state = root.querySelector('.bui-facts-state');
	assert.equal(state.textContent, 'Not pushed', 'the state in words');
	assert.ok(state.classList.contains('bui-status-warning'));
	const rows = [...root.querySelectorAll('dl.bui-facts-list > .bui-facts-row')];
	assert.deepEqual(rows.map(row => [row.querySelector('dt').textContent, row.querySelector('dd .bui-facts-value').textContent]), [['Branch', 'conduict/fix-redirect'], ['Not committed', '1 file']]);
	assert.ok(rows[0].querySelector('.bui-facts-value').hasAttribute('data-mono'), 'an identifier in the monospaced face');
	assert.ok(!rows[1].querySelector('.bui-facts-value').hasAttribute('data-mono'));
	assert.ok(rows[0].querySelector('.bui-facts-action').contains(copy.element), "the row's own action");
	facts.destroy();
});

test('Facts: rows patched by key keep their element and a focused action; a stale row is muted with its note; a head with no title takes the label', () => {
	const copy = new ui.Button({ label: 'Copy', variant: 'quiet' });
	const facts = new ui.Facts({ label: 'Environment', rows: [{ key: 'state', label: 'State', value: 'Running' }, { key: 'branch', label: 'Branch', value: 'main', action: copy }] }).mount(document.body);
	const root = facts.element;
	assert.equal(root.getAttribute('aria-label'), 'Environment', 'named by its label without a title');
	assert.equal(root.querySelector('.bui-facts-head').hidden, true, 'no head takes no room');
	const kept = root.querySelector('.bui-facts-row');
	copy.element.focus();
	facts.rows = [{ key: 'state', label: 'State', value: 'Stopped', stale: 'Not reported since 23:10' }, { key: 'branch', label: 'Branch', value: 'main', action: copy }, { key: 'size', label: 'Capacity', value: 4 }];
	assert.ok(root.querySelector('.bui-facts-row') === kept, 'the row that stays keeps its element');
	assert.ok(document.activeElement === copy.element, 'the focused action keeps its focus');
	assert.ok(kept.hasAttribute('data-stale'));
	assert.equal(kept.querySelector('.bui-facts-note').textContent, 'Not reported since 23:10', 'its note follows the value, read with it');
	assert.equal(root.querySelectorAll('.bui-facts-row')[2].querySelector('.bui-facts-value').textContent, '4', 'a number is said as text');
	facts.rows = [{ key: 'state', label: 'State', value: 'Stopped', stale: true }];
	assert.equal(kept.querySelector('.bui-facts-note').textContent, 'Not current', 'the default note');
	assert.equal(root.querySelectorAll('.bui-facts-row').length, 1, 'rows that leave are removed');
	facts.rows = [{ key: 'state', label: 'State', value: 'Running' }];
	assert.ok(!kept.hasAttribute('data-stale') && !kept.querySelector('.bui-facts-note'), 'current again');
	facts.head = { title: 'Environment', level: 2 };
	assert.ok(root.querySelector('h2.bui-facts-title'));
	assert.ok(!root.hasAttribute('aria-label'));
	facts.rows = [];
	assert.equal(root.querySelector('.bui-facts-list').hidden, true, 'no rows take no room');
	const spanish = new ui.Facts({ rows: [{ label: 'Estado', value: 'Detenido', stale: true }], labels: ui.Facts.labels.es }).mount(document.body);
	assert.equal(spanish.element.querySelector('.bui-facts-note').textContent, 'No actualizado');
	facts.destroy();
	spanish.destroy();
});

test('Facts: an unknown tone is neutral and a state without words is none (never a dot alone)', () => {
	const facts = new ui.Facts({ head: { title: 'Changes', state: ['', 'danger'] } }).mount(document.body);
	assert.equal(facts.element.querySelector('.bui-facts-state'), null);
	facts.head = { title: 'Changes', state: { label: 'Open', tone: 'purple' } };
	assert.ok(facts.element.querySelector('.bui-facts-state').classList.contains('bui-status-neutral'));
	facts.destroy();
});

test('Meter: the share used and its level in words past the thresholds, a role="meter" with its values and name, the reset ahead', () => {
	const { clock: time } = clock();
	const meter = new ui.Meter({ label: '5-hour window', value: 0.42, reset: '2026-10-08T23:10:00Z', clock: time, locale: 'en' }).mount(document.body);
	const track = meter.element.querySelector('[role="meter"]');
	assert.equal(document.getElementById(track.getAttribute('aria-labelledby')).textContent, '5-hour window');
	assert.deepEqual([track.getAttribute('aria-valuemin'), track.getAttribute('aria-valuemax'), track.getAttribute('aria-valuenow')], ['0', '100', '42']);
	assert.equal(meter.level, 'ok');
	assert.equal(meter.element.querySelector('.bui-meter-word').hidden, true, 'no word below the warning');
	assert.match(track.getAttribute('aria-valuetext'), /^42% used · Resets /);
	assert.match(meter.element.querySelector('.bui-meter-note').textContent, /^Resets /);
	assert.equal(meter.element.querySelector('.bui-meter-fill').style.getPropertyValue('--bui-meter'), '0.42');
	for (const [value, level, word] of [[0.8, 'warning', 'Near the limit'], [0.95, 'danger', 'Almost at the limit'], [1.2, 'full', 'Limit reached']]) {
		meter.update({ value });
		assert.equal(meter.level, level);
		assert.equal(meter.element.querySelector('.bui-meter-word').textContent, word, 'said in words, never color alone');
		assert.ok(track.getAttribute('aria-valuetext').includes(word));
	}
	assert.equal(meter.element.querySelector('.bui-meter-fill').style.getPropertyValue('--bui-meter'), '1', 'the fill stops at the limit');
	assert.equal(track.getAttribute('aria-valuenow'), '120');
	meter.update({ thresholds: { warning: 0.5, danger: 0.7 }, value: 0.6 });
	assert.equal(meter.level, 'warning', 'thresholds the product sets');
	meter.destroy();
});

test('Meter: stale since a moment, in the product\'s words or unsaid; a reset that passes on the clock is said stale by itself; not reported', () => {
	const { clock: time, set } = clock();
	const meter = new ui.Meter({ label: 'Week', value: 0.3, stale: '2026-10-08T09:10:00Z', clock: time, locale: 'en' }).mount(document.body);
	const track = meter.track;
	assert.ok(meter.stale && meter.element.hasAttribute('data-stale'), 'the track muted');
	assert.match(meter.element.querySelector('.bui-meter-note').textContent, /^Not reported since \d\d:\d\d$/);
	assert.match(track.getAttribute('aria-valuetext'), /30% used · Not reported since/);
	meter.update({ stale: '6 Oct, 23:10' });
	assert.equal(meter.element.querySelector('.bui-meter-note').textContent, 'Not reported since 6 Oct, 23:10');
	meter.update({ stale: true });
	assert.equal(meter.element.querySelector('.bui-meter-note').textContent, 'Not reported lately');
	meter.update({ stale: null, reset: Date.parse('2026-10-08T10:30:00Z') });
	assert.equal(meter.stale, false);
	assert.equal(time.size, 1, 'the clock is watched while a reset is ahead');
	set(Date.parse('2026-10-08T10:31:00Z'));
	assert.ok(meter.stale, 'a reset that passed: the use since is unknown');
	assert.match(meter.element.querySelector('.bui-meter-note').textContent, /^Reset since \d\d:\d\d · use not reported since$/);
	assert.equal(time.size, 0, 'and the clock is released');
	meter.update({ value: null, reset: null });
	assert.equal(meter.level, 'unknown');
	assert.equal(meter.element.querySelector('.bui-meter-value').textContent, 'Not reported');
	assert.equal(track.getAttribute('aria-valuetext'), 'Not reported');
	meter.update({ reset: Date.parse('2026-10-09T10:00:00Z') });
	meter.destroy();
	assert.equal(time.size, 0, 'destroy releases the clock');
});

test('Meter: thresholds outside 0 to 1, or a warning past the danger, are refused; Spanish copy', () => {
	assert.throws(() => new ui.Meter({ label: 'x', value: 0.1, thresholds: { warning: 0.9, danger: 0.8 } }), RangeError);
	assert.throws(() => new ui.Meter({ label: 'x', value: 0.1, thresholds: { warning: 0, danger: 0.8 } }), RangeError);
	assert.throws(() => new ui.Meter({ label: 'x', value: 0.1, thresholds: { danger: 1.5 } }), RangeError);
	const meter = new ui.Meter({ label: 'Ventana de 5 horas', value: 0.96, stale: '6 oct, 23:10', labels: ui.Meter.labels.es, locale: 'es' }).mount(document.body);
	assert.equal(meter.element.querySelector('.bui-meter-word').textContent, 'Casi en el límite');
	assert.equal(meter.element.querySelector('.bui-meter-note').textContent, 'Sin datos desde 6 oct, 23:10');
	assert.match(meter.track.getAttribute('aria-valuetext'), /96\s?% usado/);
	meter.destroy();
});
