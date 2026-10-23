import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { start, crew, spoken } from './fixtures/lanes.mjs';

/**
 * `Lanes` (0.22.0): concurrent work as lanes on one time axis. Its structure and names, the states and
 * their marks, depth under a tree connector, patching by key with focus and identity kept, the product's
 * order, the roving keyboard, choosing, the current lane, and the group's name and trace column.
 */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const clock = (at = start + 102_000) => new ui.Clock({ now: () => at });
const make = (options = {}) => new ui.Lanes({ label: 'Subagents of this turn', clock: clock(), locale: 'en', ...options }).mount(document.body);
const buttons = lanes => [...lanes.element.querySelectorAll('button.bui-lane')];

test('a group named by its label holds one button per lane, in the given order, its cells in the shared columns', () => {
	const lanes = make();
	lanes.update({ lanes: crew() });
	assert.equal(lanes.element.getAttribute('role'), 'group');
	assert.equal(lanes.element.getAttribute('aria-label'), 'Subagents of this turn');
	const [first, second] = buttons(lanes);
	assert.deepEqual(lanes.keys, ['explore', 'map', 'plan', 'index', 'fix', 'bench']);
	assert.equal(first.type, 'button');
	assert.deepEqual([...first.children].map(node => node.className), ['bui-lane-head', 'bui-lane-kind', 'bui-lane-now', 'bui-lane-time', 'bui-lane-facts', 'bui-lane-trace', '']);
	assert.equal(first.querySelector('.bui-lane-mark').getAttribute('aria-hidden'), 'true', 'the mark is not read');
	assert.equal(first.querySelector('.bui-lane-trace').getAttribute('aria-hidden'), 'true', 'the trace is not read');
	assert.equal(spoken(first), 'Working, Explore the auth module, Explore, Reading src/auth/session.ts, 1 min 42 s, 48k tokens', 'the state word first, then a sentence');
	assert.equal(spoken(second), 'Finished, Map the payments API, Explore, Finished · 31 steps, 2 min 5 s, 61k');
	const description = document.getElementById(first.getAttribute('aria-describedby'));
	assert.equal(description.textContent, 'Started 10:42:05', 'the start is the lane\'s description');
	assert.ok(description.hidden && first.contains(description));
	assert.ok(lanes.element.hasAttribute('data-kind') && lanes.element.hasAttribute('data-facts') && lanes.element.hasAttribute('data-trace'));
	lanes.destroy();
	assert.equal(document.querySelector('.bui-lanes'), null);
});

test('each state takes the shape and hue of a Status state, never pulsing; a missing word is the family\'s', () => {
	const lanes = make();
	const states = ['running', 'waiting', 'done', 'failed', 'stopped', 'unknown', 'exploded'];
	lanes.update({ lanes: states.map(state => ({ key: state, state, title: state, since: start })) });
	const tones = buttons(lanes).map(button => [button.dataset.state, button.dataset.tone, button.querySelector('.bui-lane-mark').className.split(' ').at(-1)]);
	assert.deepEqual(tones, [
		['running', 'progress', 'bui-status-progress'],
		['waiting', 'attention', 'bui-status-attention'],
		['done', 'success', 'bui-status-success'],
		['failed', 'failure', 'bui-status-failure'],
		['stopped', 'idle', 'bui-status-idle'],
		['unknown', 'unknown', 'bui-status-unknown'],
		['unknown', 'unknown', 'bui-status-unknown']
	]);
	assert.deepEqual(buttons(lanes).map(button => button.querySelector('.bui-lane-head > .bui-hidden').textContent), ['Running', 'Waiting', 'Done', 'Failed', 'Stopped', 'Unknown', 'Unknown']);
	assert.deepEqual([...ui.Lanes.states], ['running', 'waiting', 'done', 'failed', 'stopped', 'unknown']);
	lanes.update({ lanes: [{ key: 'running', state: 'failed', stateLabel: 'Falló', title: 'running' }] });
	const [only] = buttons(lanes);
	assert.equal(only.dataset.tone, 'failure', 'a state patched in place');
	assert.equal(only.querySelector('.bui-lane-head > .bui-hidden').textContent, 'Falló');
	lanes.destroy();
});

test('depth indents a lane under a tree connector: ├ while a sibling follows, └ for the last, │ where a level continues', () => {
	const lanes = make();
	const depths = [['a', 0], ['b', 1], ['c', 2], ['d', 1], ['e', 0], ['f', 7], ['g', -2], ['h', 'x']];
	lanes.update({ lanes: depths.map(([key, depth]) => ({ key, depth, state: 'done', title: key })) });
	const drawn = buttons(lanes).map(button => [button.dataset.key, button.dataset.depth, button.style.getPropertyValue('--bui-lane-depth'), button.dataset.branch ?? null, button.dataset.through ?? null]);
	assert.deepEqual(drawn, [
		['a', '0', '0', null, null],
		['b', '1', '1', 'middle', null],
		['c', '2', '2', 'last', '1'],
		['d', '1', '1', 'last', null],
		['e', '0', '0', null, null],
		['f', '3', '3', 'last', null],
		['g', '0', '0', null, null],
		['h', '0', '0', null, null]
	]);
	lanes.update({ lanes: [{ key: 'a', depth: 0 }, { key: 'b', depth: 1 }, { key: 'c', depth: 2 }, { key: 'd', depth: 3 }, { key: 'e', depth: 2 }, { key: 'f', depth: 1 }] });
	const [, , , deepest] = buttons(lanes);
	assert.equal(deepest.dataset.through, '1 2', 'two levels continue past it');
	lanes.destroy();
});

test('update patches by key: a lane that stays keeps its button and focus, a new one takes its place, nothing is rebuilt', () => {
	const lanes = make();
	lanes.update({ lanes: crew() });
	const before = buttons(lanes);
	const title = before[1].querySelector('.bui-lane-title');
	before[1].focus();
	const changed = crew().map(lane => (lane.key === 'map' ? { ...lane, now: 'Writing the report', facts: ['64k'] } : lane));
	lanes.update({ lanes: [...changed, { key: 'late', state: 'running', title: 'A late subagent', since: start + 90_000 }] });
	const after = buttons(lanes);
	before.forEach((button, index) => assert.ok(after[index] === button, `lane ${index} kept its button`));
	assert.ok(after[1].querySelector('.bui-lane-title') === title, 'an unchanged cell is not rewritten');
	assert.ok(document.activeElement === before[1], 'focus stays on the patched lane');
	assert.equal(after[1].querySelector('.bui-lane-now').textContent, ', Writing the report');
	assert.equal(after.at(-1).dataset.key, 'late', 'a new lane is appended in the order given');
	lanes.update({ lanes: changed.filter(lane => lane.key !== 'map') });
	assert.ok(document.activeElement === buttons(lanes)[1], 'a removed lane that held focus hands it to the lane now in its place');
	assert.equal(document.activeElement.dataset.key, 'plan');
	lanes.destroy();
});

test('the order is the product\'s, never sorted; keys are taken once and lanes without a key are skipped', () => {
	const lanes = make();
	lanes.update({ lanes: crew().reverse() });
	assert.deepEqual(lanes.keys, ['bench', 'fix', 'index', 'plan', 'map', 'explore']);
	lanes.update({ lanes: [{ key: 'b', title: 'B' }, null, { title: 'no key' }, { key: 'a', title: 'A' }, { key: 'b', title: 'again' }, { key: 3, title: 'three' }] });
	assert.deepEqual(lanes.keys, ['b', 'a', '3']);
	assert.equal(buttons(lanes)[0].querySelector('.bui-lane-title').textContent, ', B', 'the first lane of a key wins');
	lanes.destroy();
});

test('one lane in the tab order; ↑ and ↓ move, Home and End jump, without wrapping; modified keys are left alone', () => {
	const lanes = make();
	lanes.update({ lanes: crew() });
	const tabs = () => buttons(lanes).map(button => button.getAttribute('tabindex'));
	assert.deepEqual(tabs(), ['0', '-1', '-1', '-1', '-1', '-1'], 'the first lane when none is current');
	const all = buttons(lanes);
	all[0].focus();
	assert.ok(page.key(all[0], 'ArrowDown').defaultPrevented);
	assert.ok(document.activeElement === all[1]);
	assert.deepEqual(tabs(), ['-1', '0', '-1', '-1', '-1', '-1'], 'the tab order follows focus');
	page.key(all[1], 'End');
	assert.ok(document.activeElement === all[5]);
	assert.ok(page.key(all[5], 'ArrowDown').defaultPrevented, 'the last lane keeps focus: no wrap');
	assert.ok(document.activeElement === all[5]);
	page.key(all[5], 'Home');
	assert.ok(document.activeElement === all[0]);
	page.key(all[0], 'ArrowUp');
	assert.ok(document.activeElement === all[0], 'nor at the first');
	assert.equal(page.key(all[0], 'ArrowDown', { altKey: true }).defaultPrevented, false);
	assert.equal(page.key(all[0], 'Enter').defaultPrevented, false, 'Enter is the button\'s own');
	assert.equal(page.key(all[0], 'Tab').defaultPrevented, false, 'Tab leaves the group');
	lanes.destroy();
});

test('pressing a lane calls choose with its key; focus(key) moves the roving focus; a destroyed block calls nothing', () => {
	const chosen = [];
	const lanes = make({ choose: (key, event) => chosen.push([key, event.type]) });
	lanes.update({ lanes: crew() });
	const all = buttons(lanes);
	all[2].click();
	all[2].querySelector('.bui-lane-title').click();
	assert.deepEqual(chosen, [['plan', 'click'], ['plan', 'click']], 'a press anywhere on the lane');
	assert.equal(lanes.focus('fix'), true);
	assert.ok(document.activeElement === all[4]);
	assert.equal(all[4].getAttribute('tabindex'), '0');
	assert.equal(lanes.focus('nothing'), false);
	lanes.destroy();
	all[1].click();
	assert.equal(chosen.length, 2);
	assert.equal(lanes.focus('fix'), false);
});

test('the current lane is aria-current and takes the tab order while focus is elsewhere', () => {
	const lanes = make();
	const current = key => crew().map(lane => ({ ...lane, current: lane.key === key }));
	lanes.update({ lanes: current('plan') });
	const all = buttons(lanes);
	assert.deepEqual(all.map(button => button.getAttribute('aria-current')), [null, null, 'true', null, null, null]);
	assert.equal(all[2].getAttribute('tabindex'), '0');
	all[0].focus();
	lanes.update({ lanes: current('fix') });
	assert.ok(document.activeElement === all[0], 'a new current lane takes no focus');
	assert.equal(all[0].getAttribute('tabindex'), '0', 'the focused lane keeps the tab order');
	all[0].blur();
	lanes.update({ lanes: current('fix') });
	assert.equal(all[4].getAttribute('tabindex'), '0', 'focus elsewhere: the current lane');
	lanes.update({ lanes: current(null) });
	assert.ok(all.every(button => !button.hasAttribute('aria-current')));
	lanes.destroy();
});

test('label and trace change in place; an empty label falls back to the group\'s name; no trace, no trace column', () => {
	const lanes = make({ trace: false, label: '' });
	lanes.update({ lanes: [{ key: 'a', state: 'done', title: 'A', since: start, until: start + 1000 }] });
	assert.equal(lanes.element.getAttribute('aria-label'), 'Work in parallel');
	assert.equal(lanes.element.hasAttribute('data-trace'), false);
	assert.equal(lanes.element.hasAttribute('data-kind') || lanes.element.hasAttribute('data-facts'), false, 'no kind and no facts: no columns for them');
	const [button] = buttons(lanes);
	lanes.update({ label: 'Jobs of this delivery', trace: true });
	assert.equal(lanes.element.getAttribute('aria-label'), 'Jobs of this delivery');
	assert.ok(lanes.element.hasAttribute('data-trace'));
	assert.ok(buttons(lanes)[0] === button, 'the lanes stay');
	lanes.destroy();
	assert.equal(lanes.update({ lanes: [] }), lanes, 'a destroyed block ignores updates');
});
