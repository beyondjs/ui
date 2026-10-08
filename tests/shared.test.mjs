import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Page } from './support/page.mjs';

/** What 0.11.1 makes public or corrects: `Hint` for a product's own glyph-only controls, `Age` (the Sidebar's wording), a `ChoiceChip` with one border and a `Facts` row action on the value's baseline. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
const root = await import('@beyond-js/ui');
after(() => page.close());
beforeEach(() => {
	page.reset();
	document.documentElement.lang = 'en';
});

const sheet = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const shown = () => [...document.querySelectorAll('.bui-hint')].filter(node => !node.hidden);
/** Every rule whose selector list has `selector` as one of its selectors, with its body. */
const rules = selector => [...sheet.matchAll(/([^{}]+)\{([^}]*)\}/g)].filter(([, list]) => list.split(',').map(part => part.trim()).includes(selector)).map(([, , body]) => body);

test('Hint is public from the root and /dom: a product\'s own glyph-only control shows its name on focus and hover, once for assistive technology', async () => {
	assert.ok(root.Hint === ui.Hint);
	const toolbar = ui.el('div', {}, [ui.el('button', { type: 'button', class: 'bui-icon-button', 'aria-label': 'Copy link', 'data-bui-hint': true, 'data-bui-shortcut': 'L' }, [ui.icon('more')])]);
	document.body.append(toolbar);
	const hint = new ui.Hint(toolbar);
	const button = toolbar.querySelector('button');
	assert.ok(toolbar.hasAttribute('data-bui-hints'));
	button.focus();
	assert.equal(shown().length, 1);
	assert.equal(shown()[0].textContent, 'Copy link · L');
	assert.equal(shown()[0].getAttribute('aria-hidden'), 'true');
	page.key(document.body, 'Escape');
	assert.equal(shown().length, 0);
	button.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' }));
	await page.until(() => shown().length === 1);
	hint.destroy();
	assert.equal(shown().length, 0);
	assert.equal(toolbar.hasAttribute('data-bui-hints'), false, 'the root is left as it was');
	button.blur();
	button.focus();
	await new Promise(resolve => setTimeout(resolve, 350));
	assert.equal(document.querySelectorAll('.bui-hint').length, 0, 'a destroyed hint listens to nothing');
	const again = new ui.Hint(toolbar);
	button.blur();
	button.focus();
	assert.equal(shown().length, 1, 'a new hint over the same root works');
	again.destroy();
});

test('Age says the Sidebar\'s words: short by distance, the full moment and the datetime; Spanish by locale; no moment, null', () => {
	assert.ok(root.Age === ui.Age);
	const now = Date.parse('2026-10-08T12:00:00Z');
	const age = new ui.Age({ locale: 'en', now: () => now });
	const cases = [[0, 'now'], [5, '5 min'], [59, '59 min'], [60 * 23, '23 h'], [60 * 24 * 3, '3 d'], [60 * 24 * 14, '2 w']];
	for (const [minutes, words] of cases) assert.equal(age.of(now - minutes * 60_000).label, words);
	const old = Date.parse('2024-03-06T10:00:00Z');
	assert.equal(age.of(old).label, new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(old)));
	const day = Date.parse('2026-08-02T10:00:00Z');
	assert.equal(age.of(new Date(day)).label, new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' }).format(new Date(day)), 'this year: no year');
	const said = age.of('2026-10-08T09:30:00Z');
	assert.equal(said.label, '2 h');
	assert.equal(said.title, new Intl.DateTimeFormat('en', { dateStyle: 'full', timeStyle: 'short', hourCycle: 'h23' }).format(new Date('2026-10-08T09:30:00Z')));
	assert.equal(said.datetime, '2026-10-08T09:30:00.000Z');
	for (const value of [null, undefined, '', 'yesterday', Number.NaN]) assert.equal(age.of(value), null);
	const spanish = new ui.Age({ locale: 'es-ES', now: () => now });
	assert.equal(spanish.of(now).label, 'ahora');
	assert.equal(spanish.of(now - 14 * 86_400_000).label, '2 sem');
	assert.deepEqual(ui.Age.labels.es, { now: 'ahora', minutes: '{count} min', hours: '{count} h', days: '{count} d', weeks: '{count} sem' });
	const own = new ui.Age({ labels: { weeks: '{count} weeks' }, now: () => now });
	assert.equal(own.of(now - 14 * 86_400_000).label, '2 weeks', "a product's own unit");
	assert.equal(own.of(now - 5 * 60_000).label, '5 min', 'the rest stay');
});

test("the Sidebar's units are Age's, and an entry's age matches Age's words", () => {
	for (const language of ['en', 'es']) for (const key of Object.keys(ui.Age.labels.en)) assert.equal(ui.Sidebar.labels[language][key], ui.Age.labels[language][key]);
	const at = Date.now() - 125 * 60_000;
	const shell = document.body.appendChild(ui.el('div', { class: 'bui-shell' }));
	const sidebar = new ui.Sidebar({ product: 'Conduict', groups: [{ kind: 'entries', key: 'recent', heading: 'Recent', items: [{ key: 'c1', label: 'One', href: '#/c/1', age: at }] }] }).mount(shell);
	const time = sidebar.element.querySelector('time.bui-sidebar-age');
	const said = new ui.Age({ locale: 'en' }).of(at);
	assert.equal(time.querySelector('[aria-hidden]').textContent, said.label);
	assert.equal(time.querySelector('.bui-hidden').textContent, `, ${said.title}`);
	assert.equal(time.getAttribute('datetime'), said.datetime);
	sidebar.destroy();
});

test("a ChoiceChip's holder draws no box: the picker's chip rule is scoped to its list, so the chip has its button's one border", () => {
	assert.deepEqual(rules('.bui-chip'), [], 'no rule for every .bui-chip');
	const [box] = rules('.bui-chips > .bui-chip');
	assert.match(box, /border:\s*1px solid/);
	assert.ok(rules('.bui-chips > .bui-chip-problem').length, 'the problem form scoped too');
	const chip = new ui.ChoiceChip({ label: 'Model', options: [{ value: 'a', label: 'Opus 5.5' }], value: 'a' }).mount(document.body);
	assert.ok(chip.element.matches('.bui-chip') && !chip.element.matches('.bui-chips > .bui-chip'), 'the holder matches no box rule');
	chip.destroy();
});

test("a Facts row's action sits on the value's baseline, beside its label and under it", () => {
	const [action] = rules('.bui-facts-action');
	assert.match(action, /align-self:\s*baseline/);
	assert.doesNotMatch(action, /align-self:\s*center/);
	const [data] = rules('.bui-facts-data');
	assert.match(data, /align-items:\s*baseline/, 'the value and the action share a line by their baseline');
});
