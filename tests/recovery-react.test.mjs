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

test('React Recovery (0.24.0, D163): one line for the reads in its props; a read leaves when it leaves them', async () => {
	const { Recovery } = await import('@beyond-js/ui/react');
	const host = document.createElement('div'); document.body.append(host);
	const root = createRoot(host);
	const runs = [];
	const reads = names => names.map(name => ({ key: name, title: name, details: { request: `req_${name}`, text: 'Beyond Accounts is unavailable' }, run: async () => { runs.push(name); } }));
	const render = (names, whole = false) => React.act(async () => root.render(React.createElement(React.StrictMode, null,
		React.createElement(Recovery, { title: 'Beyond Accounts did not answer', reads: reads(names), whole, again: { events: null, page: null } }))));
	try {
		await render(['Machines', 'Conversations']);
		const notice = host.querySelector('.bui-recovery');
		assert.equal(host.querySelectorAll('.bui-recovery').length, 1, 'StrictMode leaves one notice');
		assert.equal(notice.hidden, false);
		assert.equal(notice.querySelector('.bui-recovery-title').textContent, 'Beyond Accounts did not answer');
		assert.equal(notice.querySelectorAll('tbody tr').length, 2);
		await React.act(async () => { notice.querySelector('.bui-recovery-actions button').click(); });
		await React.act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
		assert.deepEqual(runs.sort(), ['Conversations', 'Machines'], 'Try again reads each again');
		assert.equal(host.querySelector('.bui-recovery').hidden, false, 'only the props say a read answered');
		await render(['Conversations'], true);
		assert.equal(host.querySelectorAll('tbody tr').length, 1);
		assert.equal(host.querySelector('.bui-recovery').dataset.recovery, 'page');
		await render([]);
		assert.equal(host.querySelector('.bui-recovery').hidden, true);
	} finally { await React.act(async () => root.unmount()); host.remove(); }
});

test('useRecovery shares one notice with a Collection, which says “Not available right now” in place', async () => {
	const { Recovery, useRecovery, Collection, Section, LastUpdate, EmptyState } = await import('@beyond-js/ui/react');
	const host = document.createElement('div'); document.body.append(host);
	const root = createRoot(host);
	let down = true;
	const source = async () => {
		if (down) throw Object.assign(new Error('unavailable'), { outage: true, request: 'req_list' });
		return { rows: [{ id: 'r1', title: 'First' }], total: 1 };
	};
	function Page() {
		const notice = useRecovery({ title: 'Beyond Accounts did not answer', again: { events: null, page: null } });
		return React.createElement(React.Fragment, null,
			React.createElement(Recovery, { notice }),
			React.createElement(Collection, { label: 'Requests', columns: [{ key: 'title', label: 'Request', primary: true }], source, recovery: notice, outage: error => error.outage, details: error => ({ request: error.request }) }),
			React.createElement(Section, { title: 'Machines', unavailable: true }),
			React.createElement(Section, { title: 'Work', updated: { time: null } }, 'kept'),
			React.createElement(LastUpdate, { time: null, labels: LastUpdate.labels.es }),
			React.createElement(EmptyState, { kind: 'outage' }));
	}
	try {
		await React.act(async () => root.render(React.createElement(React.StrictMode, null, React.createElement(Page))));
		await React.act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
		const notice = host.querySelector('.bui-recovery');
		assert.equal(notice.hidden, false);
		assert.match(notice.querySelector('details').textContent, /Requests.*req_list/s);
		assert.equal(host.querySelector('.bui-collection .bui-empty-outage .bui-empty-title').textContent, 'Not available right now');
		assert.equal(host.querySelectorAll('.bui-section .bui-empty-outage').length, 1);
		assert.match(host.textContent, /May be out of date/);
		assert.match(host.textContent, /Puede no estar al día/);
		down = false;
		await React.act(async () => { notice.querySelector('.bui-recovery-actions button').click(); await new Promise(resolve => setTimeout(resolve, 20)); });
		assert.equal(host.querySelector('.bui-recovery').hidden, true, 'the list answered and left the notice');
		assert.ok(host.querySelector('.bui-collection tbody tr, .bui-collection .bui-rows li'));
	} finally { await React.act(async () => root.unmount()); host.remove(); }
});
