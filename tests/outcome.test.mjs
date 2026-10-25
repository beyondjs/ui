import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/** 0.33.0 (D186): a change that did not get its answer is said in the warning tone, never as a failure. */
const page = new Page();
const environment = globalThis.IS_REACT_ACT_ENVIRONMENT;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { ChangeOutcome, FocusedForm, confirm } = await import('@beyond-js/ui/dom');
const React = await import('react');
const { createRoot } = await import('react-dom/client');
const react = await import('@beyond-js/ui/react');
after(async () => {
	await page.close();
	if (environment === undefined) delete globalThis.IS_REACT_ACT_ENVIRONMENT;
	else globalThis.IS_REACT_ACT_ENVIRONMENT = environment;
});
beforeEach(() => page.reset());

const said = node => [...node.querySelectorAll('.bui-callout-title, .bui-callout-text')].map(part => part.textContent);

test('a change answered unavailable: who did not answer and "Nothing was changed.", warning and polite', () => {
	const shown = ChangeOutcome.draw({ outcome: 'unavailable', cause: 'Beyond Projects did not answer' });
	assert.ok(shown.classList.contains('bui-callout-warning'), 'never the danger tone');
	assert.equal(shown.getAttribute('role'), 'status', 'a polite live region, never an alert');
	assert.deepEqual(said(shown), ['Beyond Projects did not answer', 'Nothing was changed.']);
	assert.equal(shown.querySelector('button, a'), null, 'without `again`, the person’s own action tries again');
	assert.deepEqual(said(ChangeOutcome.draw({ outcome: 'unavailable' })), ['Nothing was changed.'], 'no sentence depends on a missing cause');
	assert.deepEqual(said(ChangeOutcome.draw({ outcome: 'unavailable', cause: 'Beyond Projects no respondió' }, ChangeOutcome.labels.es)), ['Beyond Projects no respondió', 'No se cambió nada.']);
});

test('a change answered unavailable offers the person’s Try again, busy while it runs and one at a time; never for an unknown outcome', async () => {
	let runs = 0;
	let finish;
	const shown = document.body.appendChild(ChangeOutcome.draw({ outcome: 'unavailable', cause: 'Beyond CDN did not answer', again: () => (runs += 1, new Promise(resolve => (finish = resolve))) }));
	const button = shown.querySelector('.bui-callout-actions button');
	assert.equal(button.textContent.trim(), 'Try again');
	assert.ok(button.classList.contains('bui-button-secondary') && button.querySelector('.bui-icon'), 'the shared labelled Try again');
	button.click();
	button.click();
	await page.until(() => runs === 1);
	assert.equal(button.getAttribute('aria-disabled'), 'true', 'busy while it runs');
	assert.equal(runs, 1, 'one at a time');
	finish();
	await page.until(() => button.getAttribute('aria-disabled') !== 'true');
	const spanish = ChangeOutcome.draw({ outcome: 'unavailable', again: { run: async () => {} } }, ChangeOutcome.labels.es);
	assert.equal(spanish.querySelector('.bui-callout-actions button').textContent.trim(), 'Reintentar');
	assert.equal(ChangeOutcome.draw({ outcome: 'unknown', again: () => {} }).querySelector('button'), null, 'an unknown outcome is checked first, never tried again from here');
});

test('a change that got no answer: it may have been made, check before trying again, with the way to check and its request', () => {
	let checked = 0;
	const shown = ChangeOutcome.draw({ outcome: 'unknown', cause: 'Conduict did not answer.', check: { label: 'Check the machine', run: () => (checked += 1) }, details: { request: 'req_42', time: null, text: 'Timed out after 20 s' } });
	assert.ok(shown.classList.contains('bui-callout-warning'));
	assert.deepEqual(said(shown), ['The change may have been made.', 'Conduict did not answer. Check before trying again.']);
	shown.querySelector('.bui-callout-actions button').click();
	assert.equal(checked, 1);
	assert.match(shown.querySelector('details').textContent, /req_42/, 'its request under Technical details');
	const link = ChangeOutcome.draw({ outcome: 'unknown', check: { label: 'Open the project', href: '/p/1' } });
	assert.equal(link.querySelector('a').getAttribute('href'), '/p/1');
	assert.deepEqual(said(ChangeOutcome.draw({ outcome: 'unknown' }, ChangeOutcome.labels.es)), ['Puede que el cambio se haya hecho.', 'Compruébalo antes de volver a intentarlo.']);
	assert.equal(ChangeOutcome.is('Something failed'), false);
	assert.equal(ChangeOutcome.is({ outcome: 'unknown' }), true);
	assert.ok(Object.keys(ChangeOutcome.labels.en).every(key => key in ChangeOutcome.labels.es));
});

test('a form says what explain returns: an outcome in the warning tone, a failure’s words in danger', async () => {
	const form = document.createElement('form');
	form.append(Object.assign(document.createElement('input'), { name: 'name', value: 'web' }), Object.assign(document.createElement('button'), { type: 'submit' }));
	document.body.append(form);
	let answer = { outcome: 'unavailable', cause: 'Beyond Projects did not answer' };
	const behavior = new FocusedForm(form, { submit: async () => { throw new Error('UNAVAILABLE'); }, explain: () => answer, labels: FocusedForm.labels.en });
	form.requestSubmit();
	await page.until(() => form.querySelector('.bui-callout'));
	assert.ok(form.querySelector('.bui-callout-warning'));
	assert.deepEqual(said(form), ['Beyond Projects did not answer', 'Nothing was changed.']);
	assert.equal(form.querySelector('input').value, 'web', 'what was written stays');
	answer = { text: 'Renaming waits for the machine to start.', tone: 'warning' };
	form.requestSubmit();
	await page.until(() => form.querySelector('.bui-callout-warning .bui-callout-title')?.textContent.startsWith('Renaming'));
	assert.equal(form.querySelector('.bui-callout').getAttribute('role'), 'status', 'its own words in the warning tone, politely');
	answer = 'That name is taken.';
	form.requestSubmit();
	await page.until(() => form.querySelector('.bui-callout-danger'));
	assert.equal(form.querySelector('.bui-callout-danger').getAttribute('role'), 'alert');
	assert.ok(Object.keys(FocusedForm.labels.en).every(key => key in FocusedForm.labels.es));
	behavior.destroy();
});

test('a confirmation’s work answered unavailable stays in the dialog in the warning tone, never as an alert', async () => {
	const asked = confirm({ title: 'Delete the machine', accept: 'Delete machine', labels: confirm.labels.es, work: async () => { throw new Error('UNAVAILABLE'); }, explain: () => ({ outcome: 'unavailable', cause: 'Conduict no respondió' }) });
	await page.until(() => document.querySelector('dialog')?.open);
	[...document.querySelectorAll('dialog button')].find(button => button.textContent.trim() === 'Delete machine').click();
	await page.until(() => document.querySelector('.bui-question-problem .bui-callout'));
	const problem = document.querySelector('.bui-question-problem');
	assert.equal(problem.getAttribute('role'), null, 'the container no longer interrupts');
	assert.ok(problem.querySelector('.bui-callout-warning'));
	assert.deepEqual(said(problem), ['Conduict no respondió', 'No se cambió nada.']);
	[...document.querySelectorAll('dialog button')].find(button => button.textContent.trim() === 'Cancelar').click();
	assert.equal(await asked, false);
});

test('React ChangeOutcome draws the same callout, its check read from the latest props', async () => {
	const host = document.createElement('div');
	document.body.append(host);
	const root = createRoot(host);
	let checked = '';
	const render = name => React.act(async () => root.render(React.createElement(react.ChangeOutcome, { outcome: 'unknown', cause: 'Conduict did not answer', check: { label: 'Check the machine', onSelect: () => (checked = name) } })));
	await render('first');
	await render('second');
	assert.equal(host.querySelectorAll('.bui-callout').length, 1);
	assert.deepEqual(said(host), ['The change may have been made.', 'Conduict did not answer. Check before trying again.']);
	host.querySelector('.bui-callout-actions button').click();
	assert.equal(checked, 'second');
	assert.equal(react.ChangeOutcome.labels, ChangeOutcome.labels);
	await React.act(async () => root.unmount());
});
