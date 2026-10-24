import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Page } from './support/page.mjs';

/**
 * The composer's one geometry (0.26.0, D165): a `Button` that is `bare` (its glyph alone, its words its name
 * and tooltip), Send as its glyph unless a step or an action that is not a send needs its words, Interrupt
 * and Dictate by their glyph, the box's empty and live marks, and a bare `CopyButton`.
 */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const sheet = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const settle = () => new Promise(resolve => setTimeout(resolve, 0));
const hint = () => document.querySelector('.bui-hint:not([hidden])')?.textContent ?? null;

test('a bare button draws its glyph alone, keeps its words as its name and shows them as its tooltip; it can take its words back', () => {
	const button = new ui.Button({ label: 'Attach files', glyph: 'plus', variant: 'quiet', bare: true }).mount(document.body);
	const element = button.element;
	assert.equal(element.getAttribute('aria-label'), 'Attach files');
	assert.ok(element.classList.contains('bui-button-bare'));
	assert.ok(element.hasAttribute('data-bui-hint'));
	assert.ok(element.querySelector('span').classList.contains('bui-hidden'), 'the words stay in the page for find and copy, not drawn');
	assert.equal(element.querySelector('svg').dataset.icon, 'plus');
	page.key(document.body, 'Tab');
	element.focus();
	assert.equal(hint(), 'Attach files', 'the family tooltip says its name');
	element.blur();
	button.label = 'Attach a file';
	assert.equal(element.getAttribute('aria-label'), 'Attach a file', 'the name follows the words');
	button.busy = true;
	assert.equal(element.getAttribute('aria-label'), 'Attach a file…', 'busy says it works');
	button.busy = false;
	button.bare = false;
	assert.equal(element.getAttribute('aria-label'), null, 'with its words drawn its name is its words');
	assert.equal(element.hasAttribute('data-bui-hint'), false);
	assert.equal(element.querySelector('.bui-hidden'), null);
	button.bare = true;
	button.glyph = 'check';
	assert.equal(element.querySelector('svg').dataset.icon, 'check', 'another glyph for a moment');
	button.destroy();
	assert.equal(document.querySelectorAll('.bui-hint').length, 0, 'its tooltip leaves with it');
});

test('a bare button keeps a product name over its words, never touches a button that was never bare, and without a glyph keeps its words', () => {
	const named = new ui.Button({ label: 'Copy', glyph: 'copy', name: 'Copy the answer', bare: true });
	assert.equal(named.element.getAttribute('aria-label'), 'Copy the answer');
	named.label = 'Copied';
	assert.equal(named.element.getAttribute('aria-label'), 'Copy the answer');
	const plain = new ui.Button({ label: 'Save' });
	plain.element.setAttribute('aria-label', 'Save the draft');
	plain.element.setAttribute('data-bui-hint', '');
	plain.label = 'Save now';
	plain.busy = true;
	assert.equal(plain.element.getAttribute('aria-label'), 'Save the draft', "a product's own name stays");
	assert.ok(plain.element.hasAttribute('data-bui-hint'));
	const words = new ui.Button({ label: 'Send', bare: true });
	assert.equal(words.bare, false, 'no glyph, no bare face');
	assert.equal(words.element.querySelector('.bui-hidden'), null);
	for (const button of [named, plain, words]) button.destroy();
});

test("Send is its up glyph alone, named by the action's words; a step or an action that is not a send draws its words, ending with the glyph", () => {
	const composer = new ui.Composer({ label: 'Message', onsubmit: () => Promise.resolve(), actions: [{ id: 'start', label: 'Wake up and send', primary: true }, { id: 'later', label: 'Send without waking' }] }).mount(document.body);
	const send = composer.element.querySelector('.bui-composer-go');
	assert.ok(send.classList.contains('bui-button-primary'));
	assert.equal(send.querySelector('svg').dataset.icon, 'up');
	assert.equal(send.getAttribute('aria-label'), 'Wake up and send', 'what pressing it does');
	assert.ok(send.hasAttribute('data-bui-hint'));
	assert.equal(send.hasAttribute('data-words'), false);
	assert.ok(composer.element.querySelector('.bui-composer-send .bui-menu-button'), 'the other ways to send in its split menu');
	composer.step = { label: 'Choose a machine and send', run: () => false };
	assert.ok(send.hasAttribute('data-words'), 'a step is read before sending');
	assert.equal(send.querySelector('span').textContent, 'Choose a machine and send');
	assert.equal(send.querySelector('.bui-hidden'), null);
	assert.equal(send.getAttribute('aria-label'), null);
	composer.step = null;
	assert.equal(send.getAttribute('aria-label'), 'Wake up and send');
	composer.actions = [{ id: 'send', label: 'Check whether it started', words: true }];
	assert.ok(send.hasAttribute('data-words'), 'an action that is not a send says its words');
	composer.actions = [{ id: 'send', label: 'Send' }];
	assert.equal(send.hasAttribute('data-words'), false);
	assert.equal(composer.element.querySelector('.bui-composer-send .bui-menu-button'), null);
	composer.destroy();
});

test('Interrupt and Dictate are their glyphs alone, named and with their tooltip', () => {
	const composer = new ui.Composer({ label: 'Message', onsubmit: () => Promise.resolve(), stop: { label: 'Interrupt', run: () => undefined }, dictation: { transcribe: async () => ({ text: '' }) } }).mount(document.body);
	const stop = composer.element.querySelector('.bui-composer-stop');
	assert.equal(stop.getAttribute('aria-label'), 'Interrupt');
	assert.equal(stop.querySelector('svg').dataset.icon, 'stop');
	assert.ok(stop.classList.contains('bui-button-bare') && stop.hasAttribute('data-bui-hint'));
	const dictate = composer.element.querySelector('.bui-dictation-button');
	assert.equal(dictate.getAttribute('aria-label'), 'Dictate');
	assert.equal(dictate.querySelector('svg').dataset.icon, 'microphone');
	assert.ok(dictate.classList.contains('bui-button-bare'));
	for (const name of ['plus', 'up', 'stop', 'microphone']) assert.ok(ui.unlabeled.includes(name), `${name} is on the closed list (D11, D165)`);
	composer.destroy();
});

test('the composer marks nothing to send (no words, no ready file) and its live work', async () => {
	const composer = new ui.Composer({ label: 'Message', onsubmit: () => Promise.resolve(), attach: { onfiles: () => undefined } }).mount(document.body);
	const root = composer.element;
	assert.ok(root.hasAttribute('data-empty'));
	composer.field.value = 'Fix it';
	composer.field.dispatchEvent(new Event('input', { bubbles: true }));
	assert.equal(root.hasAttribute('data-empty'), false, 'words to send');
	composer.value = '   ';
	assert.ok(root.hasAttribute('data-empty'), 'spaces are nothing');
	composer.attachments = [{ key: 'a', name: 'a.png', state: 'uploading', progress: 0.3 }];
	assert.ok(root.hasAttribute('data-empty'), 'a file on its way is not yet something to send');
	composer.attachments = [{ key: 'a', name: 'a.png', state: 'ready' }];
	assert.equal(root.hasAttribute('data-empty'), false, 'a ready file is');
	composer.attachments = [];
	composer.value = 'Ship it';
	await composer.submit();
	await settle();
	assert.ok(root.hasAttribute('data-empty'), 'sent: nothing left');
	assert.equal(root.hasAttribute('data-live'), false);
	composer.live = true;
	assert.ok(root.hasAttribute('data-live'));
	composer.live = false;
	assert.equal(root.hasAttribute('data-live'), false);
	composer.destroy();
	const live = new ui.Composer({ label: 'Message', onsubmit: () => Promise.resolve(), live: true }).mount(document.body);
	assert.ok(live.element.hasAttribute('data-live'), 'given live from the start');
	live.destroy();
});

test('a bare copy is its glyph alone; a copy says Copied with the check for a moment, a refusal keeps its glyph', async () => {
	const writes = [];
	const clip = writeText => Object.defineProperty(page.window.navigator, 'clipboard', { value: { writeText }, configurable: true });
	clip(text => (writes.push(text), Promise.resolve()));
	const saved = ui.CopyButton.hold;
	ui.CopyButton.hold = 20;
	const copy = new ui.CopyButton({ text: 'the answer', label: 'Copy', name: 'Copy the answer', bare: true }).mount(document.body);
	const button = copy.button;
	assert.equal(button.querySelector('svg').dataset.icon, 'copy');
	assert.equal(button.getAttribute('aria-label'), 'Copy the answer');
	assert.ok(button.hasAttribute('data-bui-hint'));
	button.click();
	await page.until(() => copy.result === 'copied');
	assert.deepEqual(writes, ['the answer']);
	assert.equal(button.querySelector('svg').dataset.icon, 'check');
	assert.equal(button.getAttribute('aria-label'), 'Copied');
	await page.until(() => copy.result === null);
	assert.equal(button.querySelector('svg').dataset.icon, 'copy', 'its glyph again');
	assert.equal(button.getAttribute('aria-label'), 'Copy the answer');
	const link = new ui.CopyButton({ text: 'https://example.test/turn', label: 'Copy link', bare: true, glyph: 'link' }).mount(document.body);
	assert.equal(link.button.querySelector('svg').dataset.icon, 'link');
	assert.equal(link.button.getAttribute('aria-label'), 'Copy link');
	clip(() => Promise.reject(new Error('denied')));
	link.button.click();
	await page.until(() => link.result === 'refused');
	assert.equal(link.button.querySelector('svg').dataset.icon, 'link', 'a refusal keeps its glyph, said in its name');
	assert.equal(link.button.getAttribute('aria-label'), 'Not copied');
	ui.CopyButton.hold = saved;
	copy.destroy();
	link.destroy();
});

test('the stylesheet draws one geometry: round glyphs and pills one target tall, the state band inside the box, Send filled and quiet when empty', () => {
	assert.match(sheet, /\.bui-composer :is\(\.bui-button-bare, \.bui-composer-plus, \.bui-composer-more\)\s*\{[^}]*height:\s*var\(--bui-target\)[^}]*border-radius:\s*var\(--radius-round\)/);
	assert.match(sheet, /\.bui-composer \.bui-chip \.bui-choice-button\s*\{[^}]*min-height:\s*var\(--bui-target\)[^}]*border-radius:\s*var\(--radius-round\)/);
	assert.match(sheet, /\.bui-composer \.bui-chip \.bui-choice-label,\s*\.bui-composer \.bui-chip \.bui-chip-state\[data-tone='success'\]\s*\{[^}]*clip:\s*rect\(0 0 0 0\)/, 'a chip shows its value; its label and a ready state are its name and tooltip');
	assert.match(sheet, /\.bui-composer-line\s*\{[^}]*border-bottom:\s*1px solid var\(--color-border\)/, 'the state line is a band of the box');
	assert.match(sheet, /\.bui-composer\[data-empty\] \.bui-composer-go:not\(\[data-step\], \[data-busy\]\),[^{]*\.bui-menu-button\s*\{[^}]*background:\s*var\(--color-disabled\)/, 'Send and its chevron quiet with nothing to send, unless a step acts without a message (D183)');
	assert.match(sheet, /\.bui-composer-bar\s*\{[^}]*padding:\s*var\(--space-1\) var\(--bui-composer-inset\) var\(--bui-composer-inset\)/, 'one inset under the controls and on their side (D184)');
	assert.match(sheet, /\.bui-composer-tray\s*\{[^}]*padding:\s*var\(--space-2\) var\(--bui-composer-inset\) var\(--bui-composer-inset\)/, 'and under the tray');
	assert.match(sheet, /\.bui-composer-problem\s*\{[^}]*flex:\s*1 1 100%/, 'a failure is a row of the state band (D183)');
	assert.match(sheet, /\.bui-composer-line:not\(\[hidden\]\) ~ \.bui-composer-input > \.bui-composer-field\s*\{[^}]*padding-block-start:\s*var\(--space-2\)/, 'under the state band the field needs less room above it');
	const edge = sheet.match(/\.bui-composer\[data-live\] \.bui-composer-box::before\s*\{([^}]*)\}/)[1];
	assert.match(edge, /animation:\s*bui-composer-live 2400ms ease-in-out 2;/, 'the light runs twice, then the line holds (D95)');
	assert.match(edge, /var\(--color-info\)/, 'in the hue of work in progress');
	assert.doesNotMatch(edge, /infinite|--color-accent|--color-focus/, 'never endless, never the coral of the primary (C2)');
	assert.match(sheet, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.bui-composer\[data-live\] \.bui-composer-box::before\s*\{[^}]*animation:\s*none/, 'a still line under reduced motion');
	assert.match(sheet, /\.bui-page-dock::before\s*\{[^}]*linear-gradient\(to bottom, transparent, var\(--color-canvas\)\)/, 'the dock fades what passes beneath');
});
