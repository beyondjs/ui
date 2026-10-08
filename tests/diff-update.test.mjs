import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Page } from './support/page.mjs';
import { Listeners } from './support/listeners.mjs';

/** Diff's data and lifecycle (0.11.2): files given split, updates that keep each file's open state and the focused header, and a destroy that releases every listener. */
const page = new Page();
const { Diff } = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());
const fixture = name => readFileSync(new URL(`./fixtures/diff/${name}.patch`, import.meta.url), 'utf8');
const brief = files => files.map(file => [file.path, file.status, file.added, file.removed]);
const file = (diff, path) => [...diff.element.querySelectorAll('.bui-diff-file')].find(node => node.dataset.path === path);

test('files: counts from lines when absent, given counts kept, status inferred, strings and objects as lines, unreadable parts counted', () => {
	const diff = new Diff({
		files: [
			{ path: 'src/a.js', hunks: [{ old: 1, new: 1, lines: [' a', '-b', '+B', { kind: 'add', text: 'c' }, '\\ No newline at end of file'] }] },
			{ path: 'src/new.js', hunks: [{ old: 0, new: 1, lines: ['+x', '+y'] }] },
			{ path: 'src/gone.js', hunks: [{ old: 1, new: 0, lines: ['-x'] }] },
			{ path: 'src/b.js', previous: 'src/old-b.js' },
			{ path: 'src/c.js', added: 7, removed: 2, hunks: [] },
			{ path: 'src/d.js', status: 'nonsense', hunks: [{ old: 'x', new: 1, lines: [] }, { old: 3, new: 3, lines: ['?odd', ' fine', { kind: 'other', text: 'z' }] }] },
			{ previous: 'no path' },
			null
		]
	});
	const files = diff.files;
	assert.deepEqual(brief(files), [['src/a.js', 'modified', 2, 1], ['src/new.js', 'added', 2, 0], ['src/gone.js', 'deleted', 0, 1], ['src/b.js', 'renamed', 0, 0], ['src/c.js', 'modified', 7, 2], ['src/d.js', 'modified', 0, 0]]);
	assert.equal(files[3].previous, 'src/old-b.js');
	assert.deepEqual(files[0].hunks[0].lines[4], { kind: 'note', text: 'No newline at end of file' });
	assert.equal(files[5].unread, 2, 'a hunk without numbers and a hunk with unreadable lines');
	assert.deepEqual(files[5].hunks[0].lines, [{ kind: 'context', text: 'fine' }]);
	assert.match(diff.element.querySelector('.bui-diff-top').textContent, /This part of the patch couldn’t be read/, 'files without a path are said at the top');
	files[0].path = 'changed';
	assert.equal(diff.files[0].path, 'src/a.js', 'the data is a copy');
	diff.destroy();
});

test('an update keeps each file’s open state by path and the focus on a header that still exists; new files take the default', () => {
	const diff = new Diff({ patch: fixture('git') }).mount(document.body);
	diff.close('docs/notes.md');
	const header = file(diff, 'old/legacy.txt').querySelector('.bui-diff-toggle');
	header.focus();
	diff.patch = fixture('git') + fixture('whitespace');
	assert.deepEqual([...diff.element.querySelectorAll('.bui-diff-file')].map(node => [node.dataset.path, node.hasAttribute('data-open')]), [['src/app.js', true], ['docs/notes.md', false], ['old/legacy.txt', true], ['src/format.js', true]]);
	const kept = file(diff, 'old/legacy.txt').querySelector('.bui-diff-toggle');
	assert.ok(kept !== header && document.activeElement === kept, 'the focus on the same file’s header');
	file(diff, 'src/app.js').querySelector('.bui-diff-lines').focus();
	diff.files = [{ path: 'src/app.js', hunks: [{ old: 1, new: 1, lines: ['-a', '+b'] }] }];
	assert.ok(document.activeElement === file(diff, 'src/app.js').querySelector('.bui-diff-toggle'), 'focus inside a file goes to its header');
	assert.deepEqual(brief(diff.files), [['src/app.js', 'modified', 1, 1]]);
	assert.equal(diff.element.querySelector('.bui-diff-total').textContent.startsWith('1 file changed'), true);
	diff.files = null;
	assert.equal(diff.element.querySelector('.bui-diff-top').textContent, 'No changes');
	diff.patch = 42;
	assert.deepEqual(diff.files, [], 'a patch that is not text is no change');
	diff.destroy();
});

test('destroy releases the keys and every file’s copy, removes the element and ignores later calls', () => {
	const listeners = new Listeners(page.window).install();
	try {
		const diff = new Diff({ patch: fixture('git') }).mount(document.body);
		assert.equal(diff.listeners.size, 1, 'one listener, on its own element');
		diff.destroy();
		assert.equal(diff.listeners.size, 0);
		assert.equal(document.querySelector('.bui-diff'), null);
		assert.deepEqual(listeners.present(), [], 'nothing left on the document or the window');
		diff.destroy();
		assert.equal(diff.open('src/app.js'), false, 'a destroyed diff has no files to open');
	} finally {
		listeners.uninstall();
	}
});
