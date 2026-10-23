import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
const page = new Page();
const { Recovery, RetryAction, Unavailable, TechnicalDetails } = await import('@beyond-js/ui');
after(() => page.close());

const options = { events: null, page: null };
/** What a sighted person reads first: the notice without its folded evidence. */
const said = recovery => [...recovery.element.children].filter(node => !node.matches('details, .bui-hidden')).map(node => node.textContent).join(' | ');

test('one line says who did not answer, when it last tried and one Try again, and lists nothing (D163)', async () => {
	const recovery = new Recovery({ title: 'Beyond Accounts did not answer', again: options });
	recovery.set('machines', { title: 'Machines', details: { request: 'req_1', text: 'Beyond Accounts is unavailable', time: '2026-10-23T10:04:05Z' }, run: async () => false });
	recovery.set('work', { title: 'Your conversations', details: { request: 'req_2', text: 'Beyond Accounts is unavailable', time: '2026-10-23T10:04:06Z' }, run: async () => false });
	const notice = recovery.element;
	assert.equal(notice.hidden, false);
	assert.equal(notice.dataset.recovery, 'line');
	assert.equal(notice.querySelector('.bui-recovery-title').localName, 'p', 'a line, not a heading');
	assert.ok(notice.querySelector('.bui-recovery-mark .bui-icon'), 'the outage mark');
	assert.equal([...notice.querySelectorAll('button')].filter(button => !button.closest('details')).length, 1, 'one Try again');
	assert.match(notice.querySelector('.bui-again').textContent, /^Last tried \d\d:\d\d · trying again by itself$/);
	assert.doesNotMatch(said(recovery), /Machines|Your conversations/, 'the affected reads are said in their own places, not here');
	assert.equal(notice.querySelectorAll('details').length, 1, 'one Technical details for the incident');
	assert.equal(notice.querySelector(':scope > .bui-hidden[role="status"]').textContent, 'Beyond Accounts did not answer', 'said once, when it appears');
	recovery.destroy();
});

test('Technical details keep every read: a row each with its request and time, shared words said once', () => {
	const recovery = new Recovery({ title: 'Beyond Accounts did not answer', again: options, locale: 'en-GB' });
	recovery.set('machines', { title: 'Machines', details: { request: 'req_1', text: 'Beyond Accounts is unavailable', time: '2026-10-23T10:04:05Z' }, run: async () => false });
	recovery.set('work', { title: 'Your conversations', details: { request: 'req_2', text: 'Beyond Accounts is unavailable', time: '2026-10-23T10:04:06Z' }, run: async () => false });
	recovery.set('stream', { title: 'Live updates', automatic: false, run: () => false });
	const details = recovery.element.querySelector('details');
	const rows = [...details.querySelectorAll('tbody tr')].map(row => [...row.children].map(cell => cell.textContent));
	assert.deepEqual(rows.map(row => row.slice(0, 2)), [['Machines', 'req_1'], ['Your conversations', 'req_2']], 'only reads with evidence get a row');
	assert.deepEqual([...details.querySelectorAll('thead th')].map(cell => cell.textContent), ['Affected', 'Request', 'Time']);
	assert.equal(details.querySelectorAll('pre').length, 1, 'the words every read said, once');
	assert.equal(details.querySelectorAll('time')[0].getAttribute('datetime'), '2026-10-23T10:04:05.000Z');
	recovery.set('work', { title: 'Your conversations', details: { request: 'req_2', text: 'Timed out after 8 s', time: null }, run: async () => false });
	assert.equal(details.querySelectorAll('.bui-details-said').length, 2, 'different words go under their own row');
	assert.equal(details.querySelectorAll('time').length, 1, 'a missing time stays empty, never invented');
	recovery.destroy();
});

test('whole: the notice is the page body in Unavailable’s form, and a line again when the page has content', () => {
	const recovery = new Recovery({ title: 'Beyond Accounts did not answer', again: options, whole: true });
	recovery.set('project', { title: 'The project', run: async () => false });
	const title = () => recovery.element.querySelector('.bui-recovery-title');
	assert.equal(recovery.element.dataset.recovery, 'page');
	assert.equal(title().localName, 'h2');
	assert.equal(recovery.element.getAttribute('aria-labelledby'), title().id);
	recovery.whole = false;
	assert.equal(recovery.element.dataset.recovery, 'line');
	assert.equal(title().localName, 'p');
	assert.equal(recovery.element.getAttribute('aria-labelledby'), title().id, 'the label keeps pointing at the title');
	assert.equal(new Recovery({ title: 'x', again: options, whole: true, level: 3 }).element.querySelector('.bui-recovery-title').localName, 'h3');
	recovery.title = 'Beyond Projects did not answer';
	assert.equal(title().textContent, 'Beyond Projects did not answer');
	recovery.destroy();
});

test('one scoped notice retries reads and streams without merging another scope', async () => {
	const recovery = new Recovery({ title: 'Conduict did not answer', again: options });
	const other = new Recovery({ title: 'Beyond Projects did not answer', again: options });
	let reads = 0, streams = 0;
	recovery.set('read', { title: 'Repositories', details: { request: 'read-1', text: 'NETWORK' }, run: async () => { reads++; return true; } });
	recovery.set('stream', { title: 'Updates', automatic: false, run: () => { streams++; return false; } });
	other.set('read', { title: 'Notifications', run: async () => false });
	assert.match(recovery.element.querySelector('details').textContent, /read-1/);
	await recovery.now();
	assert.equal(reads, 1); assert.equal(streams, 1);
	assert.equal(recovery.size, 1, 'a read success does not claim the stream recovered');
	assert.equal(recovery.element.querySelector('details'), null, 'its evidence left with it');
	assert.equal(other.size, 1, 'an independent upstream failure stays');
	recovery.delete('stream');
	assert.equal(recovery.element.hidden, true);
	assert.equal(recovery.element.querySelector(':scope > .bui-hidden[role="status"]').textContent, '');
	recovery.destroy(); other.destroy();
});

test('a running try is shared; late success cannot erase a replacement failure or resurrect a destroyed notice', async () => {
	const recovery = new Recovery({ title: 'Connection', again: options });
	let release, calls = 0;
	const waiting = new Promise(resolve => { release = resolve; });
	recovery.set('read', { title: 'Old read', details: { text: 'old' }, run: () => { calls++; return waiting; } });
	const first = recovery.now();
	const second = recovery.now();
	await new Promise(resolve => setImmediate(resolve));
	assert.equal(calls, 1);
	recovery.set('read', { title: 'New read', details: { text: 'new' }, run: async () => false });
	release(true); await Promise.all([first, second]);
	assert.equal(recovery.size, 1);
	assert.match(recovery.element.querySelector('details').textContent, /New read/);
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

test('one disclosure keeps its expansion, focused Copy and copy result while reads come and go', async () => {
	const recovery = new Recovery({ title: 'Connection', again: options }).mount(document.body);
	const read = { title: 'Repositories', details: { request: 'one', text: 'First evidence' }, run: async () => false };
	recovery.set('read', read);
	const details = recovery.element.querySelector('details');
	details.open = true;
	const copy = details.querySelector('button'); copy.focus();
	const summary = recovery.element.querySelector(':scope > .bui-hidden[role="status"]');
	const announced = summary.firstChild;
	recovery.set('read', { ...read, details: { request: 'two', text: 'New evidence' } });
	assert.equal(recovery.element.querySelector('details'), details);
	assert.equal(details.open, true);
	assert.equal(document.activeElement, copy);
	assert.equal(summary.firstChild, announced, 'new evidence is not announced again');
	assert.match(details.textContent, /New evidence/);
	const result = details.querySelector('.bui-details-result'); result.textContent = 'Copied';
	recovery.set('stream', { title: 'Updates paused', automatic: false, run: () => false });
	recovery.delete('stream');
	assert.equal(details.open, true);
	assert.equal(document.activeElement, copy);
	assert.equal(result.textContent, 'Copied', 'a read without evidence leaves the disclosure as it was');
	recovery.set('read', { ...read, details: { request: 'two', text: 'New evidence' } });
	assert.equal(result.textContent, 'Copied', 'identical evidence does not erase copy feedback');
	recovery.set('more', { title: 'Machines', details: { request: 'three', text: 'New evidence' }, run: async () => false });
	assert.equal(details.open, true, 'another read keeps the disclosure open');
	assert.equal(result.textContent, '', 'changed evidence clears an earlier copy result');
	recovery.destroy();
});

test('focus moves only when what holds it leaves; shared reads run once', async () => {
	const recovery = new Recovery({ title: 'Connection', again: options }).mount(document.body);
	let count = 0;
	const run = async () => { count++; return false; };
	recovery.set('a', { title: 'First', details: { text: 'First' }, run });
	recovery.set('b', { title: 'Second', details: { text: 'Second' }, run });
	await recovery.now();
	assert.equal(count, 1, 'one bounded read can answer multiple symptoms');
	const details = recovery.element.querySelector('details');
	details.open = true; details.querySelector('button').focus();
	recovery.delete('a');
	assert.equal(document.activeElement, details.querySelector('button'), 'the evidence of another read keeps it');
	recovery.set('c', { title: 'Third', run });
	recovery.delete('b');
	assert.equal(details.isConnected, false);
	assert.equal(document.activeElement, recovery.element.querySelector('.bui-recovery-actions button'), 'the evidence left: Try again');
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
		recovery.element.querySelector('.bui-recovery-actions button').focus();
		recovery.delete('read');
		assert.equal(document.activeElement, heading);
	} finally { navigator.clipboard.writeText = saved; recovery.destroy(); heading.remove(); }
});

test('TechnicalDetails copies one block per affected read, in Spanish too', () => {
	const details = new TechnicalDetails({
		labels: TechnicalDetails.labels.es,
		entries: [
			{ label: 'Máquinas', request: 'req_1', time: '2026-10-23T10:04:05Z', text: 'Sin respuesta' },
			{ label: 'Conversaciones', request: null, time: null, text: 'Sin respuesta' }
		]
	});
	assert.equal(details.report, 'Sin respuesta\n\nMáquinas\nSolicitud: req_1\nHora: 2026-10-23T10:04:05.000Z\n\nConversaciones');
	assert.deepEqual([...details.element.querySelectorAll('thead th')].map(cell => cell.textContent), ['Afectado', 'Solicitud', 'Hora']);
	details.update({ entries: [] });
	assert.equal(details.element.querySelector('table'), null, 'no reads, no table');
	details.destroy();
});
