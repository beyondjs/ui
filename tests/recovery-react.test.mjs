import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
const page = new Page();
const environment = globalThis.IS_REACT_ACT_ENVIRONMENT;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react');
const { createRoot } = await import('react-dom/client');
const { RetryAction } = await import('@beyond-js/ui/react');
after(async () => { await page.close(); if (environment === undefined) delete globalThis.IS_REACT_ACT_ENVIRONMENT; else globalThis.IS_REACT_ACT_ENVIRONMENT = environment; });

test('React retry has the shared glyph and secondary style and ignores rapid duplicate activation', async () => {
	const host = document.createElement('div'); document.body.append(host);
	const root = createRoot(host);
	let count = 0, finish;
	await React.act(async () => root.render(React.createElement(RetryAction, { labels: RetryAction.labels.es, onClick: () => { count++; return new Promise(resolve => { finish = resolve; }); } })));
	const button = host.querySelector('button');
	assert.equal(button.textContent, 'Reintentar');
	assert.ok(button.querySelector('.bui-icon'));
	assert.ok(button.classList.contains('bui-button-secondary'));
	await React.act(async () => { button.click(); button.click(); });
	assert.equal(count, 1);
	assert.equal(button.getAttribute('aria-disabled'), 'true');
	await React.act(async () => { finish(); });
	assert.equal(button.getAttribute('aria-disabled'), null);
	await React.act(async () => root.unmount());
});

test('StrictMode retry releases busy after two consecutive failures and keeps the latest props during updates', async () => {
	const host = document.createElement('div'); document.body.append(host);
	const root = createRoot(host);
	const calls = [];
	let reject;
	const action = name => () => { calls.push(name); return new Promise((resolve, fail) => { reject = fail; }); };
	const render = (name, label) => React.act(async () => root.render(React.createElement(React.StrictMode, null,
		React.createElement(RetryAction, { labels: { retry: label, busy: 'Reading {label}' }, onClick: action(name) }))));
	try {
		await render('first', 'Read repositories');
		const button = host.querySelector('button'); button.focus();
		await React.act(async () => { button.click(); button.click(); });
		assert.deepEqual(calls, ['first']);
		assert.equal(button.getAttribute('aria-disabled'), 'true');
		await render('second', 'Read machines');
		assert.equal(host.querySelector('button'), button, 'updates preserve the control');
		assert.equal(button.textContent, 'Reading Read machines');
		await React.act(async () => { reject(new Error('first read unavailable')); });
		assert.equal(button.getAttribute('aria-disabled'), null, 'first rejected retry releases busy under StrictMode');
		assert.equal(button.hasAttribute('data-busy'), false);
		assert.equal(button.textContent, 'Read machines');
		assert.equal(document.activeElement, button);
		await React.act(async () => { button.click(); button.click(); });
		assert.deepEqual(calls, ['first', 'second'], 'the second attempt uses the updated callback once');
		assert.equal(button.getAttribute('aria-disabled'), 'true');
		await React.act(async () => { reject(new Error('second read unavailable')); });
		assert.equal(button.getAttribute('aria-disabled'), null, 'second rejected retry also releases busy');
		assert.equal(button.hasAttribute('data-busy'), false);
		assert.ok(button.querySelector('.bui-icon'), 'the refresh glyph returns after rejection');
		assert.equal(button.querySelector('.bui-spinner'), null);
	} finally { await React.act(async () => root.unmount()); host.remove(); }
});

test('useBusy ignores retained callbacks after unmount and settles old work without changing a fresh mount', async () => {
	const { useBusy } = await import('@beyond-js/ui/react');
	const host = document.createElement('div'); document.body.append(host);
	const root = createRoot(host);
	let current, reject, calls = 0;
	function Probe() {
		const [busy, run] = useBusy(); current = run;
		return React.createElement('output', null, String(busy));
	}
	const render = key => React.act(async () => root.render(React.createElement(React.StrictMode, null, React.createElement(Probe, { key }))));
	try {
		await render('old');
		const old = current;
		let pending;
		await React.act(async () => { pending = old(() => { calls++; return new Promise((resolve, fail) => { reject = fail; }); }); });
		assert.equal(host.textContent, 'true');
		await render('new');
		const fresh = current;
		assert.notEqual(fresh, old);
		assert.equal(host.textContent, 'false');
		const failure = new Error('old request unavailable');
		await React.act(async () => { const checked = assert.rejects(pending, error => error === failure); reject(failure); await checked; });
		assert.equal(host.textContent, 'false', 'the old settlement cannot change the new mount');
		await React.act(async () => { assert.equal(await old(() => { calls++; }), undefined); });
		assert.equal(calls, 1, 'an unmounted hook cannot start another operation');
		await React.act(async () => { await fresh(async () => { calls++; }); });
		assert.equal(calls, 2); assert.equal(host.textContent, 'false');
	} finally { await React.act(async () => root.unmount()); host.remove(); }
});

test('a rejected RetryAction after unmount leaves its replacement usable', async () => {
	const host = document.createElement('div'); document.body.append(host);
	const root = createRoot(host);
	let reject, calls = 0;
	const render = (key, onClick) => React.act(async () => root.render(React.createElement(React.StrictMode, null, React.createElement(RetryAction, { key, onClick }))));
	try {
		await render('old', () => new Promise((resolve, fail) => { reject = fail; }));
		await React.act(async () => host.querySelector('button').click());
		assert.equal(host.querySelector('button').getAttribute('aria-disabled'), 'true');
		await render('new', async () => { calls++; });
		await React.act(async () => reject(new Error('departed read unavailable')));
		const button = host.querySelector('button');
		assert.equal(button.getAttribute('aria-disabled'), null);
		await React.act(async () => button.click());
		assert.equal(calls, 1);
		assert.equal(button.getAttribute('aria-disabled'), null);
	} finally { await React.act(async () => root.unmount()); host.remove(); }
});
