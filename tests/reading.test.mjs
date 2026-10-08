import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Page } from './support/page.mjs';

/**
 * 0.11.2: a long value in words reads under its label; the family's one disclosure affordance; a floating
 * disclosure panel opens above its button when there is no room below; the panel's widths on a wide region.
 */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
const React = await import('react');
const { renderToStaticMarkup } = await import('react-dom/server');
const react = await import('@beyond-js/ui/react');
after(() => page.close());
beforeEach(() => page.reset());

const sheet = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

test('Facts: a sentence longer than the measure goes under its label; an identifier, a short value and a row that says otherwise stay beside it', () => {
	const reason = "Codex's sandbox could not start on Conduict's Docker machines and has not run on Compute Engine";
	const facts = new ui.Facts({
		rows: [
			{ key: 'sandbox', label: 'Sandbox', value: reason },
			{ key: 'branch', label: 'Branch', value: 'conduict/fix-the-checkout-redirect-after-a-failed-payment', mono: true },
			{ key: 'state', label: 'State', value: 'Running' },
			{ key: 'forced', label: 'Note', value: 'Short', long: true },
			{ key: 'kept', label: 'Reason', value: reason, long: false }
		]
	}).mount(document.body);
	const long = key => facts.element.querySelectorAll('.bui-facts-row')[['sandbox', 'branch', 'state', 'forced', 'kept'].indexOf(key)].hasAttribute('data-long');
	assert.equal(long('sandbox'), true);
	assert.equal(long('branch'), false, 'an identifier keeps its place beside Copy');
	assert.equal(long('state'), false);
	assert.equal(long('forced'), true);
	assert.equal(long('kept'), false);
	facts.rows = [{ key: 'sandbox', label: 'Sandbox', value: 'Confined' }];
	assert.equal(facts.element.querySelector('.bui-facts-row').hasAttribute('data-long'), false, 'patched with its value');
	assert.equal(ui.Facts.long({ value: reason }), true);
	assert.equal(ui.Facts.long({ value: reason, mono: true }), false);
	assert.match(sheet, /\.bui-facts-row\[data-long\]\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/);
	assert.match(sheet, /\.bui-facts-data\s*\{[^}]*text-align:\s*start/, 'a wrapped value reads from its start');
	const markup = renderToStaticMarkup(React.createElement(react.Facts, { rows: [{ key: 'sandbox', label: 'Sandbox', value: reason }, { key: 'state', label: 'State', value: 'Running' }] }));
	assert.equal((markup.match(/data-long=""/g) ?? []).length, 1, 'React draws the same rule');
	facts.destroy();
});

test("TechnicalDetails' summary is the family's disclosure affordance: a chevron before its words, never a link's color", () => {
	const details = new ui.TechnicalDetails({ text: 'boom', request: 'req_1' }).mount(document.body);
	const summary = details.element.querySelector('summary');
	assert.ok(summary.classList.contains('bui-summary'));
	assert.ok(summary.firstElementChild.matches('svg'), 'the chevron first');
	assert.equal(summary.textContent, 'Technical details');
	assert.match(sheet, /\.bui-summary\s*\{[^}]*color:\s*var\(--color-text\)/);
	assert.match(sheet, /details\[open\] > \.bui-summary > \.bui-icon\s*\{[^}]*rotate:\s*0deg/);
	assert.doesNotMatch(sheet, /\.bui-details-summary\s*\{[^}]*--color-link/);
	details.destroy();
});

test('a floating disclosure panel opens above its button when there is no room below and more above; below otherwise', () => {
	const view = page.window;
	const style = view.getComputedStyle;
	const disclosure = new ui.Disclosure({ label: 'Details', children: [document.createElement('p')] }).mount(document.body);
	const box = (node, rect) => (node.getBoundingClientRect = () => ({ top: rect.top, bottom: rect.top + rect.height, left: 0, right: 100, width: 100, height: rect.height }));
	view.getComputedStyle = node => (node === disclosure.panel ? { position: 'absolute' } : style.call(view, node));
	Object.defineProperty(view, 'innerHeight', { value: 800, configurable: true });
	try {
		box(disclosure.button, { top: 700, height: 32 });
		box(disclosure.panel, { top: 740, height: 300 });
		disclosure.open();
		assert.ok(disclosure.panel.classList.contains('bui-disclosure-above'), 'no room below');
		disclosure.close();
		box(disclosure.button, { top: 100, height: 32 });
		disclosure.open();
		assert.equal(disclosure.panel.classList.contains('bui-disclosure-above'), false, 'room below');
		disclosure.close();
		view.getComputedStyle = style;
		box(disclosure.button, { top: 700, height: 32 });
		disclosure.open();
		assert.equal(disclosure.panel.classList.contains('bui-disclosure-above'), false, 'a panel in the flow (help) never moves');
	} finally {
		view.getComputedStyle = style;
		disclosure.destroy();
	}
	assert.match(sheet, /\.bui-disclosure-panel\.bui-disclosure-above,[^{]*\{[^}]*bottom:\s*calc\(100% \+ var\(--space-1\)\)/);
	const above = new ui.Disclosure({ label: 'Details', placement: 'above' }).mount(document.body);
	view.getComputedStyle = node => (node === above.panel ? { position: 'absolute' } : style.call(view, node));
	try {
		above.button.getBoundingClientRect = () => ({ top: 100, bottom: 132, left: 0, right: 100, width: 100, height: 32 });
		above.open();
		assert.ok(above.panel.classList.contains('bui-disclosure-above'), 'placement: above opens above whatever the room (a docked composer under it)');
	} finally {
		view.getComputedStyle = style;
		above.destroy();
	}
});

test('the panel beside a thread grows to --layout-aside-max (40rem); its wide form takes every width the thread leaves', () => {
	assert.match(sheet, /\.bui-page\[data-panel-wide\]\[data-panel='beside'\] \.bui-page-body:has\(> \.bui-page-panel:not\(\[hidden\]\)\)\s*\{[^}]*grid-template-columns:\s*clamp\(var\(--layout-aside\), calc\(100% - var\(--space-8\) - var\(--layout-aside-wide\)\), var\(--bui-page-main\)\) minmax\(0, 1fr\);[^}]*max-width:\s*none/);
	const tokens = readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8');
	assert.match(tokens, /--layout-aside-max: 40rem;/);
	assert.match(sheet, /html:has\(\.bui-page-compact\)\s*\{[^}]*scroll-padding-top:\s*calc\(var\(--layout-family\) \+ var\(--bui-page-compact\) \+ var\(--space-2\)\)/, 'a target lands below the compact line');
});

test('a closed ChoiceMenu never draws a dot alone: a calm state is in its name only; a state that asks for attention shows its dot with its word', () => {
	const calm = new ui.ChoiceMenu({ label: 'Base branch', options: [{ value: 'main', label: 'main', status: ['Default', 'neutral'] }, { value: 'dev', label: 'dev' }], value: 'main' }).mount(document.body);
	assert.equal(calm.control.querySelector('.bui-choice-dot'), null, 'no dot without its word');
	assert.match(calm.control.textContent, /Default/, 'the state stays in the name');
	assert.ok(calm.control.querySelector('.bui-hidden'), 'not drawn');
	const alarm = new ui.ChoiceMenu({ label: 'Environment', options: [{ value: 'lab', label: 'lab', status: ['Failed', 'danger'] }, { value: 'vm', label: 'vm' }], value: 'lab' }).mount(document.body);
	assert.ok(alarm.control.querySelector('.bui-choice-dot.bui-status-danger'), 'the dot beside its word');
	assert.equal(alarm.control.querySelector('.bui-choice-state').textContent, 'Failed');
	calm.destroy();
	alarm.destroy();
});
