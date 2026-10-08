import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { start, minute, at, usual, preparing, blocked } from './fixtures/operations.mjs';

/** D50: the clock, timed `Steps` at their thresholds, and the state with its freshness. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

/** A clock the test moves: `clock.at(minutes)` sets the time and re-evaluates. */
function clock(minutes = 0) {
	let now = start + minutes * minute;
	const made = new ui.Clock({ now: () => now });
	made.at = value => {
		now = start + value * minute;
		made.tick();
	};
	return made;
}
const rows = steps => [...steps.element.querySelectorAll('.bui-step')].map(row => row.textContent);
const time = (steps, key) => steps.element.querySelectorAll('.bui-step')[key].querySelector('.bui-step-time')?.textContent ?? null;

test('Clock: one timer while anything listens, none after; a throwing listener does not stop the others', async () => {
	const beat = new ui.Clock({ every: 5 });
	const calls = [];
	const errors = [];
	const saved = globalThis.reportError;
	globalThis.reportError = error => errors.push(error.message);
	const first = beat.subscribe(() => {
		throw new Error('listener failed');
	});
	const second = beat.subscribe(now => calls.push(now));
	await page.until(() => calls.length >= 2);
	assert.equal(beat.size, 2);
	assert.ok(errors.length >= 2 && errors.every(message => message === 'listener failed'));
	first();
	second();
	assert.equal(beat.size, 0);
	const count = calls.length;
	await new Promise(resolve => setTimeout(resolve, 30));
	assert.equal(calls.length, count, 'no beat after the last release');
	globalThis.reportError = saved;
	assert.ok(ui.Clock.system === ui.Clock.system, 'one shared system clock');
	assert.throws(() => new ui.Clock({ now: 5 }), TypeError);
});

test('Steps: a finished step says how long it took; the step in progress its time against the median, and its phase', () => {
	const steps = new ui.Steps({ label: 'Preparing My first VM', steps: preparing, clock: clock(3) }).mount(document.body);
	const list = steps.element.querySelector('ol');
	assert.equal(list.getAttribute('aria-label'), 'Preparing My first VM');
	assert.equal(time(steps, 0), 'Took 1 min 24 s');
	assert.equal(time(steps, 1), '1 min so far · usually about 3 min');
	assert.equal(steps.element.querySelector('.bui-step-phase').textContent, 'Now: Installing tools · 0 s');
	assert.equal(list.querySelector('[aria-current="step"]').dataset.state, 'progress');
	assert.deepEqual([...list.querySelectorAll('.bui-step')].map(row => row.dataset.state), ['done', 'progress', 'waiting', 'waiting']);
	// Every state is in words: visible for progress, hidden for done and waiting.
	assert.match(rows(steps)[0], /Machine · Done/);
	assert.match(rows(steps)[1], /In progress/);
	assert.match(rows(steps)[2], /Connection to Conduict · Waiting/);
	assert.equal(steps.element.querySelector('[aria-live="polite"]').textContent, '', 'nothing is announced when drawn');
	steps.destroy();
});

test('Steps: "taking longer than usual" starts past the 90th percentile, not at the median; the clock alone crosses it', () => {
	const moving = clock(2);
	const steps = new ui.Steps({ label: 'Preparing', steps: preparing, clock: moving }).mount(document.body);
	moving.at(5); // 3 min run: exactly the median
	assert.equal(time(steps, 1), '3 min so far · usually about 3 min');
	moving.at(6); // 4 min: past the median, below the 90th percentile
	assert.equal(time(steps, 1), '4 min so far · usually about 3 min');
	assert.ok(!steps.element.querySelector('.bui-step-slow'));
	assert.equal(steps.announced, '');
	moving.at(7); // 5 min: exactly the 90th percentile
	assert.ok(!steps.element.querySelector('.bui-step-slow'), 'at the 90th percentile it is not slow yet');
	moving.at(7 + 1 / 60); // one second past it
	assert.equal(time(steps, 1), 'Taking longer than usual · 5 min 1 s so far · usually about 3 min');
	assert.ok(steps.element.querySelector('.bui-step-slow'));
	assert.equal(steps.announced, 'Startup: taking longer than usual', 'announced once, politely');
	moving.at(8);
	assert.equal(steps.announced, 'Startup: taking longer than usual');
	steps.element.querySelector('[aria-live]').textContent = '';
	moving.at(9);
	assert.equal(steps.announced, '', 'a step already slow is not announced again');
	steps.destroy();
});

test('Steps: drawn from the record and the clock only, so a reload mid-step shows the same', () => {
	const first = new ui.Steps({ label: 'Preparing', steps: preparing, clock: clock(4.5) }).mount(document.body);
	const reloaded = new ui.Steps({ label: 'Preparing', steps: structuredClone(preparing), clock: clock(4.5) }).mount(document.body);
	assert.deepEqual(rows(reloaded), rows(first));
	assert.equal(time(reloaded, 1), '2 min 30 s so far · usually about 3 min');
	first.destroy();
	reloaded.destroy();
});

test('Steps: a changed state is announced; a blocked step says its reason with technical details', () => {
	const moving = clock(5);
	const steps = new ui.Steps({ label: 'Preparing', steps: preparing, clock: moving }).mount(document.body);
	steps.steps = blocked;
	assert.equal(steps.announced, 'Startup: Done. Connection to Conduict: Blocked');
	const row = steps.element.querySelectorAll('.bui-step')[2];
	assert.equal(row.dataset.state, 'stalled');
	assert.match(row.querySelector('.bui-status').textContent, /Blocked/);
	assert.equal(row.querySelector('.bui-step-reason').textContent, 'Conduict cannot reach the machine: its address is not admitted.');
	const details = row.querySelector('details.bui-details');
	assert.ok(details && !details.open, 'technical details are folded');
	assert.match(details.querySelector('.bui-details-text').textContent, /i\/o timeout/);
	assert.equal(details.querySelector('code').textContent, 'req_7Hq2');
	assert.equal(time(steps, 1), 'Took 2 min');
	steps.steps = blocked;
	assert.equal(steps.announced, 'Startup: Done. Connection to Conduict: Blocked', 'nothing new to say');
	steps.destroy();
});

test('Steps: an unknown state reads as waiting; a step without times shows none; Spanish copy', () => {
	const steps = new ui.Steps({ label: 'Pasos', steps: [{ label: 'Clonar', state: 'exploded' }, { label: 'Compilar', state: 'progress', since: at(0) }, { label: 'Publicar', state: 'failed', reason: 'Sin permiso' }], clock: clock(0.5), labels: ui.Steps.labels.es }).mount(document.body);
	const states = [...steps.element.querySelectorAll('.bui-step')].map(row => row.dataset.state);
	assert.deepEqual(states, ['waiting', 'progress', 'failed']);
	assert.equal(time(steps, 0), null);
	assert.equal(time(steps, 1), '30 s hasta ahora', 'no expected time: only how long it has run');
	assert.match(rows(steps)[2], /Falló/);
	assert.equal(steps.element.querySelector('.bui-step-reason').textContent, 'Sin permiso');
	assert.ok(Object.isFrozen(ui.Steps.labels.es));
	steps.destroy();
});

test('Steps: destroy releases its clock listener and its details', () => {
	const moving = clock(5);
	const steps = new ui.Steps({ label: 'Preparing', steps: blocked, clock: moving }).mount(document.body);
	assert.equal(moving.size, 1);
	steps.destroy();
	assert.equal(moving.size, 0);
	assert.equal(document.body.children.length, 0);
	moving.at(30);
});

test('Freshness: the state in words with "Checked … ago" kept current by the clock', () => {
	const moving = clock(0);
	const fresh = new ui.Freshness({ label: 'Running', tone: 'success', checked: at(0), clock: moving }).mount(document.body);
	assert.equal(fresh.text, 'Running · Checked just now');
	assert.ok(fresh.element.querySelector('.bui-status-success'));
	moving.at(2);
	assert.equal(fresh.text, 'Running · Checked 2 min ago');
	moving.at(90);
	assert.equal(fresh.text, 'Running · Checked 2 h ago');
	fresh.update({ label: 'Stopped', tone: 'neutral', checked: at(90) });
	assert.equal(fresh.text, 'Stopped · Checked just now');
	fresh.destroy();
	assert.equal(moving.size, 0);
});

test('Freshness: disconnected, the last known form with a neutral dot and its time; reconnected, the live form again', () => {
	const moving = clock(10);
	const fresh = new ui.Freshness({ label: 'Running', tone: 'success', checked: at(0), connected: false, clock: moving }).mount(document.body);
	const local = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(start));
	assert.equal(fresh.text, `Last known: Running · ${local}`);
	assert.ok(fresh.stale && fresh.element.querySelector('.bui-status-neutral'), 'never the live color while disconnected');
	fresh.update({ checked: null });
	assert.equal(fresh.text, 'Last known: Running');
	fresh.update({ connected: true, checked: at(10) });
	assert.equal(fresh.text, 'Running · Checked just now');
	fresh.destroy();
	const spanish = new ui.Freshness({ label: 'En marcha', checked: at(0), clock: clock(3), labels: ui.Freshness.labels.es }).mount(document.body);
	assert.equal(spanish.text, 'En marcha · Comprobado hace 3 min');
	spanish.destroy();
});

test('Steps with announce: false has no live region of its own and keeps the words for the page to say (0.10.0)', () => {
	const moving = clock(3);
	const plan = new ui.Steps({ label: 'Plan', steps: preparing, clock: moving, announce: false }).mount(document.body);
	assert.equal(plan.element.querySelector('[aria-live]'), null, 'no region of its own');
	plan.steps = blocked;
	assert.match(plan.announced, /Startup: Done/, 'the words are kept for the page to say');
	assert.equal(document.querySelector('[aria-live]'), null, 'nothing is said');
	plan.destroy();
	const said = new ui.Steps({ label: 'Plan', steps: preparing, clock: moving }).mount(document.body);
	assert.equal(said.element.querySelector('.bui-announcer').getAttribute('aria-live'), 'polite', 'the default still says its changes');
	said.destroy();
});
