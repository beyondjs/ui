import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { Page as Window } from './support/page.mjs';

/** The React `Page` follows focus over its document in a development build (0.44.0, D187), once under StrictMode, and stops when it unmounts. */
const page = new Window();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
const ui = await import('@beyond-js/ui/react');
const h = React.createElement;
const { act, StrictMode } = React;
after(() => page.close());

test('a React Page warns once for a place reading starts that draws an outline, and nothing once unmounted', async () => {
	const warnings = [];
	const original = console.warn;
	console.warn = message => warnings.push(message);
	ui.Focus.enabled = true;
	const host = document.body.appendChild(document.createElement('div'));
	const root = createRoot(host);
	const ringed = { outline: '2px solid rgb(203, 98, 69)' };
	const said = () => warnings.filter(message => typeof message === 'string' && message.includes('D187'));
	try {
		await act(() => root.render(h(StrictMode, null, h(ui.Page, { header: h(ui.PageHeader, { title: 'Repositories' }) }, h('h2', { id: 'results', tabIndex: -1, style: ringed }, 'Results')))));
		document.getElementById('results').focus();
		await page.until(() => said().length > 0);
		await new Promise(resolve => setTimeout(resolve, 20));
		assert.equal(said().length, 1, 'one warning, though StrictMode mounted the effect twice');
		assert.match(said()[0], /the h2 "Results", focused for reading, draws an outline; D187: a place reading starts draws nothing\./);
		await act(() => root.unmount());
		const later = document.body.appendChild(Object.assign(document.createElement('h2'), { textContent: 'Later', tabIndex: -1 }));
		later.style.outline = ringed.outline;
		later.focus();
		await new Promise(resolve => setTimeout(resolve, 20));
		assert.equal(said().length, 1, 'an unmounted page stops following');
	} finally {
		ui.Focus.enabled = false;
		console.warn = original;
	}
});
