import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/**
 * 0.44.0 in React: the components choose their words by the DOM `Labels`' rule (given `labels` win, then
 * `locale`, then `<html lang>`, then English), and `labels: X.labels.es` keeps working. Also run on React 18.
 */
const page = new Page();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
const ui = await import('@beyond-js/ui/react');
const h = React.createElement;
const { act, StrictMode } = React;
const html = document.documentElement;
let root = null;
let host = null;

after(() => page.close());
beforeEach(async () => {
	if (root) await act(() => root.unmount());
	page.reset();
	html.removeAttribute('lang');
	host = document.createElement('div');
	document.body.append(host);
	root = createRoot(host);
});

const render = element => act(() => root.render(h(StrictMode, null, element)));
const outage = (more = {}) => h(ui.Unavailable, { title: 'Beyond Projects did not answer', reason: 'Nothing was changed.', owner: 'Beyond', kind: 'outage', again: async () => false, ...more });
const said = () => ({
	owner: host.querySelector('.bui-unavailable-label').textContent,
	retry: host.querySelector('.bui-unavailable-actions button').textContent.trim(),
	line: host.querySelector('.bui-again').textContent
});

test('React Unavailable speaks Spanish given only locale es', async () => {
	await render(outage({ locale: 'es' }));
	const shown = said();
	assert.deepEqual([shown.owner, shown.retry], ['Quién puede cambiarlo: ', 'Reintentar']);
	assert.match(shown.line, /^Último intento \d\d:\d\d · se vuelve a intentar por sí solo$/);
});

test('React Unavailable speaks the page language given nothing, and English without one', async () => {
	await render(outage());
	assert.deepEqual([said().owner, said().retry], ['Who can change this: ', 'Try again']);
	assert.match(said().line, /^Last tried/);
	await act(() => root.unmount());
	root = createRoot(host);
	html.setAttribute('lang', 'es');
	await render(outage());
	assert.deepEqual([said().owner, said().retry], ['Quién puede cambiarlo: ', 'Reintentar']);
	assert.match(said().line, /^Último intento/);
});

test('React Unavailable keeps Unavailable.labels.es on an English page, and fills a partial set from the language', async () => {
	await render(outage({ labels: ui.Unavailable.labels.es }));
	assert.equal(said().retry, 'Reintentar');
	assert.match(said().line, /^Último intento/);
	await render(outage({ labels: { owner: 'Lo decide: ' }, locale: 'es' }));
	assert.deepEqual([said().owner, said().retry], ['Lo decide: ', 'Reintentar']);
});

test('React RetryAction, Recovery, Loading, Waiting, EndLine and Field follow the same rule', async () => {
	await render(h(React.Fragment, null, h(ui.RetryAction, { locale: 'es', onClick: () => {} }), h(ui.Loading), h(ui.EndLine)));
	assert.equal(host.querySelector('button').textContent.trim(), 'Reintentar');
	assert.equal(host.querySelector('.bui-loading').textContent, 'Loading…');
	assert.equal(host.querySelector('.bui-rows-end').textContent, 'Nothing more');
	html.setAttribute('lang', 'es');
	await render(
		h(
			React.Fragment,
			null,
			h(ui.Recovery, { title: 'Beyond Accounts no respondió', reads: [{ key: 'machines', title: 'Máquinas', run: async () => false }], again: { events: null, page: null } }),
			h(ui.Loading),
			h(ui.Waiting),
			h(ui.EndLine),
			h(ui.Field, { label: 'Nombre', optional: true }, h('input'))
		)
	);
	assert.equal([...host.querySelectorAll('.bui-recovery button')].find(button => !button.closest('details')).textContent.trim(), 'Reintentar');
	assert.equal(host.querySelector('.bui-loading').textContent, 'Cargando…');
	assert.equal(host.querySelector('.bui-waiting-label').textContent, 'Cargando…');
	assert.equal(host.querySelector('.bui-rows-end').textContent, 'No hay más');
	assert.equal(host.querySelector('.bui-field-optional').textContent.trim(), '(opcional)');
});
