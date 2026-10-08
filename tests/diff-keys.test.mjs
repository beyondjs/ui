import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Page } from './support/page.mjs';

/** Diff's behavior (0.11.2): keys between files and hunks, the budget with a large file drawn in chunks per frame, lazy folded files, updates that keep open state and focus, `files` given split, and a destroy that releases listeners and frames. */
const page = new Page();
const { Diff } = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());
const fixture = name => readFileSync(new URL(`./fixtures/diff/${name}.patch`, import.meta.url), 'utf8');
const mount = options => new Diff(options).mount(document.body);
const file = (diff, path) => [...diff.element.querySelectorAll('.bui-diff-file')].find(node => node.dataset.path === path);
const lines = (path, count, sign = '+') => ({ path, hunks: [{ old: sign === '+' ? 0 : 1, new: sign === '+' ? 1 : 0, lines: Array.from({ length: count }, (_, at) => `${sign}line ${at + 1}`) }] });

/** Animation frames the test runs one at a time. */
const frames = () => {
	const queue = new Map();
	let next = 0;
	const saved = [page.window.requestAnimationFrame, page.window.cancelAnimationFrame];
	page.window.requestAnimationFrame = callback => (queue.set((next += 1), callback), next);
	page.window.cancelAnimationFrame = id => queue.delete(id);
	return {
		get size() {
			return queue.size;
		},
		run() {
			const [[id, callback]] = queue;
			queue.delete(id);
			callback(0);
		},
		restore: () => ([page.window.requestAnimationFrame, page.window.cancelAnimationFrame] = saved)
	};
};

test('keys on a header: ArrowDown and ArrowUp move between files, Home and End to the first and last, without wrapping', () => {
	const diff = mount({ patch: fixture('git') });
	const headers = [...diff.element.querySelectorAll('.bui-diff-toggle')];
	headers[0].focus();
	assert.equal(page.key(headers[0], 'ArrowDown').defaultPrevented, true);
	assert.ok(document.activeElement === headers[1]);
	page.key(headers[1], 'End');
	assert.ok(document.activeElement === headers[2]);
	page.key(headers[2], 'ArrowDown');
	assert.ok(document.activeElement === headers[2], 'the last stays');
	page.key(headers[2], 'Home');
	assert.ok(document.activeElement === headers[0]);
	page.key(headers[0], 'ArrowUp');
	assert.ok(document.activeElement === headers[0], 'the first stays');
	assert.equal(page.key(headers[0], 'ArrowDown', { shiftKey: true }).defaultPrevented, false, 'Shift+ArrowDown is not the diff’s');
	assert.equal(page.key(headers[0], 'Enter').defaultPrevented, false, 'Enter stays the button’s');
	diff.destroy();
});

test('] and [ move between hunk headers across files, skipping folded ones; Alt+ArrowDown and Alt+ArrowUp move between files from anywhere; keys in a field are left to it', () => {
	const diff = mount({ patch: fixture('git') });
	const hunks = () => [...diff.element.querySelectorAll('.bui-diff-hunk')];
	const headers = [...diff.element.querySelectorAll('.bui-diff-toggle')];
	headers[0].focus();
	page.key(headers[0], ']');
	assert.ok(document.activeElement === hunks()[0]);
	page.key(document.activeElement, ']');
	assert.ok(document.activeElement === hunks()[1]);
	diff.close('docs/notes.md');
	page.key(document.activeElement, ']');
	assert.ok(document.activeElement === file(diff, 'old/legacy.txt').querySelector('.bui-diff-hunk'), 'the folded file is skipped');
	page.key(document.activeElement, ']');
	assert.ok(document.activeElement === file(diff, 'old/legacy.txt').querySelector('.bui-diff-hunk'), 'none after the last');
	page.key(document.activeElement, '[');
	assert.ok(document.activeElement === hunks()[1]);
	const box = file(diff, 'src/app.js').querySelector('.bui-diff-lines');
	box.focus();
	assert.equal(page.key(box, 'ArrowDown', { altKey: true }).defaultPrevented, true);
	assert.ok(document.activeElement === headers[1], 'the next file from inside the lines');
	page.key(headers[1], 'ArrowUp', { altKey: true });
	assert.ok(document.activeElement === headers[0]);
	box.focus();
	assert.equal(page.key(box, 'ArrowDown').defaultPrevented, false, 'a plain arrow scrolls the lines');
	const field = document.createElement('input');
	file(diff, 'src/app.js').querySelector('.bui-diff-body').append(field);
	field.focus();
	for (const [key, options] of [[']'], ['['], ['ArrowDown', { altKey: true }]]) assert.equal(page.key(field, key, options).defaultPrevented, false, `${key} typed in a field`);
	assert.ok(document.activeElement === field);
	assert.equal(page.key(headers[0], ']', { ctrlKey: true }).defaultPrevented, false);
	diff.destroy();
});

test('the budget: files open while their running total fits; a file over the per-file budget starts folded; open: all and none', () => {
	const saved = Diff.budget;
	Diff.budget = { lines: 10, file: 6 };
	try {
		const files = [lines('a.txt', 4), lines('large.txt', 7), lines('b.txt', 4), lines('c.txt', 4), lines('d.txt', 1)];
		const diff = mount({ files });
		assert.deepEqual([...diff.element.querySelectorAll('.bui-diff-file')].map(node => node.hasAttribute('data-open')), [true, false, true, false, false]);
		assert.equal(file(diff, 'c.txt').querySelectorAll('.bui-diff-line').length, 0, 'a folded file holds no line nodes');
		assert.equal(file(diff, 'c.txt').querySelector('.bui-diff-body').childNodes.length, 0, 'nor anything else until it opens');
		diff.open('c.txt');
		assert.equal(file(diff, 'c.txt').querySelectorAll('.bui-diff-line').length, 4);
		diff.open('large.txt');
		const large = file(diff, 'large.txt').querySelector('.bui-diff-large');
		assert.equal(large.firstChild.textContent, 'Large diff · 7 lines');
		assert.equal(file(diff, 'large.txt').querySelectorAll('.bui-diff-line').length, 0);
		const all = mount({ files, open: 'all' });
		assert.equal(all.element.querySelectorAll('.bui-diff-file[data-open]').length, 5);
		assert.ok(file(all, 'large.txt').querySelector('.bui-diff-large'), 'a large file still asks before drawing');
		const none = mount({ files, open: 'none' });
		assert.equal(none.element.querySelectorAll('.bui-diff-file[data-open], .bui-diff-line').length, 0);
		for (const view of [diff, all, none]) view.destroy();
	} finally {
		Diff.budget = saved;
	}
});

test('Show on a large file draws its rows in chunks of Diff.chunk per animation frame, focus kept in its lines; a destroyed diff stops drawing', async () => {
	const queue = frames();
	try {
		const diff = mount({ files: [lines('huge.txt', 1300)] });
		const node = file(diff, 'huge.txt');
		assert.ok(!node.hasAttribute('data-open'), 'over 600 lines starts folded');
		node.querySelector('.bui-diff-toggle').click();
		const show = node.querySelector('.bui-diff-large button');
		assert.equal(show.textContent, 'Show');
		assert.equal(node.querySelector('.bui-diff-large').firstChild.textContent, 'Large diff · 1,300 lines');
		show.focus();
		show.click();
		const box = node.querySelector('.bui-diff-lines');
		const rows = () => box.querySelector('.bui-diff-rows').children.length;
		assert.equal(rows(), 500, 'the first chunk at once');
		assert.equal(box.getAttribute('aria-busy'), 'true');
		assert.ok(document.activeElement === box, 'focus moves to the lines');
		assert.equal(queue.size, 1);
		queue.run();
		assert.equal(rows(), 1000);
		queue.run();
		assert.equal(rows(), 1301, 'every line and the hunk header');
		assert.equal(queue.size, 0);
		assert.equal(box.hasAttribute('aria-busy'), false);
		const again = mount({ files: [lines('huge.txt', 1300)], open: 'all' });
		file(again, 'huge.txt').querySelector('.bui-diff-large button').click();
		assert.equal(queue.size, 1);
		again.destroy();
		assert.equal(queue.size, 0, 'the next frame is cancelled');
		diff.destroy();
	} finally {
		queue.restore();
	}
});
