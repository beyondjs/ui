import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Page } from './support/page.mjs';
import { Media } from './support/media.mjs';

/**
 * The composer of 0.14.0 (D100): the context tray on its lower edge, commands after "/", ArrowUp's recall,
 * the taller editor and Dictate placed in its toolbar; the focus border and the growth cap in its styles.
 */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const settle = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));
const type = (field, text) => {
	field.value = text;
	field.setSelectionRange(text.length, text.length);
	field.dispatchEvent(new page.window.Event('input', { bubbles: true }));
};
function scene(options = {}) {
	const sent = [];
	const changed = [];
	const composer = new ui.Composer({ label: 'Message', onsubmit: message => (sent.push(message), Promise.resolve()), onchange: text => changed.push(text), ...options }).mount(document.body);
	return { composer, sent, changed, field: composer.field, box: composer.element.querySelector('.bui-composer-box') };
}
const chip = text => Object.assign(document.createElement('button'), { type: 'button', textContent: text, className: 'bui-chip' });

test('the tray sits inside the box on its lower edge while it holds chips, and leaves with null', () => {
	const { composer, box } = scene({ tray: [chip('web · Ready'), chip('Claude Code')] });
	const tray = box.lastElementChild;
	assert.ok(tray.classList.contains('bui-composer-tray'));
	assert.equal(tray.hidden, false);
	assert.deepEqual([...tray.children].map(node => node.textContent), ['web · Ready', 'Claude Code']);
	assert.ok(tray.previousElementSibling.classList.contains('bui-composer-bar'), 'after the toolbar');
	composer.tray = null;
	assert.equal(tray.hidden, true);
	assert.equal(tray.childElementCount, 0);
	composer.destroy();
	assert.equal(scene().box.querySelector('.bui-composer-tray').hidden, true, 'no tray without chips');
});

test('commands list after "/" at the field’s start only; a command with run leaves the field and runs, one without inserts', async () => {
	const ran = [];
	const commands = [{ value: '/model', label: 'Change the model', run: ({ value }) => ran.push(value) }, { value: '/review', label: 'Review the changes' }];
	const { composer, field, sent, changed } = scene({ commands });
	type(field, '/mo');
	await settle(5);
	const list = composer.element.querySelectorAll('.bui-composer-suggest')[0];
	assert.equal(composer.element.querySelectorAll('.bui-composer-suggest').length, 1, 'only the commands without onsuggest');
	assert.equal(list.hidden, false);
	assert.equal(list.querySelector('[role="listbox"]').getAttribute('aria-label'), 'Commands');
	assert.equal(field.getAttribute('aria-controls'), list.querySelector('[role="listbox"]').id);
	assert.deepEqual([...list.querySelectorAll('.bui-composer-option-label')].map(node => node.textContent), ['Change the model']);
	page.key(field, 'Enter');
	assert.deepEqual(ran, ['/model'], 'the product runs it');
	assert.equal(field.value, '', 'its token left the field');
	assert.equal(sent.length, 0, 'never sent');
	type(field, '/rev');
	await settle(5);
	page.key(field, 'Enter');
	assert.equal(field.value, '/review ');
	assert.equal(changed.at(-1), '/review ');
	type(field, 'please /re');
	await settle(5);
	assert.equal(list.hidden, true, 'not after the start');
	composer.destroy();
	assert.throws(() => scene({ commands: 'model' }), TypeError);
});

test('a source of commands is asked with the query; the list filter matches a value’s start or a label’s words', async () => {
	const queries = [];
	const { composer, field } = scene({ commands: query => (queries.push(query), [{ value: '/new', label: 'New conversation' }]) });
	type(field, '/n');
	await settle(5);
	assert.deepEqual(queries, ['n']);
	composer.destroy();
	const { ComposerContext } = await import('../src/dom/composer/context.js');
	assert.deepEqual(ComposerContext.filter([{ value: '/model', label: 'Model' }, { value: '/review', label: 'Review changes' }], 'chan').map(item => item.value), ['/review']);
});

test('ArrowUp in an empty field brings the recalled message back with the caret at its end; a field with text keeps ArrowUp', async () => {
	let answer = 'Also add a test';
	const { composer, field, changed } = scene({ recall: () => answer });
	const taken = page.key(field, 'ArrowUp');
	assert.ok(taken.defaultPrevented);
	await settle();
	assert.equal(field.value, 'Also add a test');
	assert.equal(field.selectionStart, field.value.length);
	assert.equal(changed.at(-1), 'Also add a test');
	assert.ok(!page.key(field, 'ArrowUp').defaultPrevented, 'text in the field: the caret’s');
	type(field, '');
	answer = null;
	assert.ok(!page.key(field, 'ArrowUp').defaultPrevented, 'nothing to recall');
	answer = Promise.resolve('late');
	page.key(field, 'ArrowUp');
	type(field, 'typed');
	await settle();
	assert.equal(field.value, 'typed', 'typing meanwhile wins over a late answer');
	composer.destroy();
	assert.throws(() => scene({ recall: 'x' }), TypeError);
});

test('Expand moves the same box into a taller editor and back, keeping the draft, the caret and focus; a send collapses it', async () => {
	const { composer, field, box, sent } = scene();
	const holder = composer.element.querySelector('.bui-composer-grow');
	const button = holder.querySelector('button');
	assert.equal(button.getAttribute('aria-label'), 'Expand');
	assert.ok(button.hasAttribute('data-bui-hint'), 'the maximize glyph alone, with its name (D11)');
	type(field, 'A long draft');
	field.setSelectionRange(2, 6);
	field.focus();
	button.click();
	const editor = composer.element.querySelector('dialog.bui-composer-editor');
	assert.equal(composer.editor.expanded, true);
	assert.equal(editor.open, true);
	assert.equal(box.parentNode, editor);
	assert.ok(composer.element.hasAttribute('data-expanded'));
	assert.equal(button.getAttribute('aria-label'), 'Collapse');
	assert.equal(document.activeElement, field);
	assert.deepEqual([field.selectionStart, field.selectionEnd], [2, 6]);
	editor.dispatchEvent(new page.window.Event('cancel', { cancelable: true }));
	assert.equal(composer.editor.expanded, false, 'Escape returns');
	assert.equal(box.parentNode, composer.element);
	assert.equal(field.value, 'A long draft');
	composer.editor.open();
	await composer.submit();
	assert.equal(sent.at(-1).text, 'A long draft');
	assert.equal(composer.editor.expanded, false, 'a sent message collapses it');
	composer.destroy();
	assert.equal(document.querySelector('.bui-composer-editor'), null);
});

test('Dictate sits at the toolbar’s end before the primary action, its line inside the box above the toolbar; text lands in the field and is never sent', async () => {
	const media = new Media(page.window);
	media.install();
	try {
		const { composer, box, field, sent, changed } = scene({ actions: [{ id: 'send', label: 'Send' }], dictation: { minimum: 0, transcribe: async () => ({ text: 'add a test' }) } });
		const end = composer.element.querySelector('.bui-composer-end');
		const voice = end.querySelector('.bui-dictation-button');
		assert.ok(voice, 'Dictate in the toolbar’s end');
		assert.ok(voice.compareDocumentPosition(end.querySelector('.bui-composer-send')) & 4, 'before the primary action');
		const line = box.querySelector(':scope > .bui-dictation');
		assert.ok(line.compareDocumentPosition(box.querySelector('.bui-composer-bar')) & 4, 'above the toolbar');
		assert.equal(composer.dictation.state, 'idle');
		type(field, 'Please');
		await composer.dictation.start();
		assert.equal(composer.dictation.state, 'recording');
		await composer.dictation.stop();
		assert.equal(field.value, 'Please add a test');
		assert.equal(changed.at(-1), 'Please add a test');
		assert.equal(sent.length, 0, 'never sent');
		composer.destroy();
		const plain = scene();
		assert.equal(plain.composer.dictation, null);
		assert.equal(plain.composer.element.querySelector('.bui-dictation-button'), null);
	} finally {
		media.uninstall();
	}
});

test('focus draws the box’s own border in the focus color, no outline ring beside it (CV-16); the field stops near a third of the window', () => {
	const css = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8');
	const focus = css.slice(css.indexOf('.bui-composer-box:has(.bui-composer-field:focus-visible) {'));
	const body = focus.slice(0, focus.indexOf('}'));
	assert.match(body, /border-color: var\(--color-focus\)/);
	assert.match(body, /inset 0 0 0 1px var\(--color-focus\)/);
	assert.doesNotMatch(body, /outline/);
	assert.match(css, /max-height: min\(calc\(var\(--bui-composer-max, 12\) \* 1lh \+ var\(--space-3\) \+ var\(--space-1\)\), var\(--bui-composer-cap, 33dvh\)\)/);
	for (const set of ['en', 'es']) for (const key of ['commands', 'expand', 'collapse']) assert.ok(ui.Composer.labels[set][key], `${set}.${key}`);
});
