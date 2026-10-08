import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/** A suggestion list the source cut (0.11.1): its last line says so ("50 of 120 · keep typing to narrow"), describes the list and is said once with the answer; a whole list has no such line. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const { InputEvent } = page.window;
const paths = count => Array.from({ length: count }, (_, index) => ({ value: `@src/file-${index}.js`, label: `src/file-${index}.js`, mono: true }));

function make(answer, options = {}) {
	const composer = new ui.Composer({ label: 'Message', onsubmit: () => Promise.resolve(), onsuggest: () => Promise.resolve(answer), suggest: { delay: 1, bound: 200 }, ...options }).mount(document.body);
	const panel = composer.element.querySelector('.bui-composer-suggest');
	return { composer, panel, list: panel.querySelector('[role="listbox"]'), line: panel.querySelector('.bui-composer-suggest-line'), said: panel.querySelector('.bui-announcer') };
}
async function ask(composer, text = '@src') {
	const field = composer.field;
	field.value = text;
	field.setSelectionRange(text.length, text.length);
	field.dispatchEvent(new InputEvent('input', { bubbles: true }));
	await page.until(() => composer.suggestions.state === 'results' || composer.suggestions.state === 'none');
}

test('a total past the items: the list ends with "50 of 120 · keep typing to narrow", which describes it and is said with the answer', async () => {
	const { composer, panel, list, line, said } = make({ items: paths(50), total: 120 });
	await ask(composer);
	assert.equal(list.querySelectorAll('[role="option"]').length, 50);
	assert.equal(line.hidden, false);
	assert.equal(line.textContent, '50 of 120 · keep typing to narrow');
	assert.ok(line.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_PRECEDING, 'after the list, outside the listbox');
	assert.equal(list.contains(line), false);
	assert.equal(list.getAttribute('aria-describedby'), line.id);
	assert.ok(panel.hasAttribute('data-cut'));
	assert.equal(said.textContent, '50 of 120 suggestions · keep typing to narrow', 'said once, in place of the count');
	composer.destroy();
});

test('more of unknown count says "First 50"; the product\'s own note wins; a whole list or a total that is not more has no line', async () => {
	const unknown = make({ items: paths(50), more: true });
	await ask(unknown.composer);
	assert.equal(unknown.line.textContent, 'First 50 · keep typing to narrow');
	assert.equal(unknown.said.textContent, 'First 50 suggestions · keep typing to narrow');
	unknown.composer.destroy();
	const noted = make({ items: paths(3), total: 900, note: 'Only files under src' });
	await ask(noted.composer);
	assert.equal(noted.line.textContent, 'Only files under src');
	assert.equal(noted.said.textContent, '3 suggestions · Only files under src');
	noted.composer.destroy();
	for (const answer of [paths(4), { items: paths(4) }, { items: paths(4), total: 4 }, { items: paths(4), total: 'many' }, { items: paths(4), more: 'yes' }]) {
		const whole = make(answer);
		await ask(whole.composer);
		assert.equal(whole.line.hidden, true, JSON.stringify(answer).slice(0, 40));
		assert.equal(whole.panel.hasAttribute('data-cut'), false);
		assert.equal(whole.list.hasAttribute('aria-describedby'), false);
		assert.equal(whole.said.textContent, '4 suggestions');
		whole.composer.destroy();
	}
});

test('the next answer replaces the line: a cut list, then a whole one, then no match; keys and insertion are unchanged', async () => {
	let answer = { items: paths(2), total: 40 };
	const composer = new ui.Composer({ label: 'Message', onsubmit: () => Promise.resolve(), onsuggest: () => Promise.resolve(answer), suggest: { delay: 1, bound: 200 } }).mount(document.body);
	const panel = composer.element.querySelector('.bui-composer-suggest');
	const line = panel.querySelector('.bui-composer-suggest-line');
	await ask(composer, '@s');
	assert.equal(line.textContent, '2 of 40 · keep typing to narrow');
	answer = { items: paths(1) };
	await ask(composer, '@sr');
	await page.until(() => panel.querySelectorAll('[role="option"]').length === 1);
	assert.equal(line.hidden, true);
	assert.equal(panel.hasAttribute('data-cut'), false);
	answer = { items: [], total: 0 };
	await ask(composer, '@src');
	await page.until(() => composer.suggestions.state === 'none');
	assert.equal(line.textContent, 'No match');
	answer = { items: paths(2), total: 40 };
	await ask(composer, '@s');
	await page.until(() => panel.hasAttribute('data-cut'));
	page.key(composer.field, 'Enter');
	assert.equal(composer.value, '@src/file-0.js ', 'Enter inserts the active option as before');
	composer.destroy();
});

test('Spanish and the composer\'s locale for the counts', async () => {
	const { composer, line, said } = make({ items: paths(50), total: 1200 }, { labels: ui.Composer.labels.es, locale: 'es' });
	await ask(composer);
	const total = new Intl.NumberFormat('es').format(1200);
	assert.equal(line.textContent, `50 de ${total} · sigue escribiendo para acotar`);
	assert.equal(said.textContent, `50 de ${total} sugerencias · sigue escribiendo para acotar`);
	composer.destroy();
	const first = make({ items: paths(5), more: true }, { labels: ui.Composer.labels.es });
	await ask(first.composer);
	assert.equal(first.line.textContent, 'Primeras 5 · sigue escribiendo para acotar');
	first.composer.destroy();
});
