import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/** Diff.parse (0.11.2): git's format and plain unified diffs read into files as data, counted, never thrown on; what cannot be read is counted. No DOM. */
const { Diff } = await import('@beyond-js/ui/dom');
const fixture = name => readFileSync(new URL(`./fixtures/diff/${name}.patch`, import.meta.url), 'utf8');
const brief = files => files.map(file => [file.path, file.status, file.added, file.removed]);

test('parse: a git patch of several files: modified with two hunks and their sections, added, deleted, counts and a note line', () => {
	const files = Diff.parse(fixture('git'));
	assert.deepEqual(brief(files), [['src/app.js', 'modified', 2, 1], ['docs/notes.md', 'added', 2, 0], ['old/legacy.txt', 'deleted', 0, 3]]);
	const [app, notes, legacy] = files;
	assert.deepEqual(app.hunks.map(hunk => [hunk.old, hunk.new, hunk.header]), [[1, 1, null], [20, 21, 'function close(server) {']]);
	assert.deepEqual(app.hunks[0].lines[1], { kind: 'add', text: "import { stop } from './stop.js';" });
	assert.deepEqual(app.hunks[1].lines.at(-1), { kind: 'note', text: 'No newline at end of file' }, 'the note after the counts belongs to the hunk');
	assert.deepEqual(notes.mode, { old: null, new: '100644' });
	assert.equal(notes.previous, null);
	assert.deepEqual(legacy.hunks[0].lines.map(line => line.kind + ':' + line.text), ['delete:one', 'delete:-- two', 'delete:three']);
	assert.equal(app.unread + notes.unread + legacy.unread, 0);
});

test('parse: renamed with changes, renamed and copied without, mode only', () => {
	const files = Diff.parse(fixture('moves'));
	assert.deepEqual(files.map(file => [file.path, file.previous, file.status, file.hunks.length]), [['src/new-name.js', 'src/old-name.js', 'renamed', 1], ['brand/logo.svg', 'assets/logo.svg', 'renamed', 0], ['src/copy.css', 'src/base.css', 'copied', 0], ['bin/run.sh', null, 'modified', 0]]);
	assert.deepEqual(files[3].mode, { old: '100644', new: '100755' });
	assert.deepEqual([files[0].added, files[0].removed], [1, 1]);
});

test('parse: binary files in both forms, and an added empty file', () => {
	const files = Diff.parse(fixture('binary'));
	assert.deepEqual(files.map(file => [file.path, file.status, file.binary, file.hunks.length]), [['images/photo.png', 'modified', true, 0], ['fonts/new.woff2', 'added', true, 0], ['empty.txt', 'added', false, 0]]);
	assert.ok(files.every(file => file.unread === 0), 'the binary patch is skipped, not unread');
	const added = Diff.parse('diff --git a/x.png b/x.png\nnew file mode 100644\nBinary files /dev/null and b/x.png differ\n');
	assert.deepEqual(brief(added), [['x.png', 'added', 0, 0]]);
	assert.equal(added[0].binary, true);
});

test('parse: quoted paths with octal bytes read as UTF-8, C escapes, and unquoted names with spaces', () => {
	const files = Diff.parse(fixture('quoted'));
	assert.deepEqual(files.map(file => [file.path, file.previous]), [['docs/café.txt', null], ['notes/quote"d \\ name.txt', 'notes/tab\there.txt'], ['with space/file name.txt', null]]);
	assert.deepEqual(files[0].hunks[0].lines, [{ kind: 'delete', text: 'hola' }, { kind: 'add', text: 'adiós' }]);
	const newline = Diff.parse('diff --git "a/two\\nlines.txt" "b/two\\nlines.txt"\n--- "a/two\\nlines.txt"\n+++ "b/two\\nlines.txt"\n@@ -1 +1 @@\n-a\n+b\n');
	assert.equal(newline[0].path, 'two\nlines.txt');
});

test('parse: a plain unified diff without diff --git lines, timestamps after a tab, and a hunk deleting a line that reads like a header', () => {
	const files = Diff.parse(fixture('plain'));
	assert.deepEqual(brief(files), [['config/settings.yml', 'modified', 1, 1], ['lib/util.c', 'modified', 1, 0]]);
	assert.deepEqual(files[0].hunks[0].lines.map(line => line.kind + ':' + line.text), ['context:name: storefront', 'delete:-- a/x', 'add:++ b/x', 'context:retries: 3', 'context:timeout: 30'], 'read by the counts, not as the next file');
	assert.equal(files[1].hunks[0].header, 'int sum(int a, int b)');
	assert.deepEqual(brief(Diff.parse('--- /dev/null\n+++ b/new.txt\n@@ -0,0 +1 @@\n+hello\n')), [['new.txt', 'added', 1, 0]]);
	assert.deepEqual(brief(Diff.parse('--- a/gone.txt\n+++ /dev/null\n@@ -1 +0,0 @@\n-bye\n')), [['gone.txt', 'deleted', 0, 1]]);
});

test('parse: CRLF line ends read as LF ends, the same files and lines', () => {
	const text = fixture('git');
	assert.deepEqual(Diff.parse(text.replace(/\n/g, '\r\n')), Diff.parse(text));
});

test('parse: a malformed patch keeps what it can read and counts each part it cannot: a bad hunk header, a hunk cut short; a commit message and signature are not parts', () => {
	const files = Diff.parse(fixture('malformed'));
	assert.deepEqual(brief(files), [['src/a.js', 'modified', 1, 2], ['src/b.js', 'modified', 1, 1]]);
	assert.equal(files[0].unread, 2, 'the hunk that does not parse and the hunk cut short');
	assert.deepEqual(files[0].hunks[1].lines.map(line => line.kind), ['context', 'delete'], 'what the cut hunk holds is kept');
	assert.equal(files[1].unread, 0);
	assert.deepEqual(Diff.parse('@@ -1 +1 @@\n-a\n+b\n'), [], 'a hunk outside any file is no file');
	for (const value of [undefined, null, 42, {}, '', 'not a patch at all']) assert.deepEqual(Diff.parse(value), []);
	const extra = Diff.parse('--- a/x\n+++ b/x\n@@ -1 +1 @@\n-a\n+b\n+c\n');
	assert.equal(extra[0].unread, 1, 'lines past the counts');
	assert.equal(extra[0].added, 1);
});

test('parse: lines read as context when a tool stripped the space of an empty one; counts and status are data a product can use', () => {
	const files = Diff.parse('diff --git a/a.txt b/a.txt\n--- a/a.txt\n+++ b/a.txt\n@@ -1,3 +1,3 @@\n one\n\n-two\n+2\n');
	assert.deepEqual(files[0].hunks[0].lines.map(line => line.kind), ['context', 'context', 'delete', 'add']);
	const totals = Diff.parse(fixture('git')).reduce((sum, file) => [sum[0] + file.added, sum[1] + file.removed], [0, 0]);
	assert.deepEqual(totals, [4, 4]);
});
