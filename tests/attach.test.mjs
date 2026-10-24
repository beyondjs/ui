import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/**
 * Composer (0.11.0): the state line with its action (since 0.26.0 the box's first band), the settings slot,
 * and attachments from paste, drop and the + as removable chips said once per state; since 0.26.0 the +
 * opens the file chooser at once, or a menu of the product's entries after Attach files.
 */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const settle = () => new Promise(resolve => setTimeout(resolve, 0));
const file = (name, type = 'image/png', size = 1200) => new page.window.File(['x'.repeat(size)], name, { type });
/** An event carrying a clipboard or a drag's data, as a browser gives it. */
function carrying(type, property, data) {
	const event = new Event(type, { bubbles: true, cancelable: true });
	Object.defineProperty(event, property, { value: data });
	return event;
}
const clipboard = (files, text = '') => ({ files, getData: kind => (kind === 'text/plain' ? text : '') });
const dragged = (files, types = ['Files']) => ({ files, types, dropEffect: 'none' });

/** A composer that takes files, with the product's handlers recorded. */
function make(options = {}) {
	const log = [];
	const sent = [];
	const composer = new ui.Composer({
		label: 'Message to Claude Code',
		onsubmit: message => (sent.push(message), Promise.resolve()),
		attach: { accept: 'image/*,text/plain', onfiles: (files, via) => log.push([via, files.map(item => item.name)]), onremove: item => log.push(['remove', item.key]), onretry: item => log.push(['retry', item.key]) },
		...options
	}).mount(document.body);
	return { composer, log, sent, field: composer.field, root: composer.element };
}

test("the state line is the box's first band (0.26.0), describes the field and has its action at its end", () => {
	let started = 0;
	const composer = new ui.Composer({ label: 'Message', onsubmit: () => Promise.resolve(), status: { text: 'My first VM is stopped · about $0.20 an hour', action: { label: 'Start', run: () => started++ } } }).mount(document.body);
	const line = composer.element.querySelector('.bui-composer-line');
	const box = composer.element.querySelector('.bui-composer-box');
	assert.ok(box.firstElementChild === line, "the box's first band, sharing its edges");
	assert.ok(line.compareDocumentPosition(composer.field) & Node.DOCUMENT_POSITION_FOLLOWING, 'before the field');
	const sentence = line.querySelector('.bui-composer-status');
	assert.equal(sentence.textContent, 'My first VM is stopped · about $0.20 an hour');
	assert.ok(composer.field.getAttribute('aria-describedby').split(' ').includes(sentence.id));
	const action = line.querySelector('.bui-composer-status-action button');
	assert.equal(action.textContent, 'Start');
	assert.ok(action.classList.contains('bui-button-quiet'));
	action.focus();
	action.click();
	assert.equal(started, 1);
	composer.status = { text: 'My first VM is starting', action: { label: 'Start', run: () => (started += 10) } };
	assert.ok(line.querySelector('.bui-composer-status-action button') === action && document.activeElement === action, 'an action that stays keeps its element and focus');
	action.click();
	assert.equal(started, 11, 'the latest run');
	composer.status = 'Plain text';
	assert.equal(line.querySelector('.bui-composer-status-action'), null);
	composer.status = null;
	assert.equal(line.hidden, true);
	assert.ok(!composer.field.getAttribute('aria-describedby').includes(sentence.id));
	composer.destroy();
});

test("settings sit at the toolbar's start after the +, before the tools; with nothing to add the + is not drawn and a paste is left alone", () => {
	const model = new ui.ChoiceChip({ label: 'Model', options: [{ value: 'a', label: 'Opus 5.5' }, { value: 'b', label: 'Sonnet 5' }], value: 'a' });
	const tool = document.createElement('button');
	const composer = new ui.Composer({ label: 'Message', onsubmit: () => Promise.resolve(), settings: [model], tools: [tool] }).mount(document.body);
	const start = composer.element.querySelector('.bui-composer-start');
	assert.deepEqual([...start.children].map(node => node.className), ['bui-composer-add', 'bui-composer-settings', 'bui-composer-tools']);
	assert.ok(start.querySelector('.bui-composer-settings').contains(model.element));
	assert.equal(start.querySelector('.bui-composer-add').hidden, true, 'no file to take, no entry: no +');
	assert.equal(composer.element.querySelector('.bui-composer-attach'), null);
	const paste = carrying('paste', 'clipboardData', clipboard([file('a.png')]));
	composer.field.dispatchEvent(paste);
	assert.equal(paste.defaultPrevented, false);
	composer.settings = [];
	assert.equal(start.querySelector('.bui-composer-settings').childElementCount, 0);
	composer.destroy();
	model.destroy();
});

test('the + attaches at once, its glyph alone named Attach files with its tooltip; picked, pasted and dropped files reach onfiles with how they came', () => {
	const { composer, log, field, root } = make();
	const attach = root.querySelector('.bui-composer-attach');
	assert.ok(root.querySelector('.bui-composer-start').firstElementChild.contains(attach), "the toolbar's first control");
	assert.equal(attach.getAttribute('aria-label'), 'Attach files');
	assert.equal(attach.querySelector('svg').dataset.icon, 'plus', 'the + alone (D165, the closed list of D11)');
	assert.ok(attach.hasAttribute('data-bui-hint'), 'its name is its tooltip');
	assert.ok(attach.querySelector('.bui-hidden'), 'its words are its name, not drawn');
	assert.equal(attach.getAttribute('aria-haspopup'), null, 'nothing but files to add: it opens the chooser at once');
	const input = root.querySelector('input[type="file"]');
	assert.equal(input.getAttribute('accept'), 'image/*,text/plain');
	assert.ok(input.hasAttribute('multiple'));
	let opened = 0;
	input.click = () => opened++;
	attach.click();
	composer.attach();
	assert.equal(opened, 2);
	Object.defineProperty(input, 'files', { value: [file('notes.txt', 'text/plain')], configurable: true });
	input.dispatchEvent(new Event('change'));
	const shot = carrying('paste', 'clipboardData', clipboard([file('shot.png')]));
	field.dispatchEvent(shot);
	assert.equal(shot.defaultPrevented, true, 'a paste of files only attaches');
	const rich = carrying('paste', 'clipboardData', clipboard([file('cell.png')], 'Some text'));
	field.dispatchEvent(rich);
	assert.equal(rich.defaultPrevented, false, 'a paste that carries text is the text\'s');
	root.dispatchEvent(carrying('dragenter', 'dataTransfer', dragged([])));
	assert.ok(root.hasAttribute('data-drop'), 'the drop target shows');
	assert.equal(root.querySelector('.bui-composer-drop').textContent, 'Drop files to attach');
	const over = carrying('dragover', 'dataTransfer', dragged([]));
	root.dispatchEvent(over);
	assert.equal(over.defaultPrevented, true, 'it accepts the drop');
	root.dispatchEvent(carrying('dragleave', 'dataTransfer', dragged([])));
	assert.ok(!root.hasAttribute('data-drop'), 'gone when the files leave');
	root.dispatchEvent(carrying('dragenter', 'dataTransfer', dragged([])));
	const drop = carrying('drop', 'dataTransfer', dragged([file('a.png'), file('b.png')]));
	root.dispatchEvent(drop);
	assert.equal(drop.defaultPrevented, true);
	assert.ok(!root.hasAttribute('data-drop'));
	const text = carrying('dragenter', 'dataTransfer', dragged([], ['text/plain']));
	root.dispatchEvent(text);
	assert.ok(!root.hasAttribute('data-drop'), 'dragged text is not a file');
	assert.deepEqual(log, [['pick', ['notes.txt']], ['paste', ['shot.png']], ['drop', ['a.png', 'b.png']]]);
	composer.destroy();
	assert.ok(!root.hasAttribute('data-drop'));
});

test('attachments are chips with a thumbnail, name, size and state in words: uploading with progress, failed with its reason and Retry, ready', () => {
	const made = [];
	const freed = [];
	page.window.URL.createObjectURL = blob => (made.push(blob.name), `blob:${blob.name}`);
	page.window.URL.revokeObjectURL = url => freed.push(url);
	const { composer, log, root } = make({ locale: 'en' });
	composer.attachments = [
		{ key: 'a', name: 'screenshot of the failing checkout.png', size: 1_234_567, state: 'uploading', progress: 0.42, file: file('a.png') },
		{ key: 'b', name: 'notes.txt', size: 300, type: 'text/plain', state: 'failed', reason: 'Larger than 10 MB' },
		{ key: 'c', name: 'diagram.png', size: 52_000, state: 'ready', thumbnail: 'blob:given' }
	];
	const chips = [...root.querySelectorAll('.bui-composer-files > li')];
	assert.equal(root.querySelector('.bui-composer-files').getAttribute('aria-label'), 'Attachments');
	assert.deepEqual(chips.map(chip => chip.dataset.state), ['uploading', 'failed', 'ready']);
	assert.equal(chips[0].querySelector('.bui-composer-file-meta').textContent, '1.2 MB · Uploading 42%');
	assert.equal(chips[0].querySelector('.bui-composer-file-bar').hidden, false);
	assert.equal(chips[0].querySelector('img').getAttribute('src'), 'blob:a.png', 'a thumbnail made from the File');
	assert.equal(chips[1].querySelector('.bui-composer-file-meta').textContent, '300 B · Failed · Larger than 10 MB');
	assert.equal(chips[1].querySelector('img'), null, 'a text file shows the file glyph');
	assert.equal(chips[1].querySelector('svg').dataset.icon, 'file');
	const retry = chips[1].querySelector('.bui-composer-file-retry');
	assert.equal(retry.hidden, false);
	retry.click();
	assert.equal(chips[2].querySelector('img').getAttribute('src'), 'blob:given', "the product's object URL");
	assert.equal(chips[2].querySelector('.bui-composer-file-meta').textContent, '52 kB');
	const remove = chips[0].querySelector('.bui-composer-file-remove');
	assert.equal(remove.getAttribute('aria-label'), 'Remove screenshot of the failing checkout.png', 'the whole name on focus (D44)');
	assert.ok(remove.hasAttribute('data-bui-hint'), 'its tooltip (D11)');
	assert.equal(remove.querySelector('svg').dataset.icon, 'close');
	remove.click();
	assert.deepEqual(log, [['retry', 'b'], ['remove', 'a']]);
	assert.equal(root.querySelectorAll('.bui-composer-files > li').length, 3, 'the list stays the product\'s until it sets it again');
	composer.attachments = composer.attachments.filter(item => item.key !== 'a');
	assert.deepEqual(freed, ['blob:a.png'], 'the URL made here is revoked when its chip goes');
	composer.destroy();
	assert.deepEqual(made, ['a.png']);
});

test('chips are said once per change of state, never per progress; a removed chip that held focus gives it to the next, then to the field', async () => {
	const { composer, root, field } = make();
	const said = () => root.querySelector('.bui-announcer').textContent;
	composer.attachments = [{ key: 'a', name: 'a.png', state: 'uploading', progress: 0.1 }];
	assert.equal(said(), 'a.png uploading');
	assert.equal(root.querySelector('.bui-announcer').getAttribute('aria-live'), 'polite');
	root.querySelector('.bui-announcer').textContent = '';
	composer.attachments = [{ key: 'a', name: 'a.png', state: 'uploading', progress: 0.6 }];
	assert.equal(said(), '', 'progress is not said');
	composer.attachments = [{ key: 'a', name: 'a.png', state: 'ready' }, { key: 'b', name: 'b.txt', state: 'failed', reason: 'Not a supported type' }];
	assert.equal(said(), 'a.png attached. b.txt failed: Not a supported type');
	const first = root.querySelector('.bui-composer-file-remove');
	first.focus();
	composer.attachments = [{ key: 'b', name: 'b.txt', state: 'failed', reason: 'Not a supported type' }];
	assert.equal(said(), 'a.png removed');
	assert.ok(root.querySelector('.bui-composer-files').contains(document.activeElement), 'focus on the chip now at its place');
	composer.attachments = [];
	assert.ok(document.activeElement === field, 'then the field');
	assert.equal(root.querySelector('.bui-composer-files').hidden, true);
	await settle();
	composer.destroy();
});

test('a message with a ready attachment may have no text, and carries the attachments; uploading only is still empty', async () => {
	const { composer, sent, root } = make();
	composer.attachments = [{ key: 'a', name: 'a.png', state: 'uploading', progress: 0.2 }];
	assert.equal(await composer.submit(), false);
	assert.equal(root.querySelector('.bui-composer-problem').hidden, true, 'nothing failed, so nothing is said (D183)');
	assert.equal(root.querySelector('.bui-composer-go').getAttribute('aria-disabled'), 'true', 'Send is quiet while the file uploads');
	composer.attachments = [{ key: 'a', name: 'a.png', state: 'ready' }];
	assert.equal(await composer.submit(), true);
	assert.deepEqual(sent, [{ text: '', action: 'send', attachments: [{ key: 'a', name: 'a.png', state: 'ready' }] }]);
	composer.destroy();
	assert.throws(() => new ui.Composer({ label: 'Message', onsubmit: () => Promise.resolve(), attach: {} }), TypeError);
});

test('the + with the product\'s entries is a menu: Attach files first, then each entry with its key; without files, the entries alone', () => {
	const ran = [];
	const { composer, root } = make({ add: [{ label: 'Mention a file', keys: '@', run: () => ran.push('mention') }, { label: 'Commands', keys: '/', run: () => ran.push('commands') }] });
	const button = root.querySelector('.bui-composer-plus');
	assert.equal(button.getAttribute('aria-haspopup'), 'menu');
	assert.equal(button.getAttribute('aria-label'), 'Add');
	assert.ok(button.hasAttribute('data-bui-hint'));
	assert.equal(button.querySelector('svg').dataset.icon, 'plus');
	button.click();
	const items = [...root.querySelectorAll('.bui-composer-add [role="menuitem"]')];
	assert.deepEqual(items.map(item => item.textContent), ['Attach files', 'Mention a file@', 'Commands/']);
	assert.deepEqual([...root.querySelectorAll('.bui-composer-keys')].map(key => [key.tagName, key.getAttribute('aria-hidden')]), [['KBD', 'true'], ['KBD', 'true']]);
	const input = root.querySelector('input[type="file"]');
	let opened = 0;
	input.click = () => opened++;
	items[0].click();
	assert.equal(opened, 1, 'Attach files opens the chooser');
	button.click();
	root.querySelectorAll('.bui-composer-add [role="menuitem"]')[1].click();
	assert.deepEqual(ran, ['mention']);
	button.focus();
	composer.add = [];
	const attach = root.querySelector('.bui-composer-attach');
	assert.ok(attach && attach.getAttribute('aria-haspopup') === null, 'no entry: Attach files at once again');
	assert.ok(document.activeElement === attach, 'focus stays on the +');
	composer.destroy();
	const bare = new ui.Composer({ label: 'Message', onsubmit: () => Promise.resolve(), add: [{ label: 'Commands', run: () => ran.push('only') }] }).mount(document.body);
	bare.element.querySelector('.bui-composer-plus').click();
	assert.deepEqual([...bare.element.querySelectorAll('[role="menuitem"]')].map(item => item.textContent), ['Commands'], 'no Attach files without attach');
	bare.destroy();
});

test('Spanish copy for attachments', () => {
	const { composer, root } = make({ labels: ui.Composer.labels.es, locale: 'es' });
	composer.attachments = [{ key: 'a', name: 'a.png', size: 1_500_000, state: 'failed', reason: 'Demasiado grande' }];
	assert.equal(root.querySelector('.bui-composer-attach').getAttribute('aria-label'), 'Adjuntar archivos');
	assert.match(root.querySelector('.bui-composer-file-meta').textContent, /^1,5 MB · Falló · Demasiado grande$/);
	assert.equal(root.querySelector('.bui-composer-file-remove').getAttribute('aria-label'), 'Quitar a.png');
	assert.equal(root.querySelector('.bui-announcer').textContent, 'a.png falló: Demasiado grande');
	composer.destroy();
});
