import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Page } from './support/page.mjs';
import { crew } from './fixtures/lanes.mjs';

/**
 * A title's room first in `Lanes` (0.41.0): `LaneRoom` folds the block's trace, then its kind, only while a
 * title would be cut, keeps the first fold that lets every title show whole, folds nothing under 40rem or
 * for a column the block does not have, and measures again from nothing only when the block's width (as drawn,
 * fractions included) or its lanes' words change, or when asked. happy-dom draws
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
	element.getBoundingClientRect = () => ({ width, height: 40, top: 0, left: 0, right: width, bottom: 40 });
	const asked = [];
	const cut = () => {
		const fold = element.dataset.fold ?? '';
		asked.push(fold);
		return until === null ? fold !== 'never' : !fold.split(' ').includes(until);
	};
	return { element, asked, room: new LaneRoom(element, { cut, said: () => 'Explore the auth module|Explore' }) };
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

test('measures again when the width or the words change, or once asked, and only then', () => {
	let cut = true;
	let width = 900;
	let words = 'Explore the auth module|Explore';
	let asked = 0;
	const element = document.body.appendChild(document.createElement('div'));
	element.setAttribute('data-trace', '');
	element.setAttribute('data-kind', '');
	element.getBoundingClientRect = () => ({ width, height: 40 });
	const room = new LaneRoom(element, { cut: () => (asked++, cut), said: () => words });
	room.fit();
	assert.equal(element.dataset.fold, 'trace kind');
	const first = asked;
	cut = false;
	room.fit();
	assert.deepEqual([element.dataset.fold, asked], ['trace kind', first], 'nothing changed: nothing measured, the fold kept');
	width = 960.5;
	room.fit();
	assert.equal(element.hasAttribute('data-fold'), false, 'a wider block, a fractional width: measured from nothing folded');
	cut = true;
	words = 'Explore how the session lease is renewed|Explore';
	room.fit();
	assert.equal(element.dataset.fold, 'trace kind', 'new words: measured again');
	cut = false;
	room.fit(true);
	assert.equal(element.hasAttribute('data-fold'), false, 'asked again, as when the fonts arrive');
	element.remove();
	cut = true;
	width = 1000;
	room.fit();
	assert.equal(element.hasAttribute('data-fold'), false, 'a block out of the document folds nothing');
	room.destroy();
});

test('measures again when a column comes or what a lane says beyond its title changes: its facts, its depth', () => {
	let cut = false;
	let said = 'explore|0|Explore the auth module|Explore|';
	const element = document.body.appendChild(document.createElement('div'));
	element.setAttribute('data-trace', '');
	element.setAttribute('data-kind', '');
	element.getBoundingClientRect = () => ({ width: 900, height: 40 });
	const room = new LaneRoom(element, { cut: () => cut, said: () => said });
	room.fit();
	assert.equal(element.hasAttribute('data-fold'), false);
	cut = true;
	element.setAttribute('data-facts', '');
	room.fit();
	assert.equal(element.dataset.fold, 'trace kind', 'a facts column arrived: measured again');
	cut = false;
	said = 'explore|0|Explore the auth module|Explore|48k tokens';
	room.fit();
	assert.equal(element.hasAttribute('data-fold'), false, 'only the facts changed: measured again');
	cut = true;
	said = 'explore|1|Explore the auth module|Explore|48k tokens';
	room.fit();
	assert.equal(element.dataset.fold, 'trace kind', 'only the depth changed: measured again');
	room.destroy();
	element.remove();
});

test('a lane says its depth and its title\'s, kind\'s and facts\' words; facts arriving change it', async () => {
	const { Lane } = await import('../src/dom/lanes/lane.js');
	const { Labels } = await import('../src/dom/core/labels.js');
	const { LaneWords } = await import('../src/dom/lanes/words.js');
	const labels = new Labels(ui.Lanes.labels.en, {});
	const lane = new Lane('explore', { labels, words: new LaneWords(labels, 'en'), now: () => Date.now() });
	const [first] = crew();
	const place = { depth: 0, branch: null, through: [] };
	lane.update({ ...first, facts: [] }, place);
	const before = lane.said;
	assert.match(before, /Explore the auth module/);
	lane.update({ ...first, facts: [{ text: '48k', label: 'tokens' }] }, place);
	assert.notEqual(lane.said, before, 'facts arriving change what it says');
	assert.match(lane.said, /48k/);
	const facted = lane.said;
	lane.update({ ...first, facts: [{ text: '48k', label: 'tokens' }] }, { depth: 1, branch: 'last', through: [] });
	assert.notEqual(lane.said, facted, 'a new depth changes what it says');
	lane.destroy();
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
