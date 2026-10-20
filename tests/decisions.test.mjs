import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/** `CommandCard`'s scoped decisions (0.16.0, CNV-10): allow once or for the conversation, deny with a note, a command corrected before allowing; 0.15.0's allow and deny unchanged. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const decisions = [
	{ value: 'once', label: 'Allow once', kind: 'allow' },
	{ value: 'conversation', label: 'Allow for this conversation', kind: 'allow', said: 'Allowed for this conversation' },
	{ value: 'note', label: 'Deny and say why', kind: 'deny', note: { placeholder: 'What should it do instead?' } },
	{ value: 'deny', label: 'Deny', kind: 'deny' }
];

test('scoped decisions: one button each, Enter the first allow, Escape the first plain deny; the card says the decision', async () => {
	const answers = [];
	const card = new ui.CommandCard({ title: 'Claude Code asks to run a command', command: 'npm test', decisions, ondecide: answer => answers.push(answer) }).mount(document.body);
	const buttons = [...card.element.querySelectorAll('.bui-command-actions button')];
	assert.deepEqual(buttons.map(button => button.textContent.replace(/⏎|Esc/, '')), ['Allow once', 'Allow for this conversation', 'Deny and say why', 'Deny']);
	assert.deepEqual(buttons.map(button => button.getAttribute('aria-keyshortcuts')), ['Enter', null, null, 'Escape']);
	buttons[1].click();
	await page.until(() => card.state === 'allowed');
	assert.deepEqual(answers, [{ value: 'conversation', kind: 'allow', note: null, command: null, scope: false }]);
	assert.equal(card.element.querySelector('.bui-command-line').textContent, 'Allowed for this conversation');
	card.destroy();
	const keyed = new ui.CommandCard({ title: 'Run?', command: 'ls', decisions, ondecide: answer => answers.push(answer.value) }).mount(document.body);
	keyed.focus();
	page.key(keyed.element, 'Escape');
	await page.until(() => keyed.state === 'denied');
	assert.equal(answers.at(-1), 'deny');
	keyed.destroy();
});

test('deny with a note asks for it first: Enter sends the note, Escape goes back to the answers', async () => {
	const answers = [];
	const card = new ui.CommandCard({ title: 'Run?', command: 'rm -rf build', decisions, ondecide: answer => answers.push(answer), labels: ui.CommandCard.labels.es }).mount(document.body);
	card.element.querySelectorAll('.bui-command-actions button')[2].click();
	const field = card.element.querySelector('.bui-command-note-field');
	assert.equal(document.activeElement, field);
	assert.equal(field.placeholder, 'What should it do instead?');
	assert.equal(card.element.querySelector('.bui-command-note label').textContent, 'Describe una alternativa');
	page.key(field, 'Escape');
	assert.equal(card.element.querySelector('.bui-command-note').hidden, true, 'back to the answers');
	assert.equal(answers.length, 0);
	card.element.querySelectorAll('.bui-command-actions button')[2].click();
	field.value = 'Clean only the dist folder';
	page.key(field, 'Enter');
	await page.until(() => card.state === 'denied');
	assert.deepEqual(answers[0], { value: 'note', kind: 'deny', note: 'Clean only the dist folder', command: null, scope: false });
	for (const key of Object.keys(ui.CommandCard.labels.en)) assert.ok(key in ui.CommandCard.labels.es, key);
	card.destroy();
});

test('an editable command is corrected before allowing; the answer carries it; 0.15.0 allow and deny still work', async () => {
	const answers = [];
	const card = new ui.CommandCard({ title: 'Run?', command: 'npm test', editable: true, allow: answer => answers.push(answer) }).mount(document.body);
	const field = card.element.querySelector('textarea.bui-command-edit');
	assert.equal(field.value, 'npm test');
	field.value = 'npm test -- --watch=false';
	page.key(field, 'Escape');
	assert.equal(card.state, 'pending', 'Escape while correcting never denies');
	card.element.querySelector('.bui-button-primary').click();
	await page.until(() => card.state === 'allowed');
	assert.deepEqual(answers, [{ scope: false, command: 'npm test -- --watch=false' }]);
	assert.equal(card.element.querySelector('.bui-command-line').textContent, 'Allowed');
	card.destroy();
});
