import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Page } from './support/page.mjs';
import { crew } from './fixtures/lanes.mjs';

/**
 * A title's room first in `Lanes` (0.41.0): `LaneRoom` folds the block's trace, then its kind, only while a
 * title would be cut, keeps the first fold that lets every title show whole, folds nothing under 40rem or
 * for a column the block does not have, and starts again from nothing at every measure. happy-dom draws
 * nothing, so the block's width and whether a title is cut are given here; the browser acceptance measures
 * them (`checks/laning.mjs`, "a title's room first").
 */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
const { LaneRoom } = await import('../src/dom/lanes/room.js');
after(() => page.close());
beforeEach(() => page.reset());

/** A block of a given width with the columns named, whose titles stay cut until the fold reaches `until`. */
function block({ width = 900, columns = ['trace', 'kind'], until = null } = {}) {
	const element = document.body.appendChild(document.createElement('div'));
	for (const column of columns) element.setAttribute(`data-${column}`, '');
	Object.defineProperty(element, 'clientWidth', { get: () => width });
	const asked = [];
	const titles = () => {
		const fold = element.dataset.fold ?? '';
		asked.push(fold);
		return until === null ? fold !== 'never' : !fold.split(' ').includes(until);
	};
	return { element, asked, room: new LaneRoom(element, titles) };
}

test('folds the trace first and stops once every title shows whole', () => {
	const { element, room } = block({ until: 'trace' });
	room.fit();
	assert.equal(element.dataset.fold, 'trace');
	room.destroy();
});

test('folds the kind after the trace while a title is still cut, and keeps the last fold when nothing more gives way', () => {
	const { element, room } = block({ until: 'kind' });
	room.fit();
	assert.equal(element.dataset.fold, 'trace kind');
	const always = block();
	always.room.fit();
	assert.equal(always.element.dataset.fold, 'trace kind', 'a title cut whatever folds: both columns folded, the title cut last');
	room.destroy();
	always.room.destroy();
});

test('folds nothing while every title shows whole, under 40rem, or for a column the block does not have', () => {
	const whole = block({ until: '' });
	whole.room.fit();
	assert.equal(whole.element.hasAttribute('data-fold'), false, 'every title whole');
	const narrow = block({ width: 600 });
	narrow.room.fit();
	assert.equal(narrow.element.hasAttribute('data-fold'), false, 'under 40rem the block has neither column');
	const kindless = block({ columns: ['trace'] });
	kindless.room.fit();
	assert.equal(kindless.element.dataset.fold, 'trace', 'no kind column to fold');
	const bare = block({ columns: [] });
	bare.room.fit();
	assert.equal(bare.element.hasAttribute('data-fold'), false, 'nothing to fold');
	for (const item of [whole, narrow, kindless, bare]) item.room.destroy();
});

test('measures from nothing folded every time, so a block that widened unfolds', () => {
	let cut = true;
	const element = document.body.appendChild(document.createElement('div'));
	element.setAttribute('data-trace', '');
	element.setAttribute('data-kind', '');
	Object.defineProperty(element, 'clientWidth', { get: () => 900 });
	const room = new LaneRoom(element, () => cut);
	room.fit();
	assert.equal(element.dataset.fold, 'trace kind');
	cut = false;
	room.fit();
	assert.equal(element.hasAttribute('data-fold'), false);
	element.remove();
	cut = true;
	room.fit();
	assert.equal(element.hasAttribute('data-fold'), false, 'a block out of the document folds nothing');
	room.destroy();
});

test('Lanes keeps its room: a lane says whether its title is cut, and destroying the block releases it', () => {
	const lanes = new ui.Lanes({ label: 'Subagents of this turn' }).mount(document.body);
	lanes.update({ lanes: crew() });
	assert.equal(lanes.element.hasAttribute('data-fold'), false, 'happy-dom cuts no title');
	lanes.update({ trace: false });
	assert.equal(lanes.element.hasAttribute('data-fold'), false);
	lanes.destroy();
});

test('the built stylesheet: a folded trace and kind take no track, and a folded kind stays readable', () => {
	const sheet = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8');
	assert.match(sheet, /\.bui-lanes\[data-fold~='trace'\]\s*\{\s*--bui-lanes-trace:\s*initial;/);
	assert.match(sheet, /\.bui-lanes\[data-fold~='trace'\] \.bui-lanes-trace\s*\{\s*display:\s*none;/);
	assert.match(sheet, /\.bui-lanes\[data-fold~='kind'\]\s*\{\s*--bui-lanes-kind:\s*initial;/);
	const kind = /\.bui-lanes\[data-fold~='kind'\] \.bui-lanes-kind\s*\{([^}]*)\}/.exec(sheet)?.[1] ?? '';
	assert.match(kind, /position:\s*absolute/);
	assert.match(kind, /clip:\s*rect\(0 0 0 0\)/);
	assert.doesNotMatch(kind, /display:\s*none/, 'still in the lane\'s name');
});
