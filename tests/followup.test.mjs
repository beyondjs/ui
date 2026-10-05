import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { start, minute, at } from './fixtures/operations.mjs';

/** 0.7.1: a statement keeps its option's hint and state; Spanish for the dialog, the questions, Unavailable and Toaster; Awaited in one line. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

function clock(minutes = 0) {
	let now = start + minutes * minute;
	const made = new ui.Clock({ now: () => now });
	made.at = value => {
		now = start + value * minute;
		made.tick();
	};
	return made;
}
const hint = statement => {
	const output = statement.querySelector('output');
	const id = output.getAttribute('aria-describedby');
	return id ? statement.querySelector(`#${id}`)?.textContent : null;
};

test('a statement keeps its option\'s hint and its state in Choices, Select and ChoiceMenu', () => {
	const engine = new ui.Choices({ legend: 'AI engine', type: 'radio', name: 'engine', options: [{ value: 'claude', label: 'Claude Code', hint: 'Connected · Max plan', status: ['Ready', 'success'] }] }).mount(document.body);
	const stated = engine.element.querySelector('.bui-statement');
	assert.equal(engine.stated, true);
	assert.equal(hint(stated), 'Connected · Max plan', 'the hint describes the statement');
	assert.equal(stated.querySelector('.bui-status-success').textContent, 'Ready');
	const region = new ui.Select({ name: 'region', options: [{ value: 'us-east4', label: 'Virginia', hint: 'Closest to your team' }] }).mount(document.body);
	assert.equal(hint(region.element), 'Closest to your team');
	const menu = new ui.ChoiceMenu({ label: 'Environment', options: [{ value: 'web', label: 'web', detail: 'acme/web', status: ['Failed', 'danger'] }] }).mount(document.body);
	assert.equal(hint(menu.element.querySelector('.bui-statement')), 'acme/web');
	assert.equal(menu.element.querySelector('.bui-status-danger').textContent, 'Failed', 'a state that asks for attention is said too');
	const plain = new ui.Select({ options: [{ value: 'a', label: 'A' }] });
	assert.equal(plain.control.getAttribute('aria-describedby'), null, 'no hint, no description');
	const rows = new ui.Choices({ legend: 'Engine', type: 'radio', options: [{ value: 'a', label: 'Claude Code', status: ['Ready', 'success'] }, { value: 'b', label: 'Codex', status: ['Needs a sign-in', 'warning'] }] }).mount(document.body);
	assert.match(rows.element.querySelectorAll('label')[1].textContent, /Codex Needs a sign-in/, 'a group shows each option\'s state beside its label');
});

test('the dialog, the questions, Unavailable and Toaster carry Spanish copy', async () => {
	assert.deepEqual({ ...ui.Dialog.labels.es }, { close: 'Cerrar' });
	assert.equal(ui.confirm.labels, ui.Question.labels);
	assert.equal(ui.prompt.labels.es.cancel, 'Cancelar');
	const asked = ui.confirm({ title: '¿Borrar Storefront?', accept: 'Borrar proyecto', consequence: { lost: 'Sus entradas', kept: 'Los registros' }, labels: ui.confirm.labels.es });
	const dialog = document.querySelector('dialog');
	assert.deepEqual([...dialog.querySelectorAll('.bui-dialog-actions button')].map(node => node.textContent), ['Cancelar', 'Borrar proyecto']);
	assert.match(dialog.querySelector('.bui-consequence').textContent, /Lo que se pierde.*Lo que se conserva/);
	assert.equal(dialog.querySelector('.bui-dialog-head button').getAttribute('aria-label'), 'Cerrar');
	page.key(dialog, 'Escape');
	assert.equal(await asked, false);
	const value = ui.prompt({ title: 'Renombrar', label: 'Nombre', labels: ui.prompt.labels.es });
	const form = document.querySelector('dialog form');
	form.querySelector('input').value = '';
	form.dispatchEvent(new Event('submit', { cancelable: true }));
	assert.ok(form.querySelector('.bui-field-error').textContent.length > 0, 'the field\'s error says something');
	page.key(document.querySelector('dialog'), 'Escape');
	assert.equal(await value, null);
	const missing = new ui.Unavailable({ title: 'No disponible', reason: 'Motivo', owner: 'Propietarios', labels: ui.Unavailable.labels.es });
	assert.match(missing.element.textContent, /Quién puede cambiarlo: Propietarios/);
	const toaster = new ui.Toaster({ labels: ui.Toaster.labels.es }).mount(document.body);
	assert.equal(toaster.element.getAttribute('aria-label'), 'Mensajes');
	toaster.show('No se guardó', { tone: 'danger' });
	assert.equal(toaster.element.querySelector('.bui-toast button').getAttribute('aria-label'), 'Descartar');
	toaster.destroy();
});

test('AwaitedLine: the time so far and the usual time, "Taking longer than usual" past the 90th percentile once, Check again single-flight', async () => {
	const moving = clock(0);
	let checks = 0;
	let release = null;
	const line = new ui.AwaitedLine({ title: 'Cloning', since: at(0), expected: { median: minute, p90: 2 * minute }, check: () => (checks++, new Promise(resolve => (release = resolve))), clock: moving }).mount(document.body);
	assert.equal(line.text, 'Cloning · 0 s so far · usually about 1 min');
	assert.equal(line.state, 'progress');
	moving.at(1.5);
	assert.equal(line.state, 'late');
	assert.equal(line.announced, '', 'nothing said before it is slow');
	const again = line.element.querySelector('.bui-line-check');
	assert.equal(again.hidden, true);
	moving.at(2);
	assert.equal(line.state, 'late', 'at the 90th percentile it is not yet slow');
	moving.at(2.5);
	assert.equal(line.text, 'Cloning · Taking longer than usual · 2 min 30 s so far');
	assert.equal(line.announced, 'Cloning: taking longer than usual');
	assert.equal(again.hidden, false);
	again.click();
	again.click();
	assert.equal(checks, 1, 'one check at a time');
	release();
	await new Promise(resolve => setTimeout(resolve, 0));
	moving.at(3);
	assert.equal(line.announced, 'Cloning: taking longer than usual', 'said once');
	line.end('done');
	assert.equal(line.text, 'Cloning · Done · took 3 min');
	assert.equal(line.announced, 'Cloning: done');
	line.end('failed');
	assert.equal(line.ended, 'done', 'ended once');
	line.destroy();
});

test('AwaitedLine: a reason in place of the time, a failed check said, no expected time, Spanish', async () => {
	const moving = clock(0);
	const line = new ui.AwaitedLine({ title: 'Clonando', since: at(0), clock: moving, labels: ui.AwaitedLine.labels.es, check: async () => Promise.reject(new Error('down')) }).mount(document.body);
	moving.at(0.5);
	assert.equal(line.text, 'Clonando · 30 s hasta ahora', 'without an expected time, the time so far alone');
	line.update({ reason: 'GitHub no respondió' });
	assert.equal(line.state, 'stalled');
	assert.equal(line.text, 'Clonando · GitHub no respondió');
	assert.equal(line.announced, 'Clonando: GitHub no respondió');
	await line.again();
	assert.equal(line.element.querySelector('.bui-line-note').textContent, 'La comprobación no terminó. Vuelve a intentarlo.');
	line.end('failed');
	assert.equal(line.text, 'Clonando · No terminó');
	const untimed = new ui.AwaitedLine({ title: 'Waiting', clock: moving });
	assert.equal(untimed.text, 'Waiting');
	line.destroy();
	untimed.destroy();
});
