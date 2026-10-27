import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Page as Window } from './support/page.mjs';

/**
 * A page's lead (0.41.0, D191): `PageHeader`'s `lead` is one sentence or a short paragraph under the facts line,
 * in the DOM and React with one markup, in the body's role, muted and held at the reading measure, while the facts
 * line keeps the object's properties (D160). Also the Preferences dialog's "Change for all of Beyond", a link in a
 * sentence, in the text's colour with the quiet underline (`page.test.mjs` holds the link itself). Where the lead stands and how wide it reads are
 * measured in the browser acceptance (`checks/layout.mjs`, "page: a lead").
 */
const page = new Window();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const ui = await import('@beyond-js/ui/dom');
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
const react = await import('@beyond-js/ui/react');
const h = React.createElement;
const { act, StrictMode } = React;
after(() => page.close());
beforeEach(() => page.reset());

const sheet = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
/** The declarations of the rules whose selector list names this selector, joined. */
const rules = selector =>
	[...sheet.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
		.filter(([, selectors]) => selectors.split(',').map(item => item.trim()).includes(selector) || selectors.includes(`${selector},`) || selectors.includes(`, ${selector})`) || selectors.includes(`${selector})`))
		.map(([, , body]) => body)
		.join(';');
const said = 'Choose which repositories Beyond Projects may read, and who may push to them.';

test('PageHeader: the lead under the facts line, its own paragraph; none takes no room (0.41.0, D191)', () => {
	const header = new ui.PageHeader({ title: 'GitHub', facts: 'Beyond (GitHub App) · 3 repositories', lead: said }).mount(document.body);
	const element = header.element;
	const lead = element.querySelector('.bui-page-lead');
	assert.equal(lead.tagName, 'P');
	assert.equal(lead.textContent, said);
	assert.equal(lead.hidden, false);
	assert.equal(lead.previousElementSibling, element.querySelector('.bui-page-facts'), 'the lead follows the facts line');
	assert.equal(element.querySelector('.bui-page-facts').textContent, 'Beyond (GitHub App) · 3 repositories', 'the facts line keeps the properties');
	header.lead = ['Read ', ui.el('a', { href: '#how', text: 'how access works' }), '.'];
	assert.equal(lead.textContent, 'Read how access works.');
	assert.equal(lead.querySelector('a').getAttribute('href'), '#how', 'a lead may hold a link among its words');
	header.lead = null;
	assert.equal(lead.hidden, true, 'no lead takes no room');
	assert.equal(lead.childNodes.length, 0);
	header.lead = '';
	assert.equal(lead.hidden, true, 'an empty lead takes no room');
	header.destroy();
	const plain = new ui.PageHeader({ title: 'web' });
	assert.equal(plain.element.querySelector('.bui-page-lead').hidden, true, 'a header without a lead draws none');
	plain.destroy();
});

test('PageHeader: a lead with no facts line stands right under the title\'s line', () => {
	const header = new ui.PageHeader({ title: 'Audit', lead: said });
	const parts = [...header.element.children].filter(child => !child.hidden).map(child => child.className);
	assert.deepEqual(parts, ['bui-page-title', 'bui-page-lead']);
	header.destroy();
});

test('React PageHeader: the lead with the DOM class\'s markup, and none without it', async () => {
	const host = document.body.appendChild(document.createElement('div'));
	const root = createRoot(host);
	await act(() => root.render(h(StrictMode, null, h(react.PageHeader, { title: 'GitHub', facts: 'Beyond (GitHub App)', lead: said }))));
	const lead = host.querySelector('.bui-page-lead');
	assert.equal(lead.tagName, 'P');
	assert.equal(lead.textContent, said);
	assert.equal(lead.previousElementSibling.className, 'bui-page-facts');
	const dom = new ui.PageHeader({ title: 'GitHub', facts: 'Beyond (GitHub App)', lead: said });
	assert.equal(dom.element.querySelector('.bui-page-lead').outerHTML, lead.outerHTML, 'one markup');
	dom.destroy();
	await act(() => root.render(h(StrictMode, null, h(react.PageHeader, { title: 'GitHub' }))));
	assert.equal(host.querySelector('.bui-page-lead'), null, 'no lead, no paragraph');
	await act(() => root.unmount());
});

test('PageHeader: the lead as given, and nothing, a boolean, empty words or an empty list say nothing', () => {
	const header = new ui.PageHeader({ title: 'GitHub', lead: said });
	const lead = header.element.querySelector('.bui-page-lead');
	assert.equal(header.lead, said, 'the lead reads back as given');
	for (const empty of [null, undefined, false, true, '', [], ['', null, false]]) {
		header.lead = empty;
		assert.equal(lead.hidden, true, `${JSON.stringify(empty)} takes no room`);
		assert.equal(lead.childNodes.length, 0);
	}
	header.lead = undefined;
	assert.equal(header.lead, null, 'no lead reads back as null');
	header.lead = 0;
	assert.equal(lead.hidden, false);
	assert.equal(lead.textContent, '0', 'a number is said');
	header.destroy();
});

test('React PageHeader: an empty lead draws nothing, as the DOM header; a number is said', async () => {
	const host = document.body.appendChild(document.createElement('div'));
	const root = createRoot(host);
	for (const empty of [null, false, '', [], [null, false, ''], h(React.Fragment), h(React.Fragment, null, null, false)]) {
		await act(() => root.render(h(StrictMode, null, h(react.PageHeader, { title: 'GitHub', lead: empty }))));
		assert.equal(host.querySelector('.bui-page-lead'), null, 'nothing said, no paragraph');
	}
	await act(() => root.render(h(StrictMode, null, h(react.PageHeader, { title: 'GitHub', lead: 0 }))));
	assert.equal(host.querySelector('.bui-page-lead')?.textContent, '0');
	await act(() => root.render(h(StrictMode, null, h(react.PageHeader, { title: 'GitHub', lead: h(React.Fragment, null, 'Choose ', h('a', { href: '#how' }, 'how')) }))));
	assert.equal(host.querySelector('.bui-page-lead')?.textContent, 'Choose how', 'a fragment with words is said');
	await act(() => root.unmount());
});

test('the built stylesheet: the lead in the body\'s role, muted and at the reading measure; the facts line unchanged', () => {
	const lead = rules('.bui-page-lead');
	assert.match(lead, /color:\s*var\(--color-text-muted\)/);
	assert.match(lead, /font-size:\s*var\(--text-body\)/);
	assert.match(lead, /line-height:\s*var\(--leading-body\)/);
	assert.match(lead, /font-weight:\s*var\(--weight-regular\)/);
	assert.match(lead, /max-width:\s*var\(--layout-measure\)/, 'held at the reading measure, as bui-reading');
	assert.ok(rules('.bui-reading').includes('max-width: var(--layout-measure)'), 'the same measure as bui-reading');
	assert.doesNotMatch(rules('.bui-page-facts'), /max-width/, 'the facts line still wraps where the header ends');
});

test('the built stylesheet: "Change for all of Beyond" takes the text\'s colour and the quiet underline, full on hover', () => {
	const link = rules('.bui-preferences-note a');
	assert.match(link, /color:\s*var\(--color-link\)/, 'the text\'s colour on a page with no base link rule');
	assert.match(link, /text-decoration-line:\s*underline/);
	assert.match(link, /text-decoration-color:\s*var\(--color-border-strong\)/);
	const hover = [...sheet.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(([, selectors]) => selectors.includes('.bui-preferences-note a') && selectors.includes(':hover'));
	assert.match(hover?.[2] ?? '', /text-decoration-color:\s*currentColor/, 'full on hover');
	assert.match(rules('.bui-page-lead a'), /text-decoration-color:\s*var\(--color-border-strong\)/, 'a link in a lead too');
});
