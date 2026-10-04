import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { start, minute, at, preparing, blocked } from './fixtures/operations.mjs';

/** E52 generalized: the awaited card at its thresholds, Check again, its end; D43: technical details. */
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
const expected = { median: 2 * minute, p90: 4 * minute };
const make = (options = {}) => new ui.Awaited({ title: 'Starting My first VM', since: at(0), expected, check: async () => {}, ...options }).mount(document.body);
const parts = card => {
	const node = card.element;
	const bar = node.querySelector('progress');
	return {
		time: node.querySelector('.bui-awaited-time').textContent,
		since: node.querySelector('.bui-awaited-since').textContent,
		bar: bar.hidden ? 'hidden' : bar.hasAttribute('value') ? Number(bar.value.toFixed(3)) : 'indeterminate',
		again: !node.querySelector('.bui-awaited-actions').hidden,
		state: node.dataset.state
	};
};

test('Awaited: the time left of the median, then of the 90th percentile; past it "Taking longer than usual" with Check again', () => {
	const moving = clock(0);
	const card = make({ clock: moving });
	assert.equal(card.element.querySelector('h2.bui-awaited-title').textContent, 'Starting My first VM');
	assert.equal(card.element.getAttribute('aria-labelledby'), card.element.querySelector('h2').id);
	assert.match(parts(card).since, /^Since \d\d:\d\d$/);
	assert.deepEqual(parts(card), { ...parts(card), time: 'About 2 min left', bar: 0, again: false, state: 'progress' });
	moving.at(1.5);
	assert.deepEqual([parts(card).time, parts(card).bar], ['Less than a minute left', 0.675]);
	moving.at(2); // exactly the median: from here the time left counts toward the 90th percentile
	assert.deepEqual([parts(card).time, parts(card).bar, parts(card).state], ['About 2 min left', 0.9, 'late']);
	moving.at(3); // between the median and the 90th percentile: counts toward the 90th percentile
	assert.deepEqual([parts(card).time, parts(card).bar, parts(card).state, parts(card).again], ['About 1 min left', 0.925, 'late', false]);
	moving.at(4); // exactly the 90th percentile: not slow yet
	assert.equal(parts(card).state, 'late');
	assert.equal(card.announced, '');
	moving.at(4 + 1 / 60);
	assert.deepEqual(parts(card), { ...parts(card), time: 'Taking longer than usual', bar: 'indeterminate', again: true, state: 'slow' });
	assert.equal(card.element.querySelector('progress').getAttribute('aria-valuetext'), 'Taking longer than usual');
	assert.equal(card.announced, 'Starting My first VM: taking longer than usual');
	card.destroy();
	assert.equal(moving.size, 0);
});

test('Awaited: without a start or an expected time the bar is indeterminate and no time is claimed', () => {
	const card = make({ since: null, clock: clock(1) });
	assert.deepEqual([parts(card).time, parts(card).bar, parts(card).since], ['', 'indeterminate', '']);
	assert.equal(card.element.querySelector('progress').getAttribute('aria-valuetext'), 'Time left unknown');
	card.update({ since: at(0), expected: null });
	assert.deepEqual([parts(card).time, parts(card).bar], ['', 'indeterminate']);
	card.destroy();
});

test('Awaited: drawn from the record and the clock only, so a reload shows the same', () => {
	const first = make({ clock: clock(3), steps: preparing });
	const reloaded = make({ clock: clock(3), steps: structuredClone(preparing) });
	assert.deepEqual(parts(reloaded), parts(first));
	assert.equal(reloaded.element.querySelector('.bui-awaited-body').textContent, first.element.querySelector('.bui-awaited-body').textContent);
	assert.equal(reloaded.steps.steps.length, 4);
	first.destroy();
	reloaded.destroy();
});

test('Awaited: Check again runs once at a time, shows it is running and recovers from a failed check', async () => {
	let release;
	let calls = 0;
	const card = make({ clock: clock(5), check: () => (calls++, new Promise((resolve, reject) => (release = { resolve, reject }))) });
	const button = card.element.querySelector('.bui-awaited-actions button');
	assert.equal(button.textContent, 'Check again');
	button.click();
	button.click();
	await card.again();
	assert.equal(calls, 1, 'single flight');
	assert.equal(button.getAttribute('aria-disabled'), 'true');
	assert.equal(button.textContent, 'Check again…');
	assert.ok(button.querySelector('.bui-spinner'));
	release.reject(new Error('no answer'));
	await page.until(() => !button.hasAttribute('aria-disabled'));
	assert.equal(card.element.querySelector('.bui-awaited-note').textContent, 'The check did not finish. Try again.');
	button.click();
	assert.equal(calls, 2, 'pressable again after a failure');
	assert.equal(card.element.querySelector('.bui-awaited-note').textContent, '', 'a new check clears the note');
	release.resolve();
	await page.until(() => !button.hasAttribute('aria-disabled'));
	card.destroy();
});

test('Awaited: a reason replaces the time with why and the way on; the end completes the bar once', () => {
	const ends = [];
	const moving = clock(1);
	const card = make({ clock: moving, steps: blocked, onend: outcome => ends.push(outcome) });
	let ran = 0;
	card.update({ reason: { text: 'Conduict cannot reach the machine.', way: 'Check its firewall rule, then try again.', action: { label: 'Open the estate', run: () => ran++ }, details: { text: 'i/o timeout', request: 'req_1', time: at(1) } } });
	assert.deepEqual([parts(card).time, parts(card).bar, parts(card).again, parts(card).state], ['', 'hidden', true, 'stalled']);
	assert.equal(card.element.querySelector('.bui-awaited-why').textContent, 'Conduict cannot reach the machine. Check its firewall rule, then try again.');
	card.element.querySelector('.bui-awaited-reason .bui-button-primary').click();
	assert.equal(ran, 1);
	assert.ok(card.element.querySelector('.bui-awaited-reason details.bui-details'));
	assert.equal(card.announced, 'Starting My first VM: Conduict cannot reach the machine.');
	card.update({ reason: null });
	assert.equal(parts(card).state, 'progress', 'the reason gone, the time again');
	card.end();
	card.end('failed');
	assert.deepEqual([parts(card).time, parts(card).bar, parts(card).again, parts(card).state], ['Done', 1, false, 'done']);
	assert.deepEqual(ends, ['done'], 'onend once');
	assert.equal(card.ended, 'done');
	assert.equal(card.announced, 'Starting My first VM: done');
	moving.at(30);
	assert.equal(parts(card).state, 'done', 'an ended card never becomes slow');
	card.destroy();
	const failed = make({ clock: clock(1), onend: outcome => ends.push(outcome) });
	failed.end('failed');
	assert.deepEqual([parts(failed).time, parts(failed).bar, ends.at(-1)], ['Did not finish', 'hidden', 'failed']);
	failed.destroy();
});

test('Awaited: Spanish copy and a heading level', () => {
	const card = make({ clock: clock(0.5), level: 3, labels: ui.Awaited.labels.es });
	assert.ok(card.element.querySelector('h3.bui-awaited-title'));
	assert.equal(parts(card).time, 'Queda aproximadamente 2 min');
	assert.match(parts(card).since, /^Desde \d\d:\d\d$/);
	card.destroy();
});

test('TechnicalDetails: the words, the request and the time, copied together for support', async () => {
	const copies = [];
	const saved = navigator.clipboard.writeText;
	navigator.clipboard.writeText = async text => void copies.push(text);
	const details = new ui.TechnicalDetails({ text: 'dial tcp: i/o timeout', request: 'req_7Hq2', time: at(5) }).mount(document.body);
	assert.equal(details.element.tagName, 'DETAILS');
	assert.equal(details.element.querySelector('summary').textContent, 'Technical details');
	assert.equal(details.element.open, false);
	assert.equal(details.element.querySelector('time').getAttribute('datetime'), at(5));
	assert.equal(details.report, `dial tcp: i/o timeout\nRequest: req_7Hq2\nTime: ${at(5)}`);
	details.element.querySelector('.bui-details-actions button').click();
	await page.until(() => details.element.querySelector('.bui-details-result').textContent);
	assert.deepEqual(copies, [details.report]);
	assert.equal(details.element.querySelector('.bui-details-result').getAttribute('role'), 'status');
	assert.equal(details.element.querySelector('.bui-details-result').textContent, 'Copied');
	navigator.clipboard.writeText = saved;
	details.destroy();
});

test('TechnicalDetails: a refused, missing or silent clipboard is said in place and the text is selected', async () => {
	const saved = navigator.clipboard.writeText;
	const bound = ui.TechnicalDetails.bound;
	const details = new ui.TechnicalDetails({ text: 'refused', request: 'req_2', labels: ui.TechnicalDetails.labels.es }).mount(document.body);
	const result = () => details.element.querySelector('.bui-details-result').textContent;
	navigator.clipboard.writeText = async () => {
		throw new Error('NotAllowedError');
	};
	assert.equal(await details.copy(), false);
	assert.equal(result(), 'No se pudo copiar. Los detalles están seleccionados: cópialos con el teclado.');
	assert.match(String(window.getSelection()), /refused/);
	navigator.clipboard.writeText = undefined;
	assert.equal(await details.copy(), false, 'no Clipboard API');
	ui.TechnicalDetails.bound = 20;
	navigator.clipboard.writeText = () => new Promise(() => {});
	assert.equal(await details.copy(), false, 'no answer within the bound');
	navigator.clipboard.writeText = async () => {};
	assert.equal(await details.copy(), true, 'recovers once the clipboard answers');
	assert.equal(result(), 'Copiado');
	details.update({ text: 'changed', request: null, time: null });
	assert.equal(details.report, 'changed');
	assert.equal(result(), '', 'new details clear the earlier result');
	ui.TechnicalDetails.bound = bound;
	navigator.clipboard.writeText = saved;
	details.destroy();
});
