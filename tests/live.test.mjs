import { test, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/** LiveText (0.10.0): drawn at most once per frame, marked live and busy, never announced, settled or abandoned. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());

/** Animation frames the test runs by hand. */
const frames = [];
let saved = null;
beforeEach(() => {
	page.reset();
	frames.length = 0;
	saved = [globalThis.requestAnimationFrame, globalThis.cancelAnimationFrame];
	globalThis.requestAnimationFrame = work => frames.push(work);
	globalThis.cancelAnimationFrame = handle => (frames[handle - 1] = null);
});
afterEach(() => ([globalThis.requestAnimationFrame, globalThis.cancelAnimationFrame] = saved));
const frame = () => {
	const due = frames.splice(0).filter(Boolean);
	for (const work of due) work();
	return due.length;
};

test('pieces are drawn at most once per frame through the renderer, at the end of the last paragraph with the live mark', () => {
	const calls = [];
	const render = text => {
		calls.push(text);
		const block = document.createElement('div');
		for (const line of text.split('\n\n')) block.append(Object.assign(document.createElement('p'), { textContent: line }));
		return block;
	};
	const live = new ui.LiveText({ render }).mount(document.body);
	assert.equal(calls.length, 1, 'drawn once when made');
	live.append('The checkout ');
	live.append('sends people back.');
	live.append('\n\nI will fix it');
	assert.equal(calls.length, 1, 'nothing drawn between frames');
	assert.equal(frame(), 1, 'one frame asked for three pieces');
	assert.deepEqual(calls.at(-1), 'The checkout sends people back.\n\nI will fix it');
	const paragraphs = live.element.querySelectorAll('.bui-live-body p');
	assert.equal(paragraphs.length, 2);
	const mark = live.element.querySelector('.bui-live-mark');
	assert.ok(mark.parentElement === paragraphs[1], 'the mark ends the last paragraph');
	assert.equal(mark.textContent.trim(), 'Writing…', 'a word for assistive technology');
	assert.equal(live.element.getAttribute('aria-busy'), 'true');
	assert.equal(live.element.dataset.state, 'live');
	assert.equal(live.element.querySelector('[aria-live], [role="status"], [role="alert"]'), null, 'nothing is announced per piece');
	live.destroy();
});

test('settle draws the final text at once without the mark; later pieces are ignored', () => {
	const live = new ui.LiveText({ text: 'Fix' }).mount(document.body);
	live.append('ed the');
	live.settle('Fixed the redirect.');
	assert.equal(frames.filter(Boolean).length, 0, 'the frame asked for is cancelled');
	assert.equal(live.text, 'Fixed the redirect.');
	assert.equal(live.state, 'settled');
	assert.equal(live.element.querySelector('.bui-live-body').textContent, 'Fixed the redirect.');
	assert.equal(live.element.querySelector('.bui-live-mark'), null);
	assert.equal(live.element.hasAttribute('aria-busy'), false);
	live.append(' more');
	live.set('other');
	frame();
	assert.equal(live.text, 'Fixed the redirect.');
	live.destroy();
});

test('plain text keeps its line breaks; set replaces the whole draft; a throwing renderer falls back to plain text', () => {
	const live = new ui.LiveText({}).mount(document.body);
	live.append('one\ntwo');
	frame();
	const body = live.element.querySelector('.bui-live-body');
	assert.ok(body.hasAttribute('data-plain'));
	assert.equal(body.firstChild.nodeType, 3);
	assert.equal(body.firstChild.data, 'one\ntwo');
	const text = body.firstChild;
	live.set('whole snapshot');
	frame();
	assert.ok(body.firstChild === text, 'the one text node is written in place');
	assert.equal(live.text, 'whole snapshot');
	live.destroy();
	const reports = [];
	const report = globalThis.reportError;
	globalThis.reportError = error => reports.push(error.message);
	const broken = new ui.LiveText({ text: 'safe', render: () => { throw new Error('bad markdown'); } }).mount(document.body);
	globalThis.reportError = report;
	assert.equal(broken.element.querySelector('.bui-live-body').textContent.replace('Writing…', '').trim(), 'safe');
	assert.deepEqual(reports, ['bad markdown']);
	broken.destroy();
});

test('abandon keeps the draft, muted, with its note; a completed text that arrives later still settles it', () => {
	const live = new ui.LiveText({ text: 'Half of an answer' }).mount(document.body);
	live.abandon();
	assert.equal(live.state, 'abandoned');
	assert.equal(live.element.querySelector('.bui-live-note').textContent, 'Unfinished · not kept');
	assert.equal(live.element.querySelector('.bui-live-mark'), null);
	assert.equal(live.element.hasAttribute('aria-busy'), false);
	live.append(' ignored');
	assert.equal(live.text, 'Half of an answer');
	live.settle('The whole answer.');
	assert.equal(live.state, 'settled');
	assert.equal(live.element.querySelector('.bui-live-note'), null);
	assert.equal(live.element.querySelector('.bui-live-body').textContent, 'The whole answer.');
	live.destroy();
	const noted = new ui.LiveText({ labels: ui.LiveText.labels.es }).mount(document.body);
	assert.equal(noted.element.querySelector('.bui-live-mark').textContent.trim(), 'Escribiendo…');
	noted.abandon();
	assert.equal(noted.element.querySelector('.bui-live-note').textContent, 'Sin terminar · no se guardó');
	noted.destroy();
	const custom = new ui.LiveText({}).mount(document.body);
	custom.abandon('Interrupted · not kept');
	assert.equal(custom.element.querySelector('.bui-live-note').textContent, 'Interrupted · not kept');
	custom.destroy();
});

test('bounded: past the bound the pieces are dropped and truncated says so; destroy cancels the frame', () => {
	const live = new ui.LiveText({ bound: 10 }).mount(document.body);
	live.append('0123456789');
	live.append('abc');
	assert.equal(live.text, '0123456789');
	assert.equal(live.truncated, true);
	assert.equal(ui.LiveText.bound, 64_000);
	live.destroy();
	assert.equal(frames.filter(Boolean).length, 0, 'no frame is left behind');
	assert.equal(document.querySelector('.bui-live'), null);
});

test('without requestAnimationFrame a short timer stands in, still once for many pieces', async () => {
	globalThis.requestAnimationFrame = undefined;
	let calls = 0;
	const live = new ui.LiveText({ render: text => ((calls += 1), text) }).mount(document.body);
	live.append('a');
	live.append('b');
	await new Promise(resolve => setTimeout(resolve, 40));
	assert.equal(calls, 2, 'drawn when made and once for both pieces');
	assert.equal(live.text, 'ab');
	live.destroy();
});
