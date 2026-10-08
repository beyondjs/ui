import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page as Window } from './support/page.mjs';

/** The React forms of 0.11.2: the Composer's summary and drop surface by ref, `CopyButton` from the latest props, `Bytes` re-exported, the Disclosure's placement. */
const page = new Window();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
const ui = await import('@beyond-js/ui/react');
const h = React.createElement;
const { act, StrictMode, useRef } = React;
let root = null;
let host = null;

after(() => page.close());
beforeEach(async () => {
	if (root) await act(() => root.unmount());
	page.reset();
	host = document.createElement('div');
	document.body.append(host);
	root = createRoot(host);
});

const render = element => act(() => root.render(h(StrictMode, null, element)));
const dragged = (type, files = []) => {
	const event = new Event(type, { bubbles: true, cancelable: true });
	Object.defineProperty(event, 'dataTransfer', { value: { files, types: ['Files'], dropEffect: 'none' } });
	return event;
};

test('the Composer says its summary beside Options and takes drops on the surface its ref names', async () => {
	const heard = [];
	function Dock({ summary }) {
		const surface = useRef(null);
		return h('main', { ref: surface, className: 'surface' }, h('section', { className: 'thread' }), h(ui.Composer, { label: 'Message', summary, settings: h(ui.ChoiceChip, { label: 'Model', options: [{ value: 'a', label: 'Opus 5.5' }, { value: 'b', label: 'Sonnet 5' }], value: 'a' }), attach: { onFiles: (files, via) => heard.push([via, files.map(file => file.name)]), zone: surface }, onSubmit: async () => undefined }));
	}
	await render(h(Dock, { summary: 'Opus 5.5' }));
	const more = document.querySelector('.bui-composer-more');
	assert.equal(more.getAttribute('aria-label'), 'Options · Opus 5.5');
	await render(h(Dock, { summary: 'Sonnet 5' }));
	assert.equal(more.getAttribute('aria-label'), 'Options · Sonnet 5', 'a new summary is applied');
	const thread = document.querySelector('.thread');
	const over = dragged('dragover');
	await act(() => thread.dispatchEvent(over));
	assert.equal(over.defaultPrevented, true, 'the surface takes files');
	await act(() => thread.dispatchEvent(dragged('drop', [new page.window.File(['x'], 'a.png', { type: 'image/png' })])));
	assert.deepEqual(heard, [['drop', ['a.png']]]);
});

test('CopyButton copies the latest text and says Copied in place; Bytes and the Disclosure placement are exported', async () => {
	const written = [];
	Object.defineProperty(page.window.navigator, 'clipboard', { value: { writeText: text => (written.push(text), Promise.resolve()) }, configurable: true });
	const results = [];
	await render(h(ui.CopyButton, { text: 'one', label: 'Copy link', onResult: copied => results.push(copied) }));
	await render(h(ui.CopyButton, { text: 'two', label: 'Copy link', onResult: copied => results.push(copied) }));
	const button = document.querySelector('.bui-copy-button button');
	await act(async () => {
		button.click();
		await new Promise(resolve => setTimeout(resolve, 20));
	});
	assert.deepEqual(written, ['two'], 'the latest text');
	assert.deepEqual(results, [true]);
	assert.equal(button.textContent, 'Copied');
	assert.equal(ui.CopyButton.labels.es.copied, 'Copiado');
	assert.equal(new ui.Bytes().of(99), '99 B');
	await render(h(ui.Disclosure, { label: 'Details', placement: 'above' }, h('p', null, 'Inside')));
	assert.ok(document.querySelector('.bui-disclosure-button'));
	delete page.window.navigator.clipboard;
});
