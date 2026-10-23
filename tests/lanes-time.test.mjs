import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Page } from './support/page.mjs';
import { start, crew } from './fixtures/lanes.mjs';

/**
 * `Lanes` (0.27.0) in time: a tick writes only the live lanes' times and bars, the clock is heard only
 * while a lane is live, the axis' steps while live and its end once all ended, the bars' custom
 * properties, the tooltips' words, Spanish, and the stylesheet's narrow layout and still marks.
 */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

let at = start + 102_000;
const clock = new ui.Clock({ now: () => at });
const make = (options = {}) => new ui.Lanes({ label: 'Subagents of this turn', clock, locale: 'en', ...options }).mount(document.body);
const lane = (lanes, key) => lanes.element.querySelector(`.bui-lanes-lane[data-key="${key}"]`);
const span = lanes => Number(lanes.element.style.getPropertyValue('--bui-lanes-span'));
const bar = (lanes, key) => {
	const node = lane(lanes, key).querySelector('.bui-lanes-bar');
	return { from: Number(node.style.getPropertyValue('--bui-lanes-from')), to: Number(node.style.getPropertyValue('--bui-lanes-to')), open: node.hasAttribute('data-open'), hidden: node.hidden };
};
const time = (lanes, key) => lane(lanes, key).querySelector('.bui-lanes-time').textContent.replace(/^, /, '');
const pointer = target => target.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));

test('a tick writes only the live lanes\' times and bars; the clock is heard only while a lane is live', () => {
	at = start + 102_000;
	const lanes = make();
	lanes.update({ lanes: crew() });
	assert.equal(clock.size, 1, 'live lanes follow the clock');
	assert.deepEqual(['explore', 'map', 'plan', 'index', 'fix', 'bench'].map(key => time(lanes, key)), ['1 min 42 s', '1 min 35 s', '58 s', '20 s', '33 s', '41 s']);
	const observer = new window.MutationObserver(() => {});
	observer.observe(lanes.element, { subtree: true, childList: true, attributes: true, characterData: true });
	at = start + 103_000;
	clock.tick();
	const records = observer.takeRecords();
	observer.disconnect();
	assert.ok(records.length > 0, 'the tick wrote something');
	const live = ['explore', 'plan', 'index', 'fix'];
	for (const record of records) {
		const node = record.target.nodeType === 3 ? record.target.parentNode : record.target;
		const owner = node.closest('.bui-lanes-lane')?.dataset.key;
		const allowed = (live.includes(owner) && (node.closest('.bui-lanes-time') || node.matches('.bui-lanes-bar'))) || node === lanes.element;
		assert.ok(allowed, `a tick touched ${record.type} of ${node.className} in ${owner}`);
		assert.notEqual(record.type, 'childList', 'no node is replaced');
	}
	assert.equal(time(lanes, 'explore'), '1 min 43 s');
	assert.equal(time(lanes, 'map'), '1 min 35 s', 'an ended lane keeps its duration');
	assert.equal(bar(lanes, 'explore').to, 103_000);
	lanes.update({ lanes: crew().map(item => ({ ...item, state: 'done', until: item.until ?? start + 103_000 })) });
	assert.equal(clock.size, 0, 'nothing live: the clock is released');
	lanes.update({ lanes: crew() });
	assert.equal(clock.size, 1);
	lanes.destroy();
	assert.equal(clock.size, 0, 'destroying releases it');
});

test('while a lane is live the axis ends at the next whole step above the time run; the steps are 1 to 120 minutes, then doubling', () => {
	assert.deepEqual([...ui.Lanes.steps], [1, 2, 5, 10, 15, 30, 60, 120]);
	assert.ok(Object.isFrozen(ui.Lanes.steps));
	at = start;
	const lanes = make();
	lanes.update({ lanes: [{ key: 'a', state: 'running', title: 'A', since: start }] });
	const minutes = value => value * 60_000;
	const cases = [[0, 1], [30_000, 1], [59_999, 1], [60_000, 2], [minutes(4), 5], [minutes(9.9), 10], [minutes(14), 15], [minutes(29), 30], [minutes(59), 60], [minutes(119), 120], [minutes(130), 240], [minutes(500), 960]];
	for (const [elapsed, step] of cases) {
		at = start + elapsed;
		clock.tick();
		assert.equal(span(lanes), minutes(step), `${elapsed} ms run: a ${step} min axis`);
	}
	at = start + 45_000;
	lanes.update({ lanes: [{ key: 'a', state: 'running', title: 'A', since: start }, { key: 'b', state: 'waiting', title: 'B', since: start - 30_000 }] });
	assert.equal(span(lanes), minutes(2), 'the axis starts at the earliest start: 75 s run');
	assert.deepEqual([bar(lanes, 'b').from, bar(lanes, 'a').from, bar(lanes, 'a').to], [0, 30_000, 75_000]);
	at = start + 50_000;
	lanes.update({ lanes: [{ key: 'a', state: 'running', title: 'A', since: start }, { key: 'c', state: 'done', title: 'C', since: start, until: start + 70_000 }] });
	assert.equal(span(lanes), minutes(2), 'an end reported past the page\'s now (a clock ahead) still fits on the axis');
	lanes.destroy();
});

test('once every lane ended the axis ends at the last end; a lane whose end is not known marks only its start', () => {
	at = start + 600_000;
	const lanes = make();
	lanes.update({
		lanes: [
			{ key: 'a', state: 'done', title: 'A', since: start, until: start + 60_000 },
			{ key: 'b', state: 'failed', title: 'B', since: start + 10_000, until: start + 125_000 },
			{ key: 'c', state: 'unknown', title: 'C', since: start + 20_000 },
			{ key: 'd', state: 'stopped', title: 'D' }
		]
	});
	assert.equal(clock.size, 0, 'nothing is live');
	assert.equal(span(lanes), 125_000);
	assert.deepEqual(bar(lanes, 'a'), { from: 0, to: 60_000, open: false, hidden: false });
	assert.deepEqual(bar(lanes, 'b'), { from: 10_000, to: 125_000, open: false, hidden: false });
	assert.deepEqual(bar(lanes, 'c'), { from: 20_000, to: 20_000, open: true, hidden: false });
	assert.equal(bar(lanes, 'd').hidden, true, 'no start, no bar');
	assert.equal(lane(lanes, 'c').querySelector('.bui-lanes-time').hidden, true, 'no end, no duration');
	assert.equal(lane(lanes, 'd').hasAttribute('aria-describedby'), false, 'no start, no description');
	lanes.update({ lanes: [{ key: 'z', state: 'done', title: 'Z' }] });
	assert.equal(span(lanes), 60_000, 'nothing to measure: a minute, never nothing');
	lanes.destroy();
});

test('the trace\'s tooltip says when a lane started and how long it ran, kept current while shown; a cut title shows whole', () => {
	at = start + 102_000;
	const lanes = make();
	lanes.update({ lanes: crew() });
	assert.equal(document.querySelectorAll('.bui-tooltip').length, 0, 'no tooltip before anyone points');
	pointer(lane(lanes, 'explore').querySelector('.bui-lanes-trace'));
	const tip = document.querySelector('.bui-tooltip');
	assert.equal(tip.textContent, 'Started 10:42:05 · 1 min 42 s so far');
	assert.equal(tip.getAttribute('aria-hidden'), 'true', 'the lane\'s own words say it to assistive technology');
	assert.equal(tip.hidden, false);
	at = start + 104_000;
	clock.tick();
	assert.equal(tip.textContent, 'Started 10:42:05 · 1 min 44 s so far', 'a tick keeps a shown tooltip current');
	pointer(lane(lanes, 'map').querySelector('.bui-lanes-trace'));
	assert.equal(document.querySelectorAll('.bui-tooltip')[1].textContent, 'Started 10:42:05 · ran 1 min 35 s');
	const title = lane(lanes, 'plan').querySelector('.bui-lanes-title');
	Object.defineProperty(title, 'scrollWidth', { value: 240, configurable: true });
	Object.defineProperty(title, 'clientWidth', { value: 100, configurable: true });
	pointer(lane(lanes, 'plan'));
	assert.equal(document.querySelectorAll('.bui-tooltip')[2].textContent, 'Review the migration plan', 'the whole title, only while it is cut');
	lanes.destroy();
	assert.equal(document.querySelectorAll('.bui-tooltip').length, 0, 'destroying removes them');
});

test('Spanish: the description, the trace\'s words, the units, the state words and the group\'s name', () => {
	at = start + 102_000;
	const lanes = make({ labels: ui.Lanes.labels.es, locale: 'es', label: null });
	const items = crew().map(({ stateLabel, ...item }) => item);
	lanes.update({ lanes: [...items, { key: 'yesterday', state: 'done', title: 'Ayer', since: start - 86_400_000, until: start - 86_000_000 }] });
	assert.equal(lanes.element.getAttribute('aria-label'), 'Trabajo en paralelo');
	const words = key => lane(lanes, key).querySelector('.bui-lanes-head > .bui-hidden').textContent;
	assert.deepEqual(['explore', 'map', 'fix', 'bench'].map(words), ['En curso', 'Hecho', 'En espera', 'Falló']);
	const said = key => document.getElementById(lane(lanes, key).getAttribute('aria-describedby')).textContent;
	assert.equal(said('explore'), 'Empezó a las 10:42:05');
	assert.match(said('yesterday'), /^Empezó el 22 oct\.?,? 10:42:05$/);
	pointer(lane(lanes, 'map').querySelector('.bui-lanes-trace'));
	assert.equal(document.querySelector('.bui-tooltip').textContent, 'Empezó a las 10:42:05 · duró 1 min 35 s');
	pointer(lane(lanes, 'explore').querySelector('.bui-lanes-trace'));
	assert.equal(document.querySelectorAll('.bui-tooltip')[1].textContent, 'Empezó a las 10:42:05 · 1 min 42 s hasta ahora');
	assert.deepEqual(Object.keys(ui.Lanes.labels.es), Object.keys(ui.Lanes.labels.en));
	assert.match(ui.Lanes.labels.en.started({ time: '22 Oct, 10:42:05', day: true }), /^Started 22 Oct/);
	lanes.destroy();
});

const sheet = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const rule = selector => [...sheet.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([, names]) => names.split(',').map(name => name.trim()).includes(selector)).map(([, , body]) => body).join('\n');

test('the stylesheet: subgrid rows, a container query for two lines below 40rem, tabular figures and still marks', () => {
	assert.match(rule('.bui-lanes'), /container:\s*bui-lanes \/ inline-size/);
	assert.match(rule('.bui-lanes-lane'), /grid-template-columns:\s*subgrid/);
	assert.match(rule('.bui-lanes-lane'), /grid-column:\s*1 \/ -1/);
	const narrow = /@container bui-lanes \(width < 40rem\)\s*\{([\s\S]*?)\n\}/.exec(sheet)?.[1] ?? '';
	assert.match(narrow, /\.bui-lanes-kind,\s*\.bui-lanes-trace\s*\{\s*display:\s*none/, 'no kind and no trace below 40rem');
	assert.match(narrow, /grid-template-rows:\s*repeat\(2, minmax\(1lh, auto\)\)/, 'two lines, each one line high whatever it holds');
	assert.match(narrow, /\.bui-lanes-now,\s*\.bui-lanes-facts\s*\{\s*grid-row:\s*2/);
	assert.match(rule('.bui-lanes-lane .bui-lanes-mark .bui-status-dot'), /animation:\s*none/, 'a mark never pulses (LOAD-01)');
	for (const selector of ['.bui-lanes-time', '.bui-lanes-facts']) assert.match(rule(selector), /font-variant-numeric:\s*tabular-nums/, selector);
	assert.match(rule('.bui-lanes-bar'), /var\(--bui-lanes-from, 0\) \/ var\(--bui-lanes-span\)/, 'bars placed by custom properties');
	assert.match(rule('.bui-lanes-lane[aria-current=\'true\']'), /--color-surface-selected/);
	assert.match(rule('.bui-lanes-lane:focus-visible'), /outline:\s*2px solid var\(--color-focus\)/);
	const own = readFileSync(new URL('../src/styles/lanes.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
	assert.doesNotMatch(own, /transition|@keyframes|animation:(?!\s*none)/, 'nothing in the lanes moves by itself');
	assert.doesNotMatch(own, /\.bui-lane(?![s\w])/, 'the thread template\'s lane classes (.bui-lane, .bui-lane-wide, D96) are not restyled here');
});
