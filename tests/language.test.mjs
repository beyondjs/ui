import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/**
 * 0.44.0: a component chooses its words from the language, by one rule (`Labels`): the given `labels`
 * win and the keys they leave out come from the chosen language; the language is the component's
 * `locale` when its set has it, else the page's `<html lang>` (which `Preferences` sets, D07), else
 * English. A product that passes `labels: X.labels.es` keeps its Spanish unchanged.
 */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
const root = document.documentElement;
after(() => page.close());
beforeEach(() => {
	page.reset();
	root.removeAttribute('lang');
});

const set = Object.freeze({ en: { owner: 'Who can change this: ', retry: 'Try again', only: 'English only' }, es: { owner: 'Quién puede cambiarlo: ', retry: 'Reintentar' } });
const options = { events: null, page: null };
const outage = (more = {}) => new ui.Unavailable({ title: 'Beyond Projects did not answer', reason: 'Nothing was changed.', owner: 'Beyond', kind: 'outage', again: { run: async () => false, ...options }, ...more });
const read = shown => ({
	owner: shown.element.querySelector('.bui-unavailable-label').textContent,
	retry: shown.element.querySelector('.bui-unavailable-actions button').textContent.trim(),
	line: shown.element.querySelector('.bui-again').textContent
});

test('Labels: English with no locale and no page language; the given entries always win', () => {
	const words = new ui.Labels(set, { owner: 'Decides: ' });
	assert.equal(words.language, 'en');
	assert.equal(words.text('owner'), 'Decides: ');
	assert.equal(words.text('retry'), 'Try again');
	assert.equal(words.text('missing'), 'missing', 'an unknown key is still said as its key');
});

test('Labels: a locale that starts with es chooses Spanish, and the keys left out come from Spanish', () => {
	for (const locale of ['es', 'es-AR', 'ES_es']) assert.equal(new ui.Labels(set, {}, locale).language, 'es', locale);
	const words = new ui.Labels(set, { owner: 'Decide: ' }, 'es-AR');
	assert.equal(words.text('owner'), 'Decide: ');
	assert.equal(words.text('retry'), 'Reintentar', 'not English');
	assert.equal(words.text('only'), 'English only', 'a key Spanish lacks comes from English');
	assert.deepEqual(Object.keys(words.entries).sort(), ['only', 'owner', 'retry']);
});

test('Labels: without a locale the page language chooses, and is read again at each text', () => {
	const words = new ui.Labels(set);
	assert.equal(words.text('retry'), 'Try again');
	root.setAttribute('lang', 'es-MX');
	assert.equal(words.language, 'es');
	assert.equal(words.text('retry'), 'Reintentar', 'a lang set after the component was made is followed');
	assert.equal(words.with({ owner: 'Decide: ' }).text('retry'), 'Reintentar', 'a copy chooses by the same rule');
	root.setAttribute('lang', 'fr');
	assert.equal(words.text('retry'), 'Try again', 'a language the set does not have falls back to English');
});

test('Labels: an own locale outranks the page language, and one it lacks gives way to it', () => {
	root.setAttribute('lang', 'es');
	assert.equal(new ui.Labels(set, {}, 'en-US').text('retry'), 'Try again', 'the component’s own locale first');
	assert.equal(new ui.Labels(set, {}, 'fr').text('retry'), 'Reintentar', 'a locale the set lacks gives way to the page');
	assert.equal(new ui.Labels({ busy: '{label}…' }).text('busy', { label: 'Saving' }), 'Saving…', 'a plain entry list is used as it is');
});

test('Unavailable speaks Spanish given only locale es: its owner, its Try again and its line', () => {
	const shown = outage({ locale: 'es' });
	assert.deepEqual({ ...read(shown), line: read(shown).line.replace(/\d\d:\d\d/, 'HH:MM') }, { owner: 'Quién puede cambiarlo: ', retry: 'Reintentar', line: 'Último intento HH:MM · se vuelve a intentar por sí solo' });
	shown.destroy();
});

test('Unavailable speaks Spanish given nothing on a Spanish page, and English on an English one', () => {
	root.setAttribute('lang', 'es');
	const spanish = outage();
	assert.equal(read(spanish).retry, 'Reintentar');
	assert.match(read(spanish).line, /^Último intento/);
	spanish.destroy();
	root.setAttribute('lang', 'en');
	const english = outage();
	assert.deepEqual([read(english).owner, read(english).retry], ['Who can change this: ', 'Try again']);
	assert.match(read(english).line, /^Last tried/);
	english.destroy();
});

test('a product that passes Unavailable.labels.es keeps its Spanish on an English page, and a partial set fills from the language', () => {
	const given = outage({ labels: ui.Unavailable.labels.es });
	assert.equal(read(given).retry, 'Reintentar');
	assert.match(read(given).line, /^Último intento/);
	given.destroy();
	root.setAttribute('lang', 'es');
	const partial = outage({ labels: { owner: 'Lo decide: ' } });
	assert.deepEqual([read(partial).owner, read(partial).retry], ['Lo decide: ', 'Reintentar'], 'the given key wins, the rest is Spanish');
	partial.destroy();
});

test('AgainLine, RetryAction, Recovery and the loading line follow the same rule', () => {
	const moments = { active: true, trying: false, last: Date.now(), offline: false };
	assert.match(ui.AgainLine.say(moments, { locale: 'es' }), /^Último intento/);
	assert.match(ui.AgainLine.say(moments), /^Last tried/);
	assert.equal(new ui.RetryAction({ run: () => {}, locale: 'es' }).element.textContent.trim(), 'Reintentar');
	assert.equal(ui.loading().textContent, 'Loading…');
	root.setAttribute('lang', 'es');
	const recovery = new ui.Recovery({ title: 'Beyond Accounts no respondió', again: options });
	recovery.set('machines', { title: 'Máquinas', run: async () => false });
	assert.equal([...recovery.element.querySelectorAll('button')].find(button => !button.closest('details')).textContent.trim(), 'Reintentar');
	assert.match(recovery.element.querySelector('.bui-again').textContent, /^Último intento/);
	recovery.destroy();
	assert.equal(ui.loading().textContent, 'Cargando…');
	assert.equal(ui.waiting().querySelector('.bui-waiting-label').textContent, 'Cargando…');
	assert.equal(ui.waiting({ language: 'en' }).querySelector('.bui-waiting-label').textContent, 'Loading…', 'a language given wins');
	assert.equal(new ui.EndLine().element.textContent, 'No hay más');
});

test('one Spanish retry word in every set of the package: Reintentar', () => {
	const sets = Object.entries(ui).filter(([, value]) => value?.labels?.es && typeof value.labels.es === 'object');
	const retries = sets.filter(([, value]) => typeof value.labels.es.retry === 'string').map(([name, value]) => [name, value.labels.es.retry]);
	assert.ok(retries.length >= 8, `the sets that carry a retry: ${retries.map(([name]) => name).join(', ')}`);
	for (const [name, word] of retries) assert.equal(word, 'Reintentar', name);
	assert.equal(ui.Session.labels.es.retry, 'Reintentar');
	assert.equal(ui.ComposerDictation.labels.es.retry, 'Reintentar');
});
