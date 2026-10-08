import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/**
 * 0.11.2: a file the product refused is "Not attached" and never holds a message back; a drop on the
 * product's work surface attaches; a chip's cut name is whole on hover anywhere on it; one size in
 * words (`Bytes`); a copy confirmed in place (`CopyButton`).
 */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const file = (name, type = 'image/png', size = 1200) => new page.window.File(['x'.repeat(size)], name, { type });
function carrying(type, data) {
	const event = new Event(type, { bubbles: true, cancelable: true });
	Object.defineProperty(event, 'dataTransfer', { value: data });
	return event;
}
const dragged = (files, types = ['Files']) => ({ files, types, dropEffect: 'none' });

function make(options = {}) {
	const log = [];
	const sent = [];
	const composer = new ui.Composer({ label: 'Message', onsubmit: message => (sent.push(message), Promise.resolve()), attach: { onfiles: (files, via) => log.push([via, files.map(item => item.name)]), onremove: item => log.push(['remove', item.key]), onretry: item => log.push(['retry', item.key]) }, ...options }).mount(document.body);
	return { composer, log, sent };
}

test('a refused file says "Not attached · {reason}", offers no Retry, is said once and never goes with the message', async () => {
	const { composer, sent } = make();
	composer.attachments = [
		{ key: 'a', name: 'shot.png', size: 2048, state: 'ready' },
		{ key: 'b', name: 'clip.mp4', size: 6_300_000, state: 'refused', reason: 'only images and text can be attached' }
	];
	const chip = composer.element.querySelector('.bui-composer-file[data-state="refused"]');
	assert.ok(chip, 'its own state');
	assert.equal(chip.querySelector('.bui-composer-file-meta').textContent, '6.3 MB · Not attached · only images and text can be attached');
	assert.equal(chip.querySelector('.bui-composer-file-retry').hidden, true, 'nothing to retry: the product would not take it');
	assert.match(composer.element.querySelector('.bui-announcer')?.textContent ?? document.body.textContent, /clip\.mp4 not attached: only images and text can be attached/);
	composer.value = 'Look at this';
	assert.equal(await composer.submit(), true, 'a refusal never holds the message back');
	assert.deepEqual(sent[0].attachments.map(item => item.key), ['a'], 'only what is attached goes');
	composer.attachments = [{ key: 'b', name: 'clip.mp4', state: 'refused', reason: 'too large' }];
	composer.value = 'Only text';
	await composer.submit();
	assert.deepEqual(Object.keys(sent[1]), ['text', 'action'], 'a message with only refused files keeps its text-only shape');
	assert.equal(composer.attachments.length, 1, 'the chips are the product\'s, as given');
	composer.destroy();
});

test('Spanish: "No adjuntado · {reason}"', () => {
	const { composer } = make({ labels: ui.Composer.labels.es, locale: 'es' });
	composer.attachments = [{ key: 'b', name: 'clip.mp4', state: 'refused', reason: 'solo imágenes' }];
	assert.equal(composer.element.querySelector('.bui-composer-file-meta').textContent, 'No adjuntado · solo imágenes');
	composer.destroy();
});

test('a drop of files on the product\'s work surface attaches and shows one target over it; text is left alone; a drop on the composer inside is handed over once', () => {
	const surface = document.body.appendChild(document.createElement('main'));
	const { composer, log } = make();
	surface.append(composer.element);
	const thread = surface.insertBefore(document.createElement('section'), composer.element);
	composer.zone = surface;
	const enter = carrying('dragenter', dragged([], ['Files']));
	thread.dispatchEvent(enter);
	assert.equal(enter.defaultPrevented, true, 'the surface takes files');
	const target = document.querySelector('.bui-composer-zone');
	assert.ok(target && !target.hidden, 'the target over the surface');
	assert.equal(target.getAttribute('aria-hidden'), 'true');
	assert.equal(target.textContent, 'Drop files to attach');
	const over = carrying('dragover', dragged([], ['Files']));
	thread.dispatchEvent(over);
	assert.equal(over.defaultPrevented, true, 'the browser does not open the file');
	const drop = carrying('drop', dragged([file('a.png')]));
	thread.dispatchEvent(drop);
	assert.equal(drop.defaultPrevented, true);
	assert.deepEqual(log, [['drop', ['a.png']]]);
	assert.equal(target.hidden, true, 'gone with the drop');
	const text = carrying('dragover', dragged([], ['text/plain']));
	thread.dispatchEvent(text);
	assert.equal(text.defaultPrevented, false, 'dragged text is not the surface\'s');
	composer.element.dispatchEvent(carrying('drop', dragged([file('b.png')])));
	assert.deepEqual(log.at(-1), ['drop', ['b.png']]);
	assert.equal(log.length, 2, 'once, by the composer');
	composer.zone = null;
	const late = carrying('dragover', dragged([], ['Files']));
	thread.dispatchEvent(late);
	assert.equal(late.defaultPrevented, false, 'a surface let go takes nothing');
	composer.destroy();
	assert.equal(document.querySelector('.bui-composer-zone'), null, 'destroy removes the target');
});

test('the target hides by itself when the drag stops moving (it left the window)', async () => {
	const surface = document.body.appendChild(document.createElement('main'));
	const { composer } = make({ attach: { onfiles: () => undefined, zone: surface } });
	surface.dispatchEvent(carrying('dragenter', dragged([], ['Files'])));
	const target = document.querySelector('.bui-composer-zone');
	assert.equal(target.hidden, false);
	await page.until(() => target.hidden, 1500);
	composer.destroy();
});

test("a cut file name shows whole when the pointer is anywhere on its chip", () => {
	const { composer } = make();
	composer.attachments = [{ key: 'a', name: 'a-very-long-screenshot-name-from-the-review-of-checkout.png', state: 'ready' }];
	const chip = composer.element.querySelector('.bui-composer-file');
	const name = chip.querySelector('.bui-composer-file-name');
	Object.defineProperty(name, 'scrollWidth', { value: 400, configurable: true });
	Object.defineProperty(name, 'clientWidth', { value: 120, configurable: true });
	chip.querySelector('.bui-composer-thumb').dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
	chip.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
	const tip = [...document.querySelectorAll('.bui-tooltip')].find(node => node.textContent === 'a-very-long-screenshot-name-from-the-review-of-checkout.png');
	assert.ok(tip, 'the whole name');
	composer.destroy();
});

test('Bytes says one size the same everywhere: B below a thousand, then decimal units in the locale', () => {
	assert.equal(new ui.Bytes().of(12), '12 B');
	assert.equal(new ui.Bytes().of(999), '999 B');
	assert.equal(new ui.Bytes({ locale: 'en' }).of(6_300_000), '6.3 MB');
	assert.equal(new ui.Bytes({ locale: 'es' }).of(6_300_000), '6,3 MB');
	assert.equal(new ui.Bytes({ locale: 'en' }).of(12_400), '12 kB');
	assert.equal(new ui.Bytes().of(Number.NaN), null);
	assert.equal(new ui.Bytes({ bytes: '{count} bytes' }).of(3), '3 bytes');
});

test('CopyButton copies the text read at the press and says "Copied" in place, then its words again; a refusal says why and selects the shown text', async () => {
	const written = [];
	const clipboard = { writeText: text => (written.push(text), Promise.resolve()) };
	Object.defineProperty(page.window.navigator, 'clipboard', { value: clipboard, configurable: true });
	let path = 'src/a.js';
	const results = [];
	const copy = new ui.CopyButton({ text: () => path, label: 'Copy path', name: 'Copy the path src/a.js', onresult: copied => results.push(copied) }).mount(document.body);
	assert.equal(copy.button.textContent, 'Copy path');
	assert.equal(copy.button.getAttribute('aria-label'), 'Copy the path src/a.js');
	path = 'src/b.js';
	copy.button.click();
	await page.until(() => results.length === 1);
	assert.deepEqual(written, ['src/b.js'], 'read at the press');
	assert.equal(copy.result, 'copied');
	assert.equal(copy.button.textContent, 'Copied');
	assert.ok(copy.button.querySelector('svg'), 'with the check glyph');
	assert.equal(copy.button.getAttribute('aria-label'), 'Copied');
	await page.until(() => copy.element.querySelector('[role="status"]').textContent === 'Copied');
	assert.equal(document.querySelector('.bui-toast'), null, 'no toast');
	await page.until(() => copy.result === null, 3000);
	assert.equal(copy.button.textContent, 'Copy path', 'its words again');
	assert.equal(copy.button.getAttribute('aria-label'), 'Copy the path src/a.js');
	clipboard.writeText = () => Promise.reject(new Error('denied'));
	const shown = document.body.appendChild(document.createElement('code'));
	shown.textContent = 'src/b.js';
	const refused = new ui.CopyButton({ text: 'src/b.js', select: () => shown, labels: ui.CopyButton.labels.es }).mount(document.body);
	assert.equal(await refused.copy(), false);
	assert.equal(refused.button.textContent, 'No copiado');
	await page.until(() => /seleccionado/.test(refused.element.querySelector('[role="status"]').textContent));
	copy.destroy();
	refused.destroy();
	delete page.window.navigator.clipboard;
});
