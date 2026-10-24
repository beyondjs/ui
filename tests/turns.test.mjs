import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { Listeners } from './support/listeners.mjs';
import { turns, place } from './fixtures/turns.mjs';
import { spoken } from './fixtures/lanes.mjs';

/**
 * `TurnIndex` (0.29.0, D182): a thread's index of its turns. Its marks and their names, patching by key
 * with focus kept, the roving keyboard, the turn being read and its opening message out of view, the
 * page's Option/Alt keys, choosing, the preview and its description, and its Spanish copy.
 */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => {
	page.reset();
	document.documentElement.style.scrollPaddingTop = '100px';
	Object.defineProperty(document.documentElement, 'scrollHeight', { value: 5000, configurable: true });
});

const make = (options = {}) => new ui.TurnIndex(options).mount(document.body);
const marks = index => [...index.element.querySelectorAll('.bui-turns-mark')];
const alt = (key, options = {}) => page.key(document.body, key, { altKey: true, ...options });

test('a navigation named Turns holds one link per turn, named by its message and its state; hidden below two turns', () => {
	const index = make();
	assert.equal(index.element.tagName, 'NAV');
	assert.equal(index.element.getAttribute('aria-label'), 'Turns');
	index.update({ turns: turns().slice(0, 1) });
	assert.equal(index.element.hidden, true, 'one turn has nothing to move between');
	index.update({ turns: turns() });
	assert.equal(index.element.hidden, false);
	assert.deepEqual(index.keys, ['t1', 't2', 't3', 't4', 't5']);
	const [first, , third, fourth, fifth] = marks(index);
	assert.equal(first.tagName, 'A');
	assert.equal(first.getAttribute('href'), '#/conversations/c1?turn=t1');
	assert.equal(spoken(first), 'Make the composer quieter');
	assert.equal(spoken(third), 'Run the composer tests, Needs you', 'the product\'s word for its state');
	assert.equal(spoken(fourth), 'Benchmark the cache with the large fixture, Failed', 'the index\'s own word without one');
	assert.equal(spoken(fifth), 'Ship it, Running');
	assert.equal(first.querySelector('.bui-turns-dash').getAttribute('aria-hidden'), 'true');
	assert.equal(first.querySelector('.bui-turns-state').hidden, true, 'a plain turn is a dash alone');
	assert.ok(third.querySelector('.bui-turns-state').classList.contains('bui-status-attention'), 'needs you: a diamond');
	assert.ok(fourth.querySelector('.bui-turns-state').classList.contains('bui-status-failure'), 'failed: a square');
	assert.ok(fifth.querySelector('.bui-turns-state').classList.contains('bui-status-progress'), 'running: a half-filled circle');
	index.update({ label: 'Turns of this conversation' });
	assert.equal(index.element.getAttribute('aria-label'), 'Turns of this conversation');
	index.destroy();
	assert.equal(document.querySelector('.bui-turns'), null);
});

test('patched by key: a mark that stays keeps its control and focus; the focused one that leaves hands focus on', () => {
	const index = make();
	index.update({ turns: turns() });
	const before = marks(index);
	before[1].focus();
	index.update({ turns: turns().reverse() });
	assert.deepEqual(index.keys, ['t5', 't4', 't3', 't2', 't1']);
	assert.ok(marks(index).includes(before[1]) && document.activeElement === before[1], 'same control, focus kept');
	index.update({ turns: turns().reverse().filter(turn => turn.key !== 't2') });
	assert.ok(document.activeElement === marks(index)[3], 'its place keeps the keyboard');
	const plain = turns({ links: false });
	marks(index)[0].focus();
	assert.equal(spoken(document.activeElement), 'Ship it, Running');
	index.update({ turns: plain });
	const button = marks(index)[4];
	assert.equal(button.tagName, 'BUTTON', 'without an address a mark is a button');
	assert.ok(document.activeElement === button, 'and takes the focus its link held, in its new place');
	index.destroy();
});

test('one mark in the tab order; ArrowUp, ArrowDown, Home and End move within the index without wrapping', () => {
	const index = make();
	index.update({ turns: turns() });
	const list = marks(index);
	assert.deepEqual(list.map(mark => mark.getAttribute('tabindex')), ['0', '-1', '-1', '-1', '-1']);
	list[0].focus();
	page.key(list[0], 'ArrowUp');
	assert.ok(document.activeElement === list[0], 'no wrap');
	page.key(list[0], 'ArrowDown');
	assert.ok(document.activeElement === list[1]);
	page.key(list[1], 'End');
	assert.ok(document.activeElement === list[4]);
	assert.deepEqual(list.map(mark => mark.getAttribute('tabindex')), ['-1', '-1', '-1', '-1', '0']);
	page.key(list[4], 'Home');
	assert.ok(document.activeElement === list[0]);
	index.destroy();
});

test('the turn being read is the one under the sticky edge, current in the index; its message out of view is said once', () => {
	const seen = [];
	const index = make({ onview: turn => seen.push(turn) });
	const tops = [-1400, -800, 160, 700, 1300];
	index.update({ turns: place(turns(), tops, document) });
	assert.deepEqual(seen.at(-1), { key: 't2', covered: true }, 't3 starts below the 100 px edge: t2 is read, its message far above');
	assert.equal(index.current, 't2');
	assert.equal(marks(index)[1].getAttribute('aria-current'), 'true');
	assert.equal(marks(index)[1].getAttribute('tabindex'), '0', 'the turn being read takes the tab order');
	const count = seen.length;
	index.measure();
	assert.equal(seen.length, count, 'reported only when it changed');
	tops.splice(0, 5, -2000, -1400, 100, 700, 1300);
	index.measure();
	assert.deepEqual(seen.at(-1), { key: 't3', covered: false }, 'a turn at the edge is read, its message still in view');
	tops.splice(0, 5, -2000, -1400, -100, 700, 1300);
	index.measure();
	assert.deepEqual(seen.at(-1), { key: 't3', covered: true }, 'its message went under the edge');
	Object.defineProperty(page.window, 'scrollY', { value: 4300, configurable: true });
	index.measure();
	assert.deepEqual(seen.at(-1).key, 't5', 'at the end of the page the last turn is read');
	Object.defineProperty(page.window, 'scrollY', { value: 0, configurable: true });
	index.destroy();
});

test('Option/Alt with the arrows moves between turns from the page, back to the message first, never while writing', () => {
	const chosen = [];
	const index = make({ choose: (key, how) => chosen.push([key, how]) });
	const tops = [-1400, -800, 160, 700, 1300];
	index.update({ turns: place(turns(), tops, document) });
	assert.equal(alt('ArrowUp').defaultPrevented, true);
	assert.deepEqual(chosen.at(-1), ['t2', 'key'], 't2\'s message is out of view: back to it first');
	tops.splice(0, 5, -600, 80, 700, 1300, 1900);
	index.measure();
	alt('ArrowUp');
	assert.deepEqual(chosen.at(-1), ['t1', 'key'], 'with the message in view, the previous turn');
	alt('ArrowDown');
	alt('ArrowDown');
	assert.deepEqual(chosen.slice(-2), [['t2', 'key'], ['t3', 'key']], 'a second press moves on from the first one\'s turn, before the page has scrolled');
	assert.equal(index.current, 't3');
	const field = document.createElement('textarea');
	document.body.append(field);
	const count = chosen.length;
	assert.equal(page.key(field, 'ArrowUp', { altKey: true }).defaultPrevented, false, 'the field keeps its keys');
	alt('ArrowDown', { ctrlKey: true });
	alt('ArrowDown', { shiftKey: true });
	page.key(document.body, 'ArrowDown');
	assert.equal(chosen.length, count, 'only Option/Alt alone');
	index.destroy();
	alt('ArrowDown');
	assert.equal(chosen.length, count, 'a destroyed index hears no key');
});

test('with no turn read yet, as for turns given without their elements, the next turn is the first and the previous the last', () => {
	const chosen = [];
	const index = make({ choose: (key, how) => chosen.push([key, how]) });
	index.update({ turns: turns() });
	assert.equal(index.current, null);
	assert.equal(index.move(1), true);
	assert.deepEqual(chosen.at(-1), ['t1', 'key']);
	assert.equal(index.move(1), true);
	assert.deepEqual(chosen.at(-1), ['t2', 'key'], 'and on from there');
	const other = make({ choose: (key, how) => chosen.push([key, how]) });
	other.update({ turns: turns() });
	assert.equal(other.move(-1), true);
	assert.deepEqual(chosen.at(-1), ['t5', 'key']);
	index.destroy();
	other.destroy();
});

test('without choose: the keys replace the address with the turn\'s; a mark without an address scrolls to its turn', () => {
	const index = make();
	index.update({ turns: place(turns(), [-1400, -800, 160, 700, 1300], document) });
	const replaced = [];
	const location = page.window.location;
	const replace = location.replace;
	location.replace = href => replaced.push(href);
	try {
		alt('ArrowDown');
	} finally {
		location.replace = replace;
	}
	assert.deepEqual(replaced, ['#/conversations/c1?turn=t3']);
	const plain = place(turns({ links: false }), [-1400, -800, 160, 700, 1300], document);
	const scrolled = [];
	for (const turn of plain) turn.element.scrollIntoView = options => scrolled.push([turn.key, options.block]);
	index.update({ turns: plain });
	marks(index)[3].click();
	assert.deepEqual(scrolled, [['t4', 'start']]);
	index.destroy();
});

test('the preview: focus or the pointer shows the turn beside the index, describes its mark, and Escape hides it', () => {
	const index = make();
	index.update({ turns: turns() });
	const preview = document.querySelector('.bui-turns-preview');
	assert.ok(preview && preview.hidden, 'one preview, hidden');
	assert.equal(preview.getAttribute('role'), 'tooltip');
	const [first, , third] = marks(index);
	first.focus();
	assert.equal(preview.hidden, false);
	assert.equal(preview.querySelector('.bui-turns-preview-title').textContent, 'Make the composer quieter');
	assert.equal(preview.querySelector('.bui-turns-preview-summary').textContent, 'Send is quiet while the field is empty, and a press puts the caret in it.');
	assert.equal(preview.querySelector('.bui-turns-preview-facts').textContent, 'Changed 2 files · 12:01 · 1 min 5 s');
	assert.match(preview.querySelector('.bui-turns-preview-keys').textContent, /^(⌥|Alt\+)↑(⌥|Alt\+)↓Previous and next turn$/);
	assert.ok(first.getAttribute('aria-describedby').includes(preview.id));
	third.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse' }));
	assert.equal(preview.querySelector('.bui-turns-preview-title').textContent, 'Run the composer tests');
	assert.equal(preview.querySelector('.bui-turns-preview-facts').textContent, 'Needs you · 12:06', 'its state in words, then its facts');
	assert.ok(!first.hasAttribute('aria-describedby'), 'only the mark it shows is described');
	assert.deepEqual(marks(index).map(mark => mark.dataset.near ?? null), ['2', '1', '0', '1', '2'], 'the mark under the pointer and its neighbours lengthen');
	page.key(document.body, 'Escape');
	assert.equal(preview.hidden, true);
	index.element.querySelector('.bui-turns-list').dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
	assert.deepEqual(marks(index).map(mark => mark.dataset.near ?? null), [null, null, null, null, null]);
	assert.equal(preview.hidden, true, 'what Escape hid stays hidden when the pointer leaves');
	third.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse' }));
	index.element.querySelector('.bui-turns-list').dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
	assert.equal(preview.querySelector('.bui-turns-preview-title').textContent, 'Make the composer quieter', 'a shown preview follows the focused mark when the pointer leaves');
	first.blur();
	page.key(document.body, 'Escape');
	third.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'touch' }));
	assert.equal(preview.hidden, true, 'a touch chooses; it is no hover');
	index.destroy();
	assert.equal(document.querySelector('.bui-turns-preview'), null);
});

test('without the page\'s keys the preview names none; Spanish copy', () => {
	const index = make({ keys: false, labels: ui.TurnIndex.labels.es });
	const list = turns();
	list[2].stateLabel = null;
	index.update({ turns: list });
	assert.equal(index.element.getAttribute('aria-label'), 'Turnos');
	assert.equal(spoken(marks(index)[2]), 'Run the composer tests, Te necesita');
	marks(index)[0].focus();
	assert.equal(document.querySelector('.bui-turns-preview-keys'), null);
	assert.equal(alt('ArrowDown').defaultPrevented, false, 'the page\'s keys are not taken');
	assert.deepEqual(Object.keys(ui.TurnIndex.labels.en).sort(), Object.keys(ui.TurnIndex.labels.es).sort());
	assert.equal(ui.TurnIndex.labels.es.keys, 'Turno anterior y siguiente');
	index.destroy();
});

test('a destroyed index leaves no listener on the window or the document', async () => {
	const listeners = new Listeners(page.window).install();
	try {
		const before = listeners.present();
		const index = make();
		index.update({ turns: turns() });
		assert.ok(listeners.present().includes('window:scroll') && listeners.present().includes('document:keydown'));
		index.destroy();
		assert.deepEqual(listeners.present(), before);
	} finally {
		listeners.uninstall?.();
	}
});
