import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/** Composer (0.11.0): the state line above the box with its action, the settings slot, and attachments from paste, drop and Attach as removable chips said once per state. */
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

test('the state line is a line of its own above the box, describes the field and has its action at its end', () => {
	let started = 0;
	const composer = new ui.Composer({ label: 'Message', onsubmit: () => Promise.resolve(), status: { text: 'My first VM is stopped · about $0.20 an hour', action: { label: 'Start', run: () => started++ } } }).mount(document.body);
	const line = composer.element.querySelector('.bui-composer-line');
	const box = composer.element.querySelector('.bui-composer-box');
	assert.ok(line.nextElementSibling === box, 'above the box');
	assert.ok(!box.contains(line), 'never inside the field\'s box');
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

test('settings sit at the toolbar\'s start, before the tools; without attach there is no Attach and a paste is left alone', () => {
	const model = new ui.ChoiceChip({ label: 'Model', options: [{ value: 'a', label: 'Opus 5.5' }, { value: 'b', label: 'Sonnet 5' }], value: 'a' });
	const tool = document.createElement('button');
	const composer = new ui.Composer({ label: 'Message', onsubmit: () => Promise.resolve(), settings: [model], tools: [tool] }).mount(document.body);
	const start = composer.element.querySelector('.bui-composer-start');
	assert.deepEqual([...start.children].map(node => node.className), ['bui-composer-settings', 'bui-composer-tools']);
	assert.ok(start.querySelector('.bui-composer-settings').contains(model.element));
	assert.equal(composer.element.querySelector('.bui-composer-attach'), null);
	const paste = carrying('paste', 'clipboardData', clipboard([file('a.png')]));
	composer.field.dispatchEvent(paste);
	assert.equal(paste.defaultPrevented, false);
	composer.settings = [];
	assert.equal(start.querySelector('.bui-composer-settings').childElementCount, 0);
	composer.destroy();
	model.destroy();
});

test('Attach is its glyph beside its word and opens the file input; picked, pasted and dropped files reach onfiles with how they came', () => {
	const { composer, log, field, root } = make();
	const attach = root.querySelector('.bui-composer-attach');
	assert.equal(attach.textContent.trim(), 'Attach');
	assert.equal(attach.querySelector('svg').dataset.icon, 'attach', 'the paper clip beside the word (D11)');
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
	assert.equal(root.querySelector('.bui-composer-problem').textContent, 'Write a message first.');
	composer.attachments = [{ key: 'a', name: 'a.png', state: 'ready' }];
	assert.equal(await composer.submit(), true);
	assert.deepEqual(sent, [{ text: '', action: 'send', attachments: [{ key: 'a', name: 'a.png', state: 'ready' }] }]);
	composer.destroy();
	assert.throws(() => new ui.Composer({ label: 'Message', onsubmit: () => Promise.resolve(), attach: {} }), TypeError);
});

test('Spanish copy for attachments', () => {
	const { composer, root } = make({ labels: ui.Composer.labels.es, locale: 'es' });
	composer.attachments = [{ key: 'a', name: 'a.png', size: 1_500_000, state: 'failed', reason: 'Demasiado grande' }];
	assert.equal(root.querySelector('.bui-composer-attach').textContent.trim(), 'Adjuntar');
	assert.match(root.querySelector('.bui-composer-file-meta').textContent, /^1,5 MB · Falló · Demasiado grande$/);
	assert.equal(root.querySelector('.bui-composer-file-remove').getAttribute('aria-label'), 'Quitar a.png');
	assert.equal(root.querySelector('.bui-announcer').textContent, 'a.png falló: Demasiado grande');
	composer.destroy();
});
