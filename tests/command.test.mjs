import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/** `CommandCard` (0.15.0, DQ-13): the request said once, the command whole, Enter and Escape while focused, one answer at a time, a failed answer said in place, the outcome stated. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
const react = await import('@beyond-js/ui/react');
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
after(() => page.close());
beforeEach(() => page.reset());

const command = 'npm run test -- --filter "addresses in the address bar" && git status';

test('the card: its title, the command whole in mono, the answers with their keys, focusable on arrival', () => {
	const card = new ui.CommandCard({ title: 'Claude Code asks to run a command', command, detail: 'On web, in acme/web', allow: () => {}, deny: () => {} }).mount(document.body);
	const root = card.element;
	assert.equal(root.getAttribute('aria-labelledby'), root.querySelector('.bui-command-title').id);
	assert.equal(root.querySelector('.bui-command-code code').textContent, command, 'never cut');
	const [allow, deny] = root.querySelectorAll('.bui-command-actions button');
	assert.deepEqual([allow.getAttribute('aria-keyshortcuts'), deny.getAttribute('aria-keyshortcuts')], ['Enter', 'Escape']);
	assert.equal(allow.querySelector('kbd.bui-keys').getAttribute('aria-hidden'), 'true', 'the key hint is hidden on touch and from assistive technology');
	assert.ok(allow.classList.contains('bui-button-primary'));
	card.focus();
	assert.equal(document.activeElement, root);
	assert.equal(root.dataset.state, 'pending');
	card.destroy();
});

test('Enter allows and Escape denies while focus is in the card; one answer at a time; the outcome replaces the answers', async () => {
	const answers = [];
	let release;
	const card = new ui.CommandCard({ title: 'Run?', command: 'ls', scope: { label: 'Always allow commands like this' }, allow: answer => new Promise(resolve => ((release = resolve), answers.push(['allow', answer.scope]))), deny: () => answers.push(['deny']) }).mount(document.body);
	card.element.querySelector('.bui-command-scope').click();
	card.focus();
	page.key(card.element, 'Enter');
	page.key(card.element, 'Enter');
	assert.deepEqual(answers, [['allow', true]], 'sent once, with the scope');
	assert.equal(card.element.getAttribute('aria-busy'), 'true');
	release();
	await page.until(() => card.state === 'allowed');
	assert.equal(card.element.querySelector('.bui-command-actions').hidden, true);
	assert.equal(card.element.querySelector('.bui-command-line').textContent, 'Allowed');
	page.key(card.element, 'Escape');
	assert.equal(answers.length, 1, 'an answered card takes no key');
	const other = new ui.CommandCard({ title: 'Run?', command: 'ls', allow: () => {}, deny: () => answers.push(['deny']) }).mount(document.body);
	const outside = document.createElement('button');
	document.body.append(outside);
	page.key(outside, 'Escape');
	assert.equal(answers.length, 1, 'keys outside the card are not answers');
	page.key(other.element, 'Escape');
	await page.until(() => other.state === 'denied');
	card.destroy();
	other.destroy();
});

test('a failed answer is said in place and the answers stay; a long command folds behind Show all; Spanish', async () => {
	let fail = true;
	const card = new ui.CommandCard({ title: 'Ejecutar', command: Array.from({ length: 12 }, (_, index) => `line ${index}`).join('\n'), allow: async () => { if (fail) throw new Error('down'); }, deny: () => {}, labels: ui.CommandCard.labels.es }).mount(document.body);
	assert.equal(await card.answer('allow'), false);
	assert.equal(card.state, 'pending');
	assert.equal(card.element.querySelector('.bui-command-line').textContent, 'No se pudo confirmar tu respuesta. Vuelve a intentarlo.');
	fail = false;
	assert.equal(await card.answer('allow'), true);
	assert.equal(card.element.querySelector('.bui-command-line').textContent, 'Permitido');
	const code = card.element.querySelector('.bui-command-code');
	const toggle = card.element.querySelector('.bui-command-toggle');
	assert.ok(code.hasAttribute('data-folded'));
	toggle.click();
	assert.deepEqual([code.hasAttribute('data-folded'), toggle.getAttribute('aria-expanded'), toggle.textContent], [false, 'true', 'Ver menos']);
	for (const key of Object.keys(ui.CommandCard.labels.en)) assert.ok(key in ui.CommandCard.labels.es, key);
	assert.equal(await card.answer('maybe'), false, 'only allow or deny');
	card.destroy();
});

test('React CommandCard answers through the latest handlers and states the outcome given', async () => {
	const h = React.createElement;
	const host = document.createElement('div');
	document.body.append(host);
	const root = createRoot(host);
	const calls = [];
	const draw = (mark, state = 'pending') => React.act(() => root.render(h(react.CommandCard, { title: 'Run?', command: 'ls', state, onAllow: () => calls.push(mark), onDeny: () => {} })));
	await draw('first');
	await draw('second');
	host.querySelector('.bui-button-primary').click();
	await page.until(() => calls.length === 1);
	assert.deepEqual(calls, ['second']);
	await draw('second', 'denied');
	assert.equal(host.querySelector('.bui-command').dataset.state, 'denied');
	await React.act(() => root.unmount());
});
