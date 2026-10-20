import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { groups, rail } from './fixtures/sidebar-rail.mjs';

const page = new Page();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
const ui = await import('@beyond-js/ui/react');
const { act } = React;
let root;
let host;
after(async () => { if (root) await act(() => root.unmount()); page.close(); });
beforeEach(async () => {
	if (root) await act(() => root.unmount());
	page.reset();
	page.window.happyDOM.setViewport({ width: 1440, height: 900 });
	host = document.body.appendChild(document.createElement('div'));
	root = createRoot(host);
});

test('React rail survives StrictMode and reads the latest callback and controlled options', async () => {
	const calls = [];
	const render = (name, open = true) => React.createElement(React.StrictMode, null, React.createElement(ui.Sidebar, { product: 'Conduict', groups, rail: { ...rail, open, onChange: value => calls.push(`${name}:${value}`) } }));
	await act(() => root.render(render('first')));
	await act(() => root.render(render('second')));
	const trigger = host.querySelector('.bui-sidebar-rail-item[aria-expanded]');
	await act(() => trigger.click());
	assert.deepEqual(calls, ['second:false']);
	assert.equal(host.querySelector('.bui-sidebar-panel').hidden, true);
	await act(() => root.render(render('third', false)));
	await act(() => root.render(render('fourth', true)));
	assert.equal(host.querySelector('.bui-sidebar-panel').hidden, false);
	assert.ok(host.querySelector('.bui-sidebar-rail-item[aria-expanded]') === trigger, 'a prop update keeps the rail control');
	await act(() => trigger.click());
	assert.deepEqual(calls, ['second:false', 'fourth:false']);
	await act(() => root.unmount());
	root = null;
	assert.equal(host.children.length, 0);
});
