import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
const page = new Page();
const { Recovery, RetryAction, Unavailable } = await import('@beyond-js/ui');
after(() => page.close());

const options = { events: null, page: null };

test('one scoped notice preserves each symptom and retries reads and streams without merging another scope', async () => {
	const recovery = new Recovery({ title: 'Conduict connection', again: options });
	const other = new Recovery({ title: 'Projects connection', again: options });
	let reads = 0, streams = 0;
	recovery.set('read', { title: 'Repositories unavailable', details: { request: 'read-1', text: 'NETWORK' }, run: async () => { reads++; return true; } });
	recovery.set('stream', { title: 'Updates paused', automatic: false, run: () => { streams++; return false; } });
	other.set('read', { title: 'Notifications unavailable', run: async () => false });
	assert.equal(recovery.element.querySelectorAll('.bui-unavailable-actions button').length, 1);
	assert.match(recovery.element.textContent, /Repositories unavailable/);
	assert.match(recovery.element.textContent, /Updates paused/);
	assert.match(recovery.element.textContent, /read-1/);
	await recovery.now();
	assert.equal(reads, 1); assert.equal(streams, 1);
	assert.equal(recovery.size, 1, 'a read success does not claim the stream recovered');
	assert.equal(other.size, 1, 'an independent upstream failure stays');
	recovery.delete('stream');
	assert.equal(recovery.element.hidden, true);
	recovery.destroy(); other.destroy();
});

test('a running try is shared; late success cannot erase a replacement failure or resurrect a destroyed notice', async () => {
	const recovery = new Recovery({ title: 'Connection', again: options });
	let release, calls = 0;
	const waiting = new Promise(resolve => { release = resolve; });
	recovery.set('read', { title: 'Old read', run: () => { calls++; return waiting; } });
	const first = recovery.now();
	const second = recovery.now();
	await new Promise(resolve => setImmediate(resolve));
	assert.equal(calls, 1);
	recovery.set('read', { title: 'New read', run: async () => false });
	release(true); await Promise.all([first, second]);
	assert.equal(recovery.size, 1);
	assert.match(recovery.element.textContent, /New read/);
	recovery.destroy();
	await recovery.now();
	assert.equal(recovery.size, 0);
});

test('automatic reads preserve transport-owned backoff and stop after a refusal answer', async () => {
	let scheduled;
	const timers = { setTimeout: work => (scheduled = work, 1), clearTimeout: () => { scheduled = null; } };
	const recovery = new Recovery({ title: 'Connection', again: { ...options, timers } });
	let streams = 0;
	recovery.set('stream', { title: 'Paused', automatic: false, run: () => { streams++; return false; } });
	assert.equal(scheduled, undefined);
	recovery.set('read', { title: 'Unavailable', run: async () => ({ refused: true }) });
	const fire = scheduled; scheduled = null; fire();
	await new Promise(resolve => setImmediate(resolve));
	assert.equal(streams, 0);
	assert.equal(recovery.size, 1);
	assert.equal(scheduled, null);
	recovery.destroy();
});

test('recovery actions have the same labelled icon and style, with single-flight activation', async () => {
	let calls = 0, finish;
	const action = new RetryAction({ labels: RetryAction.labels.es, run: () => { calls++; return new Promise(resolve => { finish = resolve; }); } });
	assert.equal(action.element.textContent, 'Reintentar');
	assert.ok(action.element.querySelector('.bui-icon'));
	assert.ok(action.element.classList.contains('bui-button-secondary'));
	action.element.click(); action.element.click();
	assert.equal(calls, 1);
	assert.equal(action.element.getAttribute('aria-disabled'), 'true');
	finish(); await new Promise(resolve => setImmediate(resolve));
	assert.equal(action.element.getAttribute('aria-disabled'), null);
	const unavailable = new Unavailable({ title: 'Unavailable', reason: 'No answer', kind: 'outage', again: { ...options, run: async () => false } });
	assert.ok(unavailable.element.querySelector('.bui-unavailable-actions .bui-icon'));
	action.destroy(); unavailable.destroy();
});

test('keyed diagnostics retain expansion, focused Copy and copy result when another symptom changes', async () => {
	const recovery = new Recovery({ title: 'Connection', again: options }).mount(document.body);
	const read = { title: 'Repositories unavailable', details: { request: 'one', text: 'First evidence' }, run: async () => false };
	recovery.set('read', read);
	const details = recovery.element.querySelector('details');
	details.open = true;
	const copy = details.querySelector('button'); copy.focus();
	const summary = recovery.element.querySelector('[role="status"]');
	const announced = summary.firstChild;
	recovery.set('read', { ...read, details: { request: 'two', text: 'New evidence' } });
	assert.equal(recovery.element.querySelector('details'), details);
	assert.equal(details.open, true);
	assert.equal(document.activeElement, copy);
	assert.equal(details.querySelector('button'), copy);
	assert.equal(summary.firstChild, announced, 'diagnostic-only refresh does not reannounce the symptom');
	assert.match(details.textContent, /New evidence/);
	const result = details.querySelector('.bui-details-result'); result.textContent = 'Copied';
	recovery.set('stream', { title: 'Updates paused', automatic: false, run: () => false });
	recovery.delete('stream');
	assert.equal(details.open, true);
	assert.equal(document.activeElement, copy);
	assert.equal(result.textContent, 'Copied');
	recovery.set('read', { ...read, details: { request: 'two', text: 'New evidence' } });
	assert.equal(result.textContent, 'Copied', 'identical evidence does not erase copy feedback');
	recovery.destroy();
});

test('partial recovery moves focus only when its focused symptom is removed; shared reads run once', async () => {
	const recovery = new Recovery({ title: 'Connection', again: options }).mount(document.body);
	let count = 0;
	const run = async () => { count++; return false; };
	recovery.set('a', { title: 'First', details: { text: 'First' }, run });
	recovery.set('b', { title: 'Second', details: { text: 'Second' }, run });
	await recovery.now();
	assert.equal(count, 1, 'one bounded read can answer multiple symptoms');
	const [first, second] = recovery.element.querySelectorAll('details');
	second.open = true; second.querySelector('button').focus();
	recovery.delete('a');
	assert.equal(document.activeElement, second.querySelector('button'));
	assert.equal(second.open, true);
	assert.equal(first.isConnected, false);
	recovery.set('c', { title: 'Third', run });
	recovery.delete('b');
	assert.equal(document.activeElement, recovery.element.querySelector('.bui-unavailable-actions button'));
	recovery.destroy();
});

test('final recovery restores focus outside the hidden notice and a late copy never claims new evidence was copied', async () => {
 const heading = document.createElement('h1'); heading.tabIndex = -1; document.body.append(heading);
 const recovery = new Recovery({ title: 'Connection', again: options, focus: () => heading }).mount(document.body);
 const run = async () => false;
 const entry = { title: 'Read', details: { text: 'Old evidence' }, run };
 recovery.set('read', entry);
 const details = recovery.element.querySelector('details'); details.open = true;
 const saved = navigator.clipboard.writeText;
 let finish;
 navigator.clipboard.writeText = () => new Promise(resolve => { finish = resolve; });
 try {
  details.querySelector('button').click();
  recovery.set('read', { ...entry, details: { text: 'New evidence' } });
  finish(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(details.querySelector('.bui-details-result').textContent, '');
  recovery.element.querySelector('.bui-unavailable-actions button').focus();
  recovery.delete('read');
  assert.equal(document.activeElement, heading);
 } finally { navigator.clipboard.writeText = saved; recovery.destroy(); heading.remove(); }
});
