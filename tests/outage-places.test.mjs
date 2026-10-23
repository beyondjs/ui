import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { rows } from './fixtures/rows.mjs';

/** 0.24.0 (D163): what an outage affects says so in its own place, with no cause and no Try again of its own. */
const page = new Page();
const { EmptyState, LastUpdate, Section, Collection, Recovery } = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const options = { events: null, page: null };
const columns = [{ key: 'title', label: 'Request', primary: true }];
const settle = list => page.until(() => list.element.querySelector('.bui-collection-body').getAttribute('aria-busy') === 'false');

test('an outage’s place says it is not available, with its mark and no action, in English and Spanish', () => {
	const place = new EmptyState({ kind: 'outage', action: { label: 'Try again' }, clear: () => {} });
	assert.equal(place.element.dataset.kind, 'outage');
	assert.equal(place.element.querySelector('.bui-empty-title').textContent, 'Not available right now');
	assert.ok(place.element.querySelector('.bui-empty-mark .bui-icon'));
	assert.equal(place.element.querySelector('button, a'), null, 'Try again is the notice’s, never the place’s');
	assert.equal(new EmptyState({ kind: 'outage', labels: EmptyState.labels.es }).element.textContent, 'No disponible en este momento');
	assert.equal(new EmptyState({ kind: 'outage', title: 'Machines are not available right now' }).element.querySelector('.bui-empty-title').textContent, 'Machines are not available right now');
	assert.ok(Object.keys(EmptyState.labels.en).every(key => key in EmptyState.labels.es));
	assert.ok(place.element.classList.contains('bui-empty-unframed'), 'an outage’s place is one quiet line, with no box (0.24.1)');
	assert.ok(!new EmptyState({ kind: 'outage', frame: true }).element.classList.contains('bui-empty-unframed'), 'a box only when asked for');
	assert.ok(!new EmptyState({ kind: 'empty', title: 'No machines yet' }).element.classList.contains('bui-empty-unframed'), 'an empty place keeps its box');
});

test('kept content says when it was read, or that it may be out of date when that is unknown', () => {
	const now = Date.parse('2026-10-23T16:00:00Z');
	const today = new LastUpdate({ time: '2026-10-23T15:04:00Z', locale: 'en-GB', now: () => now });
	assert.match(today.text, /^Last updated \d\d:04$/);
	const earlier = new LastUpdate({ time: '2026-10-21T15:04:00Z', locale: 'en-GB', now: () => now });
	assert.match(earlier.text, /^Last updated 21 Oct, \d\d:04$/, 'another day says its day');
	assert.equal(new LastUpdate({}).text, 'May be out of date');
	assert.equal(new LastUpdate({ labels: LastUpdate.labels.es }).text, 'Puede no estar al día');
	assert.match(LastUpdate.say('2026-10-23T15:04:00Z', { labels: LastUpdate.labels.es, locale: 'es', now }), /^Última actualización: \d\d:04$/);
	today.time = null;
	assert.equal(today.text, 'May be out of date');
});

test('a section says its read did not answer in place and keeps its heading; kept content says its time', () => {
	const section = new Section({ title: 'Machines', actions: [document.createElement('button')], waiting: true });
	section.unavailable();
	assert.equal(section.element.getAttribute('aria-busy'), null, 'the wait ended');
	assert.equal(section.element.querySelector('.bui-section-title').textContent, 'Machines');
	assert.equal(section.element.querySelector('.bui-section-body .bui-empty-outage .bui-empty-title').textContent, 'Not available right now');
	section.children = [document.createTextNode('web')];
	section.updated = '2026-10-23T15:04:00Z';
	const line = section.element.querySelector('.bui-last-update');
	assert.ok(line && line.nextElementSibling.classList.contains('bui-section-body'), 'the time sits above the kept content');
	section.updated = null;
	assert.equal(section.element.querySelector('.bui-last-update'), null);
	const started = new Section({ title: 'Work', unavailable: { labels: EmptyState.labels.es }, updated: { time: null, labels: LastUpdate.labels.es } });
	assert.match(started.element.textContent, /No disponible en este momento/);
	assert.match(started.element.textContent, /Puede no estar al día/);
});

test('a list whose read did not answer joins the page’s notice, says so in place and leaves when it answers', async () => {
	const recovery = new Recovery({ title: 'Beyond Accounts did not answer', again: options }).mount(document.body);
	let down = true;
	const source = async request => {
		if (down) throw Object.assign(new Error('Beyond Accounts is unavailable'), { outage: true, request: 'req_9' });
		return Collection.local(rows)(request);
	};
	const list = new Collection({ label: 'Requests', columns, source, recovery, outage: error => error.outage === true, details: error => ({ request: error.request, text: error.message }) }).mount(document.body);
	try {
		await settle(list);
		assert.equal(list.element.querySelector('.bui-empty-outage .bui-empty-title').textContent, 'Not available right now');
		assert.equal(list.element.querySelector('.bui-collection-body button'), null, 'no Try again of its own');
		assert.equal(recovery.size, 1);
		assert.match(recovery.element.querySelector('details').textContent, /Requests.*req_9/s);
		down = false;
		await recovery.now();
		await settle(list);
		assert.equal(recovery.size, 0, 'it answered: it left the notice');
		assert.equal(recovery.element.hidden, true);
		assert.ok(list.element.querySelector('tbody tr'));
	} finally {
		list.destroy();
		recovery.destroy();
	}
});

test('a list keeps its own answer for a failure that is not the notice’s outage, and leaves the notice when it goes', async () => {
	const recovery = new Recovery({ title: 'Beyond Accounts did not answer', again: options });
	let outage = false;
	const list = new Collection({ label: 'Requests', columns, source: async () => { throw Object.assign(new Error('refused'), { outage }); }, recovery, outage: error => error.outage, explain: () => 'You can’t see these requests.' }).mount(document.body);
	try {
		await settle(list);
		assert.match(list.element.querySelector('.bui-callout').textContent, /You can’t see these requests/);
		assert.equal(recovery.size, 0);
		outage = true;
		await list.load();
		assert.equal(recovery.size, 1);
		list.destroy();
		assert.equal(recovery.size, 0, 'a list that left takes its symptom with it');
	} finally {
		list.destroy();
		recovery.destroy();
	}
});
