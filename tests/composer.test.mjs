import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/** Composer (0.10.0): keys by mode and device, one send at a time, the text back on a rejection, the split menu, stop, the reason beside the action. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const settle = () => new Promise(resolve => setTimeout(resolve, 0));
/** A composer whose sends are recorded and answered by the test. */
function make(options = {}) {
	const sent = [];
	const answers = [];
	const changes = [];
	const composer = new ui.Composer({
		label: 'Message to Claude Code',
		placeholder: 'Message Claude Code…',
		onsubmit: message => {
			sent.push(message);
			return new Promise((resolve, reject) => answers.push({ resolve, reject }));
		},
		onchange: text => changes.push(text),
		...options
	}).mount(document.body);
	return { composer, sent, answers, changes, field: composer.field };
}
const enter = (field, options = {}) => page.key(field, 'Enter', options);
/** Makes the window a touch screen (no hover, a coarse pointer) while `work` runs. */
async function touch(work) {
	const saved = page.window.matchMedia;
	page.window.matchMedia = query => ({ matches: query.includes('hover: none'), media: query, addEventListener() {}, removeEventListener() {} });
	try {
		await work();
	} finally {
		page.window.matchMedia = saved;
	}
}

test('a field named by its label, one line, with the keys said in a hidden hint', () => {
	const { composer, field } = make();
	assert.equal(field.tagName, 'TEXTAREA');
	assert.equal(field.getAttribute('aria-label'), 'Message to Claude Code');
	assert.equal(field.getAttribute('rows'), '1');
	assert.equal(field.getAttribute('placeholder'), 'Message Claude Code…');
	const drawn = composer.element.querySelector('.bui-composer-placeholder');
	assert.equal(drawn.textContent, 'Message Claude Code…', 'drawn over the empty field, one line with an ellipsis');
	assert.equal(drawn.getAttribute('aria-hidden'), 'true', 'the textarea\'s own placeholder is what assistive technology reads');
	assert.equal(composer.element.querySelector('label'), null, 'no visible label');
	const hint = document.getElementById(field.getAttribute('aria-describedby'));
	assert.equal(hint.textContent, 'Enter sends. Shift+Enter adds a line.');
	assert.ok(hint.classList.contains('bui-hidden'));
	assert.equal(composer.element.querySelector('.bui-button-primary').textContent, 'Send', 'one action, Send, by default');
	composer.destroy();
});

test('Enter sends on a hardware keyboard; Shift+Enter, Alt+Enter and an input method do not; ⌘/Ctrl+Enter sends', async () => {
	const { composer, sent, answers, field } = make();
	composer.value = 'first';
	assert.equal(enter(field, { shiftKey: true }).defaultPrevented, false, 'Shift+Enter adds a line');
	assert.equal(enter(field, { altKey: true }).defaultPrevented, false);
	assert.equal(enter(field, { isComposing: true }).defaultPrevented, false, 'an input method composing');
	const ended = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
	Object.defineProperty(ended, 'keyCode', { value: 229 });
	field.dispatchEvent(ended);
	assert.equal(sent.length, 0, "Safari's Enter that ends a composition never sends");
	assert.equal(enter(field).defaultPrevented, true);
	assert.deepEqual(sent, [{ text: 'first', action: 'send' }]);
	answers[0].resolve();
	await settle();
	composer.value = 'second';
	enter(field, { ctrlKey: true });
	assert.deepEqual(sent.at(-1), { text: 'second', action: 'send' }, 'Ctrl+Enter sends');
	answers[1].resolve();
	await settle();
	composer.value = 'third';
	enter(field, { metaKey: true });
	assert.equal(sent.length, 3, '⌘+Enter sends');
	composer.destroy();
});

test("with submit: 'mod' Enter adds a line and only ⌘/Ctrl+Enter sends; on a touch screen Enter adds a line and the button sends", async () => {
	const mod = make({ submit: 'mod' });
	mod.composer.value = 'line';
	assert.equal(enter(mod.field).defaultPrevented, false);
	assert.equal(mod.sent.length, 0);
	assert.match(document.getElementById(mod.field.getAttribute('aria-describedby')).textContent, /^(⌘|Ctrl)\+Enter sends\. Enter adds a line\.$/);
	enter(mod.field, { ctrlKey: true });
	assert.equal(mod.sent.length, 1);
	mod.composer.destroy();
	assert.throws(() => make({ submit: 'shift' }), /submit is one of enter, mod/);
	await touch(async () => {
		const phone = make();
		phone.composer.value = 'from a phone';
		phone.field.dispatchEvent(new Event('focus'));
		assert.equal(document.getElementById(phone.field.getAttribute('aria-describedby')).textContent, 'Enter adds a line. Use Send to send.');
		assert.equal(enter(phone.field).defaultPrevented, false, 'Enter adds a line on a touch screen');
		assert.equal(phone.sent.length, 0);
		phone.composer.element.querySelector('.bui-button-primary').click();
		assert.deepEqual(phone.sent, [{ text: 'from a phone', action: 'send' }], 'the button sends');
		phone.composer.destroy();
	});
});

test('one send at a time: the text leaves at once, the button is busy, a second Enter or press sends nothing, focus stays in the field', async () => {
	const { composer, sent, answers, changes, field } = make();
	field.focus();
	composer.value = '  Fix the redirect  ';
	enter(field);
	assert.equal(composer.value, '', 'the text left the field at once');
	assert.deepEqual(sent, [{ text: 'Fix the redirect', action: 'send' }], 'trimmed');
	assert.equal(changes.at(-1), '');
	const button = composer.element.querySelector('.bui-button-primary');
	assert.equal(composer.sending, true);
	assert.equal(button.getAttribute('aria-disabled'), 'true');
	assert.ok(button.hasAttribute('data-busy'));
	assert.equal(button.textContent, 'Send…');
	field.value = 'meanwhile';
	enter(field);
	button.click();
	assert.equal(sent.length, 1, 'nothing is sent while a send is in flight');
	answers[0].resolve();
	await settle();
	assert.equal(composer.sending, false);
	assert.equal(button.hasAttribute('aria-disabled'), false);
	assert.ok(document.activeElement === field, 'focus stays in the field');
	composer.destroy();
});

test('a rejected send gives the text back, before what was typed meanwhile, and says so; explain decides the words or silence', async () => {
	const { composer, answers, changes, field } = make();
	composer.value = 'Deploy it';
	enter(field);
	field.value = 'and tell me';
	answers[0].reject(new Error('down'));
	await settle();
	assert.equal(composer.value, 'Deploy it\nand tell me');
	assert.equal(changes.at(-1), 'Deploy it\nand tell me');
	const problem = composer.element.querySelector('.bui-composer-problem');
	assert.equal(problem.hidden, false);
	assert.equal(problem.getAttribute('role'), 'alert');
	assert.equal(problem.textContent, 'Not sent. Your message is still here.');
	assert.ok(field.getAttribute('aria-describedby').includes(problem.id));
	field.dispatchEvent(new Event('input'));
	assert.equal(problem.hidden, true, 'typing clears it');
	composer.destroy();
	const quiet = make({ explain: error => (error.quiet ? null : `Not sent: ${error.message}`) });
	quiet.composer.value = 'one';
	enter(quiet.field);
	quiet.answers[0].reject(Object.assign(new Error('held'), { quiet: true }));
	await settle();
	assert.equal(quiet.composer.value, 'one');
	assert.equal(quiet.composer.element.querySelector('.bui-composer-problem').hidden, true, 'another voice speaks');
	enter(quiet.field);
	quiet.answers[1].reject(new Error('refused'));
	await settle();
	assert.equal(quiet.composer.element.querySelector('.bui-composer-problem').textContent, 'Not sent: refused');
	quiet.composer.destroy();
});

test('an empty Enter does nothing; an empty press says why and moves focus to the field', () => {
	const { composer, sent, field } = make();
	assert.equal(enter(field).defaultPrevented, true);
	assert.equal(composer.element.querySelector('.bui-composer-problem').hidden, true);
	composer.element.querySelector('.bui-button-primary').click();
	assert.equal(sent.length, 0);
	assert.equal(composer.element.querySelector('.bui-composer-problem').textContent, 'Write a message first.');
	assert.ok(document.activeElement === field);
	composer.destroy();
});

test('the primary action and the other ways to send in a split menu; disabled says its reason beside the action', async () => {
	const { composer, sent, answers, field } = make({ actions: [{ id: 'start', label: 'Start and send', primary: true }, { id: 'wait', label: 'Send without starting' }], status: 'web is stopped. Sending starts it: about $0.21 an hour.' });
	const status = composer.element.querySelector('.bui-composer-status');
	assert.equal(status.textContent, 'web is stopped. Sending starts it: about $0.21 an hour.');
	assert.ok(field.getAttribute('aria-describedby').startsWith(status.id), 'the state line describes the field');
	const split = composer.element.querySelector('.bui-composer-send .bui-menu-button');
	assert.equal(split.getAttribute('aria-label'), 'More ways to send');
	assert.ok(split.hasAttribute('data-bui-hint'), 'the chevron alone shows its name as a tooltip (D11)');
	assert.equal(split.querySelector('svg').dataset.icon, 'chevron');
	composer.value = 'Run the tests';
	split.click();
	composer.element.querySelector('[role="menuitem"]').click();
	assert.deepEqual(sent, [{ text: 'Run the tests', action: 'wait' }]);
	answers[0].resolve();
	await settle();
	composer.disabled = { reason: 'Only an owner or admin can start web.' };
	const reason = composer.element.querySelector('.bui-composer-reason');
	const button = composer.element.querySelector('.bui-button-primary');
	assert.equal(reason.hidden, false);
	assert.equal(reason.textContent, 'Only an owner or admin can start web.');
	assert.equal(button.getAttribute('aria-disabled'), 'true');
	assert.equal(button.disabled, false, 'it stays reachable to read its reason');
	assert.equal(button.getAttribute('aria-describedby'), reason.id);
	assert.ok(field.getAttribute('aria-describedby').includes(reason.id));
	composer.value = 'again';
	enter(field);
	button.click();
	assert.equal(sent.length, 1, 'nothing is sent while unavailable');
	assert.equal(composer.element.querySelector('[role="menuitem"]').getAttribute('aria-disabled'), 'true');
	composer.disabled = null;
	composer.status = null;
	assert.equal(reason.hidden, true);
	assert.equal(status.hidden, true);
	composer.actions = [{ id: 'queue', label: 'Queue' }];
	assert.equal(composer.element.querySelector('.bui-menu-button'), null, 'no menu with one way to send');
	assert.equal(button.textContent, 'Queue');
	composer.destroy();
});

test('stop: a labelled button with the stop glyph, busy while it runs or while the product says so, gone when work ends', async () => {
	let finish;
	const runs = [];
	const { composer, field } = make({ stop: { label: 'Interrupt', run: () => (runs.push(1), new Promise(resolve => (finish = resolve))) } });
	const stop = () => composer.element.querySelector('.bui-composer-stop');
	assert.equal(stop().textContent, 'Interrupt');
	assert.equal(stop().querySelector('svg').dataset.icon, 'stop');
	stop().click();
	stop().click();
	assert.equal(runs.length, 1, 'once at a time');
	assert.ok(stop().hasAttribute('data-busy'));
	finish();
	await settle();
	assert.equal(stop().hasAttribute('data-busy'), false);
	composer.stop = { label: 'Interrupt', run: () => {}, busy: true };
	assert.ok(stop().hasAttribute('data-busy'), 'the product holds it busy (interrupt requested)');
	stop().focus();
	composer.stop = null;
	assert.equal(stop(), null);
	assert.ok(document.activeElement === field, 'focus on a stop that goes away moves to the field');
	composer.destroy();
});

test('tools and extras slots, value and placeholder setters, busy, and a field that grows between its first and last line', () => {
	const tool = document.createElement('button');
	tool.textContent = 'Environment: web';
	const extra = document.createElement('button');
	extra.textContent = 'Dictate';
	const { composer, sent, field } = make({ tools: [tool], extras: [{ element: extra }], min: 1, max: 6 });
	assert.ok(composer.element.querySelector('.bui-composer-tools').contains(tool));
	assert.ok(composer.element.querySelector('.bui-composer-extras').contains(extra));
	assert.equal(field.style.getPropertyValue('--bui-composer-max'), '6');
	composer.placeholder = 'Queue a message for Claude Code…';
	assert.equal(field.getAttribute('placeholder'), 'Queue a message for Claude Code…');
	assert.equal(composer.element.querySelector('.bui-composer-placeholder').textContent, 'Queue a message for Claude Code…');
	composer.busy = true;
	composer.value = 'held';
	enter(field);
	assert.equal(sent.length, 0, 'nothing is sent while the product is busy');
	assert.equal(composer.busy, true);
	composer.busy = false;
	composer.value = 'a draft';
	composer.value = '';
	assert.equal(field.style.height, '', 'an empty field keeps its first lines, whatever its placeholder');
	composer.tools = [];
	assert.equal(composer.element.querySelector('.bui-composer-tools').childElementCount, 0);
	assert.throws(() => new ui.Composer({ label: 'x' }), /onsubmit/);
	assert.throws(() => new ui.Composer({ label: ' ', onsubmit: async () => {} }), /label/);
	composer.destroy();
	assert.equal(document.querySelector('.bui-composer'), null);
});

test('Spanish: the copy of every word the composer says', async () => {
	const { composer, answers, field } = make({ labels: ui.Composer.labels.es });
	assert.equal(composer.element.querySelector('.bui-button-primary').textContent, 'Enviar');
	assert.equal(document.getElementById(field.getAttribute('aria-describedby')).textContent, 'Intro envía. Mayús+Intro añade una línea.');
	composer.value = 'hola';
	enter(field);
	answers[0].reject(new Error('x'));
	await settle();
	assert.equal(composer.element.querySelector('.bui-composer-problem').textContent, 'No se envió. Tu mensaje sigue aquí.');
	assert.deepEqual(Object.keys(ui.Composer.labels.es).sort(), Object.keys(ui.Composer.labels.en).sort());
	composer.destroy();
});
