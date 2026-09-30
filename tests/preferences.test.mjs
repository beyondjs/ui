import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { Shelf } from './fixtures/shelf.mjs';

/** Preferences (D07): first paint, arrival from the account, a device choice, storage failures and listeners. */
const page = new Page();
const { Preferences } = await import('@beyond-js/ui/dom');
const html = () => document.documentElement;
after(() => page.close());
beforeEach(() => {
	html().removeAttribute('data-beyond-mode');
	html().removeAttribute('lang');
});

const make = (options = {}) => new Preferences({ key: 'beyond-projects', fallback: { appearance: 'light', locale: 'en' }, storage: new Shelf(), ...options });

test('restore: the product fallback without a device copy, then the device copy', () => {
	const shelf = new Shelf();
	const first = make({ storage: shelf });
	assert.deepEqual({ ...first.restore() }, { appearance: 'light', locale: 'en' });
	assert.equal(html().getAttribute('data-beyond-mode'), 'light');
	assert.equal(html().getAttribute('lang'), 'en');
	shelf.setItem('beyond-projects', JSON.stringify({ appearance: 'dark', locale: 'es' }));
	const second = make({ storage: shelf });
	second.restore();
	assert.deepEqual([second.appearance, second.locale], ['dark', 'es']);
	assert.equal(html().getAttribute('data-beyond-mode'), 'dark');
	assert.equal(html().getAttribute('lang'), 'es');
});

test('system removes the attribute; a corrupt or foreign device copy falls back', () => {
	const shelf = new Shelf();
	shelf.setItem('beyond-projects', JSON.stringify({ appearance: 'system', locale: 'es' }));
	html().setAttribute('data-beyond-mode', 'dark');
	make({ storage: shelf }).restore();
	assert.equal(html().hasAttribute('data-beyond-mode'), false);
	shelf.setItem('beyond-projects', '{not json');
	assert.deepEqual({ ...make({ storage: shelf }).restore() }, { appearance: 'light', locale: 'en' });
	shelf.setItem('beyond-projects', JSON.stringify({ appearance: 'sepia', locale: 'fr' }));
	assert.deepEqual({ ...make({ storage: shelf }).restore() }, { appearance: 'light', locale: 'en' });
});

test('apply: the account wins and becomes the device copy, holding only the two values and the account\'s two', () => {
	const shelf = new Shelf();
	const preferences = make({ storage: shelf });
	preferences.restore();
	preferences.apply({ appearance: 'dark', locale: 'es', account: 'acc_123', email: 'ana@example.test' });
	assert.deepEqual([preferences.appearance, preferences.locale], ['dark', 'es']);
	assert.deepEqual(JSON.parse(shelf.getItem('beyond-projects')), { appearance: 'dark', locale: 'es', account: { appearance: 'dark', locale: 'es' } });
	assert.deepEqual(shelf.keys, ['beyond-projects'], 'nothing else is written');
	assert.doesNotMatch(shelf.getItem('beyond-projects'), /acc_|example/);
});

test('apply: a null, missing or unknown appearance is unset and keeps the product default; the old default system is accepted', () => {
	const preferences = make();
	preferences.choose({ appearance: 'dark' });
	preferences.apply({ appearance: null, locale: 'en' });
	assert.equal(preferences.appearance, 'light', 'null keeps the product default, not the earlier device choice');
	assert.equal(html().getAttribute('data-beyond-mode'), 'light');
	preferences.apply({ appearance: 'system', locale: 'en' });
	assert.equal(preferences.appearance, 'system');
	assert.equal(html().hasAttribute('data-beyond-mode'), false);
	preferences.apply({ locale: 'es' });
	assert.equal(preferences.appearance, 'light');
	preferences.apply({ appearance: 'sepia', locale: 'fr' });
	assert.deepEqual([preferences.appearance, preferences.locale], ['light', 'en'], 'unknown values fall back');
	const system = make({ fallback: { appearance: 'system', locale: 'en' } });
	system.apply({ appearance: null });
	assert.equal(html().hasAttribute('data-beyond-mode'), false);
});

test('a product localized in English only keeps English whatever the account says', () => {
	const preferences = make({ locales: ['en'] });
	preferences.apply({ appearance: 'dark', locale: 'es' });
	assert.equal(preferences.locale, 'en');
	assert.equal(html().getAttribute('lang'), 'en');
	assert.throws(() => preferences.choose({ locale: 'es' }), TypeError);
});

test('choose: a device-only change of the given values; invalid choices throw', () => {
	const shelf = new Shelf();
	const preferences = make({ storage: shelf });
	preferences.apply({ appearance: 'dark', locale: 'es' });
	preferences.choose({ appearance: 'system' });
	assert.deepEqual([preferences.appearance, preferences.locale], ['system', 'es']);
	assert.deepEqual(JSON.parse(shelf.getItem('beyond-projects')), { appearance: 'system', locale: 'es', account: { appearance: 'dark', locale: 'es' } });
	assert.throws(() => preferences.choose({ appearance: null }), TypeError);
	assert.throws(() => preferences.choose({ appearance: 'sepia' }), TypeError);
	assert.throws(() => preferences.choose({ locale: 'fr' }), TypeError);
	assert.equal(preferences.appearance, 'system', 'a refused choice changes nothing');
	preferences.apply({ appearance: 'dark', locale: 'es' });
	assert.deepEqual([preferences.appearance, preferences.locale], ['system', 'es'], 'an arrival with the same account values keeps the device choice');
	const reloaded = make({ storage: shelf });
	reloaded.restore();
	reloaded.apply({ appearance: 'dark', locale: 'es' });
	assert.equal(reloaded.appearance, 'system', 'a reload keeps the device choice too');
	preferences.apply({ appearance: 'light', locale: 'en' });
	assert.deepEqual([preferences.appearance, preferences.locale], ['light', 'en'], 'account values that changed win over the device choice');
});

test('apply: a device copy written before the account values were remembered is overridden once', () => {
	const shelf = new Shelf();
	shelf.setItem('beyond-projects', JSON.stringify({ appearance: 'dark', locale: 'en' }));
	const preferences = make({ storage: shelf });
	preferences.restore();
	preferences.apply({ appearance: 'light', locale: 'es' });
	assert.deepEqual([preferences.appearance, preferences.locale], ['light', 'es']);
});

test('works without storage and when storage refuses access', () => {
	const none = make({ storage: null });
	none.choose({ appearance: 'dark' });
	assert.equal(none.appearance, 'dark');
	const refusing = new Shelf({ refuse: true });
	const blocked = make({ storage: refusing });
	assert.deepEqual({ ...blocked.restore() }, { appearance: 'light', locale: 'en' });
	blocked.apply({ appearance: 'dark', locale: 'es' });
	assert.deepEqual([blocked.appearance, blocked.locale], ['dark', 'es']);
	assert.equal(html().getAttribute('data-beyond-mode'), 'dark');
	const defaulted = new Preferences({ key: 'beyond-desktop', fallback: { appearance: 'light', locale: 'en' } });
	assert.deepEqual({ ...defaulted.restore() }, { appearance: 'light', locale: 'en' });
	defaulted.choose({ appearance: 'dark' });
	assert.deepEqual(JSON.parse(window.localStorage.getItem('beyond-desktop')), { appearance: 'dark', locale: null, account: null }, 'the page\'s localStorage by default; null is a value never chosen');
	window.localStorage.removeItem('beyond-desktop');
});

test('subscribe: listeners hear each change once, a throwing one is reported apart, the release stops them', () => {
	const preferences = make();
	const heard = [];
	const reported = [];
	const saved = globalThis.reportError;
	globalThis.reportError = error => reported.push(error.message);
	try {
		const { subscribe } = preferences;
		const release = subscribe(values => heard.push(`${values.appearance}/${values.locale}`));
		preferences.subscribe(() => {
			throw new Error('listener failed');
		});
		preferences.restore();
		const before = preferences.current;
		preferences.apply({ appearance: 'light', locale: 'en' });
		assert.ok(preferences.current === before, 'no change keeps the same snapshot');
		preferences.choose({ appearance: 'dark' });
		preferences.choose({ locale: 'es' });
		release();
		release();
		preferences.choose({ appearance: 'light' });
		assert.deepEqual(heard, ['dark/en', 'dark/es']);
		assert.deepEqual(reported, ['listener failed', 'listener failed', 'listener failed']);
		assert.ok(Object.isFrozen(preferences.current));
	} finally {
		globalThis.reportError = saved;
	}
});

test('labels in English and Spanish follow the language; options are checked', () => {
	const preferences = make();
	assert.equal(preferences.labels.everywhere, 'Change for all of Beyond');
	preferences.choose({ locale: 'es' });
	assert.equal(preferences.labels.everywhere, 'Cambiar en todo Beyond');
	assert.deepEqual(Object.keys(Preferences.labels.es), Object.keys(Preferences.labels.en));
	assert.deepEqual([...Preferences.appearances], ['system', 'light', 'dark']);
	assert.throws(() => new Preferences({ fallback: { appearance: 'light', locale: 'en' } }), TypeError);
	assert.throws(() => new Preferences({ key: 'k', fallback: { appearance: null, locale: 'en' } }), TypeError);
	assert.throws(() => new Preferences({ key: 'k', fallback: { appearance: 'light', locale: 'fr' } }), TypeError);
});
