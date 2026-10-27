import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

const page = new Page();
const ui = await import('@beyond-js/ui/dom');
const { Language } = await import('../src/dom/core/language.js');
after(() => page.close());
beforeEach(() => page.reset());

const runtime = new Intl.DateTimeFormat().resolvedOptions().locale;
const other = Language.of(runtime) === 'es' ? 'en' : 'es';

test('dates follow the page\'s language when it is not the runtime\'s, and keep the runtime\'s own form when it is (0.44.0)', () => {
	document.documentElement.setAttribute('lang', other);
	assert.equal(Language.tag(), other, 'a page in another language formats its dates in it');
	assert.equal(Language.tag('pt-BR'), 'pt-BR', 'a component\'s own locale wins');
	document.documentElement.setAttribute('lang', Language.of(runtime));
	assert.equal(Language.tag(), undefined, 'the runtime\'s language: its own regional form is kept');
	document.documentElement.removeAttribute('lang');
	assert.equal(Language.tag(), undefined, 'no page language');
});

test('Age says a Spanish page\'s dates in Spanish without a locale', () => {
	document.documentElement.setAttribute('lang', 'es');
	const moment = Date.parse('2026-03-04T10:00:00Z');
	const age = new ui.Age({ now: () => Date.parse('2026-10-27T10:00:00Z') });
	assert.equal(age.of(moment).title, new Intl.DateTimeFormat('es', { dateStyle: 'full', timeStyle: 'short', hourCycle: 'h23' }).format(moment));
	document.documentElement.removeAttribute('lang');
});
