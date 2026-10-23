import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { OpeningWords, words, steps } from '../src/opening/words.js';
import { OpeningUsual } from '../src/opening/usual.js';
import { OpeningSteps } from '../src/opening/steps.js';

/** 0.21.0: the opening's words, its measured usual durations and its steps, apart from any browser. */
const page = new Page();
after(() => page.close());
const { loading } = await import('@beyond-js/ui/dom');

/** A storage the usual durations can be kept in, or one that refuses. */
class Memory {
	#items = new Map();
	constructor(refuse = false) { this.refuse = refuse; }
	getItem(key) { if (this.refuse) throw new Error('SecurityError'); return this.#items.get(key) ?? null; }
	setItem(key, value) { if (this.refuse) throw new Error('QuotaExceededError'); this.#items.set(key, String(value)); }
}

test('the words: every key in both languages, the family’s steps, a product’s own words and durations as a person reads them', () => {
	assert.deepEqual(Object.keys(words.en), Object.keys(words.es));
	assert.deepEqual([...steps], ['session', 'signin', 'projects']);
	const said = new OpeningWords('Conduict');
	document.documentElement.lang = 'en';
	assert.equal(said.step('interface'), 'Loading Conduict');
	assert.equal(said.step('session', 'ignored'), 'Confirming your session');
	assert.equal(said.step('', '  Reading   your projects…  '), 'Reading your projects', 'a product’s own words, without the ellipsis');
	assert.equal(said.step('mine', 'Waking your machine...'), 'Waking your machine');
	assert.equal(said.step('', ''), 'Opening Conduict');
	assert.equal(said.text('longer', { step: 'Confirming your session' }), 'Confirming your session is taking longer than usual');
	assert.deepEqual([30, 380, 4249, 12000, 65000].map(ms => said.time(ms)), ['< 0.1 s', '0.4 s', '4.2 s', '12 s', '1 min 5 s'], 'never “0.0 s”');
	document.documentElement.lang = 'es-ES';
	assert.equal(said.step('signin'), 'Iniciando tu sesión con Beyond Accounts');
	assert.equal(said.time(4249), '4,2 s', 'decimals in the document’s language');
	assert.equal(said.time(20), '< 0,1 s');
	assert.equal(said.text('late'), 'Está tardando más de lo esperado');
	assert.equal(said.text('failed'), 'No se pudo abrir Conduict');
	document.documentElement.lang = 'en';
	assert.equal(said.step('projects'), 'Connecting to Beyond Projects');
	assert.equal(said.text('reconnect'), 'Opening continues as soon as you’re back online.', 'the opening is the subject, not the product');
	assert.equal(said.product, 'Conduict');
});

test('the words say only what the opening backs, from the person’s side (0.25.0)', () => {
	for (const language of ['en', 'es']) {
		const lines = Object.entries(words[language]);
		// A note never restates the button beside it; only the line shown without a controller, which has no button, says to reload
		for (const [key, line] of lines) if (key !== 'fallback') assert.doesNotMatch(line, /Reload to try again|Vuelve a cargar para intentarlo/, `${language}.${key}`);
		// The opening retries nothing of the product's: no line promises that it keeps trying
		for (const [key, line] of lines) assert.doesNotMatch(line, /keeps trying|sigue intentándolo/i, `${language}.${key}`);
		// "Usual" is measured on the device (D50); the engineering bound says "expected"
		assert.match(words[language].late, /expected|esperado/);
		assert.match(words[language].longer, /usual|normal/);
	}
	for (const key of Object.keys(words.en)) assert.deepEqual(words.en[key].match(/\{\w+\}/g), words.es[key].match(/\{\w+\}/g), `${key} carries the same values in both languages`);
});

test('loading.step says a step as the opening does, and anything else as the default loading line', () => {
	assert.equal(loading.step({ step: 'session' }), 'Confirming your session…');
	assert.equal(loading.step({ step: 'projects', language: 'es' }), 'Conectando con Beyond Projects…');
	assert.equal(loading.step({ step: 'projects' }), 'Connecting to Beyond Projects…');
	assert.equal(loading.step({ step: 'unknown', language: 'es' }), 'Cargando…');
	assert.deepEqual([...loading.steps], [...steps]);
	const line = loading(loading.step({ step: 'signin' }));
	assert.equal(line.getAttribute('role'), 'status');
	assert.ok(line.querySelector('.bui-spinner'), 'the mark the stylesheet draws as work in progress');
});

test('usual durations: none before five openings, then the median and the 90th percentile of the last twenty, durations only', () => {
	const storage = new Memory();
	Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
	try {
		const usual = new OpeningUsual('beyond-example');
		usual.keep([{ step: 'session', ms: 300 }, { step: '', ms: 10 }, { step: 'interface', ms: Number.NaN }]);
		assert.equal(usual.of('session'), null, 'one opening says nothing about usual');
		for (const ms of [100, 200, 400, 500, 900]) usual.keep([{ step: 'session', ms }]);
		assert.deepEqual(usual.of('session'), { median: 300, p90: 900 });
		for (let index = 0; index < 30; index++) usual.keep([{ step: 'session', ms: 1000 + index }]);
		const kept = JSON.parse(storage.getItem('beyond-example.opening'));
		assert.equal(kept.session.length, 20, 'the last twenty');
		assert.deepEqual(Object.keys(kept), ['session'], 'unnamed steps and impossible durations are not kept');
		assert.equal(new OpeningUsual('beyond-example').of('session').median, 1019, 'read again from storage');
		Object.defineProperty(globalThis, 'localStorage', { value: new Memory(true), configurable: true });
		const refused = new OpeningUsual('beyond-example');
		assert.equal(refused.of('session'), null, 'unreadable storage: nothing is known');
		assert.doesNotThrow(() => refused.keep([{ step: 'session', ms: 10 }]));
		storage.setItem('broken.opening', '[1,2,3]');
		Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
		assert.equal(new OpeningUsual('broken').of('0'), null, 'a record of another shape is ignored');
	} finally {
		delete globalThis.localStorage;
	}
});

test('steps: one running step at a time, said with their times once shown, durations for what finished, late past the usual', () => {
	const list = document.createElement('ol');
	list.hidden = true;
	const known = { of: step => (step === 'session' ? { median: 100, p90: 200 } : null) };
	const said = new OpeningWords('Conduict');
	const timeline = new OpeningSteps({ list, words: said, usual: known });
	const start = performance.now();
	assert.equal(timeline.begin('interface', '', start - 900), true);
	assert.equal(timeline.begin('interface', '', start), false, 'the same step again changes nothing');
	assert.equal(list.children.length, 0, 'nothing is drawn before it is shown');
	assert.equal(timeline.begin('session', '', start - 500), true);
	assert.equal(timeline.label, 'Confirming your session');
	assert.equal(timeline.late, true, 'past the 90th percentile of this device');
	timeline.show();
	assert.equal(list.hidden, false);
	const rows = [...list.children];
	assert.deepEqual(rows.map(row => row.dataset.state), ['done', 'active']);
	assert.equal(rows[0].querySelector('.bui-opening-label').textContent, 'Loading Conduict');
	assert.match(rows[1].querySelector('.bui-opening-time').textContent, /^0\.\d s · usually 0\.1 s$/);
	assert.ok(rows[1].hasAttribute('data-late'));
	timeline.mark('late');
	assert.equal(rows[1].dataset.state, 'late');
	timeline.begin('', 'Reading your projects…');
	assert.equal(list.children.length, 3);
	assert.equal(list.lastElementChild.querySelector('.bui-opening-label').textContent, 'Reading your projects');
	timeline.end();
	assert.equal(timeline.active, null);
	assert.deepEqual(timeline.durations.map(item => item.step), ['interface', 'session'], 'a step the family does not name is not measured');
	assert.match(timeline.text, /^Loading Conduict \(interface\) .* · Confirming your session \(session\) .* · Reading your projects \(wait\) /);
	document.documentElement.lang = 'es';
	timeline.speak();
	assert.equal(list.firstElementChild.querySelector('.bui-opening-label').textContent, 'Cargando Conduict', 'said again in the document’s language');
	document.documentElement.lang = 'en';
});
