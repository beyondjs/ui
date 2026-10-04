import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page as Window } from './support/page.mjs';
import { inside } from './fixtures/family.mjs';

/** The React page system of 0.6.0: the same markup as the DOM classes, and the bar's "Language and appearance". */
const page = new Window();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
const dom = await import('@beyond-js/ui/dom');
const ui = await import('@beyond-js/ui/react');
const h = React.createElement;
const { act, StrictMode } = React;
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
/** Tag, sorted attributes (ids replaced) and children: the markup without attribute order or generated ids. */
const shape = node => (node.nodeType === 3 ? node.textContent : { tag: node.tagName, attributes: [...node.attributes].map(({ name, value }) => `${name}=${/^(id|aria-labelledby)$/.test(name) ? 'id' : value}`).sort(), children: [...node.childNodes].map(shape) });

test('Page, PageHeader and Section render the DOM classes\' markup', async () => {
	await render(
		h(ui.Page, {
			template: 'detail',
			width: 'standard',
			header: h(ui.PageHeader, { title: 'web', crumbs: [{ label: 'Environments', href: '/environments' }], status: h(ui.Status, { label: 'Ready', tone: 'success' }), facts: 'Compute Engine', actions: h(ui.Button, { label: 'Start', variant: 'primary' }) }),
			aside: h('p', null, 'Facts'),
			label: 'About web'
		}, h(ui.Section, { title: 'Repositories', description: 'Copies on this machine.' }, h('p', null, 'acme/web')))
	);
	const header = new dom.PageHeader({ title: 'web', crumbs: [{ label: 'Environments', href: '/environments' }], status: dom.status('Ready', 'success'), facts: 'Compute Engine', actions: [new dom.Button({ label: 'Start', variant: 'primary' })] });
	const section = new dom.Section({ title: 'Repositories', description: 'Copies on this machine.', children: [dom.el('p', { text: 'acme/web' })] });
	const expected = new dom.Page({ template: 'detail', width: 'standard', header, children: [section.element], aside: [dom.el('p', { text: 'Facts' })], label: 'About web' });
	// The DOM header keeps its empty parts hidden; React leaves them out.
	for (const node of expected.element.querySelectorAll('[hidden]')) node.remove();
	assert.deepEqual(shape(host.firstElementChild), shape(expected.element));
	assert.throws(() => ui.Page({ width: 'wide' }), /width is one of/);
});

test('Arrival and Tabs drive the DOM classes; the bar\'s preferences entry opens the dialog', async () => {
	const seen = [];
	let dismissed = 0;
	await render(h('div', null, h(ui.Arrival, { product: 'Conduict', href: '/back', onNavigate: item => seen.push(item.href), onDismiss: () => dismissed++ }), h(ui.Tabs, { items: [{ label: 'Overview', href: '#o', current: true }, { label: 'Repositories', href: '#r' }] })));
	assert.equal(document.querySelectorAll('.bui-arrival').length, 1, 'the development double mount leaves one line');
	assert.equal(document.querySelector('.bui-arrival').textContent, 'Opened from Conduict · Back to Conduict');
	document.querySelector('.bui-arrival-back').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
	assert.deepEqual(seen, ['/back']);
	await act(() => document.querySelector('.bui-arrival-dismiss').click());
	assert.equal(dismissed, 1);
	assert.equal(document.querySelector('.bui-tabs [aria-current="page"]').textContent, 'Overview');
	const values = new dom.Preferences({ key: 'beyond-react', fallback: { appearance: 'system', locale: 'en' }, storage: null });
	await render(h(ui.FamilyBar, { product: 'delegate', brand: { src: '/brand.svg', href: '/' }, descriptor: inside, account: { signout: () => {}, preferences: { preferences: values, everywhere: '/account' } } }));
	const entry = document.querySelector('.bui-family-preferences');
	assert.equal(entry.textContent, 'Language and appearance');
	await act(async () => entry.click());
	assert.ok(document.querySelector('dialog.bui-dialog')?.open);
});
