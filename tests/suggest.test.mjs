import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/** Composer suggestions (0.11.0): a bounded source after the trigger, Looking/No match/Unavailable said apart, the listbox keys, the token replaced, never while composing, Enter never stolen. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const { InputEvent, CompositionEvent } = page.window;
const files = [{ value: '@src/checkout/redirect.js', label: 'src/checkout/redirect.js', detail: 'Modified', mono: true }, { value: '@src/checkout/session.js', label: 'src/checkout/session.js', mono: true }];
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

/** A composer whose suggestions come from `source`; the asks are recorded. */
function make(source = query => Promise.resolve(files.filter(item => item.label.includes(query))), options = {}) {
	const asked = [];
	const sent = [];
	const changes = [];
	const composer = new ui.Composer({
		label: 'Message to Claude Code',
		onsubmit: message => (sent.push(message), Promise.resolve()),
		onchange: text => changes.push(text),
		onsuggest: (query, signal) => (asked.push({ query, signal }), source(query, signal)),
		suggest: { delay: 5, bound: 200, ...(options.suggest ?? {}) },
		...options
	}).mount(document.body);
	return { composer, asked, sent, changes, field: composer.field, list: composer.element.querySelector('[role="listbox"]'), panel: composer.element.querySelector('.bui-composer-suggest') };
}
/** Types `text` as a person would: the value, the caret at its end, an input event. */
function type(field, text, options = {}) {
	field.value = text;
	field.setSelectionRange(text.length, text.length);
	field.dispatchEvent(new InputEvent('input', { bubbles: true, ...options }));
}
const key = (field, name, options = {}) => page.key(field, name, options);

test('after the trigger the field asks, says Looking…, then lists options as a listbox it controls, the first active', async () => {
	const { composer, asked, field, list, panel } = make();
	assert.equal(field.getAttribute('aria-autocomplete'), 'list');
	assert.equal(field.getAttribute('aria-controls'), list.id);
	assert.equal(field.getAttribute('aria-expanded'), 'false');
	assert.equal(list.getAttribute('aria-label'), 'Suggestions');
	type(field, 'Fix @check');
	await page.until(() => asked.length);
	assert.equal(asked[0].query, 'check');
	assert.ok(asked[0].signal instanceof AbortSignal);
	await page.until(() => composer.suggestions.state === 'results');
	const options = [...list.querySelectorAll('[role="option"]')];
	assert.equal(options.length, 2);
	assert.equal(field.getAttribute('aria-expanded'), 'true');
	assert.equal(field.getAttribute('aria-activedescendant'), options[0].id);
	assert.equal(options[0].getAttribute('aria-selected'), 'true');
	assert.match(options[0].textContent, /src\/checkout\/redirect\.js.*Modified/);
	assert.ok(options[0].querySelector('[data-mono]'));
	assert.equal(panel.querySelector('.bui-announcer').textContent, '2 suggestions', 'the answer said once, politely');
	key(field, 'ArrowDown');
	assert.equal(field.getAttribute('aria-activedescendant'), options[1].id);
	key(field, 'ArrowDown');
	assert.equal(field.getAttribute('aria-activedescendant'), options[0].id, 'it wraps');
	key(field, 'ArrowUp');
	assert.equal(field.getAttribute('aria-activedescendant'), options[1].id);
	composer.destroy();
});

test('Enter or Tab inserts the active value in place of the token, with a space and the caret after it, and sends nothing', async () => {
	const { composer, asked, sent, changes, field } = make();
	type(field, 'Read @red and explain');
	field.setSelectionRange(9, 9);
	field.dispatchEvent(new MouseEvent('click', { bubbles: true }));
	await page.until(() => composer.suggestions.state === 'results');
	assert.equal(asked.at(-1).query, 'red');
	const enter = key(field, 'Enter');
	assert.equal(enter.defaultPrevented, true);
	assert.equal(field.value, 'Read @src/checkout/redirect.js and explain');
	assert.equal(field.selectionStart, 'Read @src/checkout/redirect.js '.length);
	assert.equal(changes.at(-1), field.value, 'onchange hears the new text');
	assert.equal(composer.suggestions.open, false);
	assert.deepEqual(sent, [], 'Enter inserted, it did not send');
	type(field, 'And @ses');
	await page.until(() => composer.suggestions.state === 'results');
	const tab = key(field, 'Tab');
	assert.equal(tab.defaultPrevented, true);
	assert.equal(field.value, 'And @src/checkout/session.js ');
	key(field, 'Enter');
	assert.equal(sent.length, 1, 'with the list closed Enter sends');
	composer.destroy();
});

test('a press on an option inserts it and keeps focus in the field', async () => {
	const { composer, field, list } = make();
	field.focus();
	type(field, '@sess');
	await page.until(() => composer.suggestions.state === 'results');
	const down = new PointerEvent('pointerdown', { bubbles: true, cancelable: true });
	list.firstElementChild.dispatchEvent(down);
	assert.equal(down.defaultPrevented, true, 'the field keeps focus');
	list.firstElementChild.click();
	assert.equal(field.value, '@src/checkout/session.js ');
	composer.destroy();
});

test('Escape closes, stops there and the same token stays closed; a new token asks again', async () => {
	const { composer, asked, field } = make();
	type(field, '@chec');
	await page.until(() => composer.suggestions.state === 'results');
	let outer = 0;
	document.body.addEventListener('keydown', event => event.key === 'Escape' && outer++);
	const escape = key(field, 'Escape');
	assert.equal(escape.defaultPrevented, true);
	assert.equal(outer, 0, 'an Escape the list takes reaches no dialog around it');
	assert.equal(composer.suggestions.open, false);
	assert.equal(field.getAttribute('aria-expanded'), 'false');
	type(field, '@check');
	await wait(30);
	assert.equal(composer.suggestions.open, false, 'the same token stays closed');
	assert.equal(asked.length, 1);
	type(field, '@check and @se');
	await page.until(() => composer.suggestions.state === 'results');
	assert.equal(asked.at(-1).query, 'se');
	key(field, 'Escape');
	assert.equal(key(field, 'Escape').defaultPrevented, false, 'a second Escape is left to menus and dialogs');
	composer.destroy();
});

test('No match and Unavailable are said apart, never as each other; Enter is not stolen without an active option', async () => {
	const { composer, sent, field, panel } = make();
	type(field, '@zzz');
	await page.until(() => composer.suggestions.state === 'none');
	assert.equal(panel.querySelector('.bui-composer-suggest-line').textContent, 'No match');
	assert.equal(field.hasAttribute('aria-activedescendant'), false);
	assert.equal(key(field, 'Enter').defaultPrevented, true, 'Enter sends');
	assert.equal(sent.length, 1);
	composer.destroy();
	const refused = make(() => Promise.reject(new Error('runner offline')));
	type(refused.field, '@src');
	await page.until(() => refused.composer.suggestions.state === 'unavailable');
	assert.equal(refused.panel.querySelector('.bui-composer-suggest-line').textContent, 'Unavailable · couldn’t be read');
	assert.equal(refused.panel.querySelector('.bui-announcer').textContent, 'Unavailable · couldn’t be read');
	refused.composer.destroy();
	const explained = make(() => Promise.reject(Object.assign(new Error('x'), { reason: 'the environment is stopped' })), { suggest: { explain: error => error.reason } });
	type(explained.field, '@src');
	await page.until(() => explained.composer.suggestions.state === 'unavailable');
	assert.equal(explained.panel.querySelector('.bui-composer-suggest-line').textContent, 'Unavailable · the environment is stopped');
	explained.composer.destroy();
});

test('every ask ends: a silent source is aborted at its bound and said unavailable; a newer query aborts the older and its late answer is never shown', async () => {
	const silent = make(() => new Promise(() => {}), { suggest: { bound: 40 } });
	type(silent.field, '@src');
	await page.until(() => silent.composer.suggestions.state === 'looking');
	assert.equal(silent.panel.querySelector('.bui-composer-suggest-line').textContent, 'Looking…');
	await page.until(() => silent.composer.suggestions.state === 'unavailable');
	assert.equal(silent.asked[0].signal.aborted, true, 'the ask is aborted at its bound');
	assert.equal(silent.panel.querySelector('.bui-composer-suggest-line').textContent, 'Unavailable · didn’t answer in time');
	silent.composer.destroy();
	const answers = [];
	const racing = make(query => new Promise(resolve => answers.push({ query, resolve })));
	type(racing.field, '@a');
	await page.until(() => answers.length === 1);
	type(racing.field, '@ab');
	await page.until(() => answers.length === 2);
	assert.equal(racing.asked[0].signal.aborted, true, 'the older ask is aborted');
	answers[0].resolve([{ value: '@old' }]);
	answers[1].resolve([{ value: '@new', label: 'new' }]);
	await page.until(() => racing.composer.suggestions.state === 'results');
	assert.deepEqual([...racing.list.children].map(node => node.textContent), ['new']);
	racing.composer.destroy();
});

test('nothing is asked while an input method composes, inside a word, or with a selection; the trigger is one character', async () => {
	const { composer, asked, field } = make();
	field.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
	type(field, '@にほ', { isComposing: true });
	await wait(30);
	assert.equal(asked.length, 0, 'not while composing');
	field.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
	await page.until(() => asked.length === 1);
	assert.equal(asked[0].query, 'にほ');
	await page.until(() => composer.suggestions.state !== 'looking');
	const composing = key(field, 'Enter', { isComposing: true });
	assert.equal(composing.defaultPrevented, false, "an input method's Enter is its own");
	type(field, 'name@host');
	await wait(30);
	assert.equal(composer.suggestions.open, false, 'a trigger inside a word is text');
	field.value = '@src';
	field.setSelectionRange(0, 4);
	field.dispatchEvent(new InputEvent('input', { bubbles: true }));
	await wait(30);
	assert.equal(composer.suggestions.open, false);
	composer.destroy();
	assert.equal(field.hasAttribute('aria-controls'), false, 'destroy takes the combobox attributes away');
	assert.throws(() => new ui.Composer({ label: 'x', onsubmit: () => Promise.resolve(), onsuggest: () => [], suggest: { trigger: '@@' } }), TypeError);
	const hashed = make(query => Promise.resolve([{ value: `#${query}1` }]), { suggest: { trigger: '#' } });
	type(hashed.field, 'See #12');
	await page.until(() => hashed.composer.suggestions.state === 'results');
	key(hashed.field, 'Enter');
	assert.equal(hashed.field.value, 'See #121 ');
	hashed.composer.destroy();
});

test('Spanish copy for suggestions', async () => {
	const { composer, field, panel, list } = make(() => Promise.resolve([]), { labels: ui.Composer.labels.es });
	assert.equal(list.getAttribute('aria-label'), 'Sugerencias');
	type(field, '@x');
	await page.until(() => composer.suggestions.state === 'none');
	assert.equal(panel.querySelector('.bui-composer-suggest-line').textContent, 'Sin coincidencias');
	composer.destroy();
});
