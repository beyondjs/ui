import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Page } from './support/page.mjs';

/**
 * The audit's corrections in existing components (0.15.0): technical details on every failure and
 * refusal that has them (D43), an outage that is not drawn as a denial (PKG-16), tabs that say they hold
 * more (X-15, PKG-19), a sidebar count that never squeezes its label (MCH-10) and a long fact that stays
 * in its column (D99, PKG-19).
 */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
const react = await import('@beyond-js/ui/react');
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
const h = React.createElement;
after(() => page.close());
beforeEach(() => page.reset());

/** Renders a React element into a fresh host; `unmount()` releases it. */
const render = async element => {
	const container = document.createElement('div');
	document.body.append(container);
	const root = createRoot(container);
	await React.act(() => root.render(element));
	return { container, unmount: () => React.act(() => root.unmount()) };
};

const sheet = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const details = { request: 'req_8f2c', time: '2026-10-17T10:42:00Z' };

test('Unavailable carries the technical details when given, and an outage is drawn with a globe, never a lock', () => {
	const refusal = new ui.Unavailable({ title: 'Packages cannot reach this computer', reason: 'Nothing answers on its address.', kind: 'outage', details }).mount(document.body);
	const summary = refusal.element.querySelector('details.bui-details summary');
	assert.ok(summary, 'a closed Technical details');
	assert.equal(refusal.element.querySelector('details').open, false);
	assert.match(refusal.element.querySelector('.bui-details-content').textContent, /req_8f2c/);
	assert.equal(refusal.element.dataset.unavailable, 'outage');
	assert.ok(refusal.details instanceof ui.TechnicalDetails);
	refusal.destroy();
	assert.equal(refusal.details.destroyed, true, 'destroyed with it');
	const plain = new ui.Unavailable({ title: 'Not open to you', reason: 'Only owners.' }).mount(document.body);
	assert.equal(plain.element.querySelector('details'), null, 'nothing without details');
	assert.equal(plain.details, null);
	plain.destroy();
});

test('a failure callout carries its technical details, in DOM and React alike', async () => {
	const failure = ui.callout({ tone: 'danger', title: 'The machine did not start', details });
	assert.match(failure.querySelector('.bui-details-content').textContent, /req_8f2c/);
	assert.equal(ui.callout({ tone: 'danger', title: 'Plain' }).querySelector('details'), null);
	const { container, unmount } = await render(h(react.Callout, { tone: 'danger', title: 'The machine did not start', details }));
	assert.match(container.querySelector('.bui-details-content').textContent, /req_8f2c/);
	await unmount();
	const missing = await render(h(react.Unavailable, { title: 'Unreachable', reason: 'No answer.', kind: 'outage', details }));
	assert.ok(missing.container.querySelector('.bui-unavailable-outage details.bui-details'));
	await missing.unmount();
});

test('Tabs say which end holds more and scroll by most of their width; nothing is focusable or announced', () => {
	const tabs = new ui.Tabs({ items: Array.from({ length: 8 }, (_, index) => ({ label: `Area ${index + 1}`, href: `#${index}`, current: index === 0 })) }).mount(document.body);
	const row = tabs.element.querySelector('.bui-productnav-list');
	Object.defineProperties(row, { scrollWidth: { value: 900, configurable: true }, clientWidth: { value: 300, configurable: true } });
	let left = 0;
	Object.defineProperty(row, 'scrollLeft', { get: () => left, set: value => (left = Math.max(0, Math.min(600, value))), configurable: true });
	row.scrollBy = ({ left: by }) => (row.scrollLeft = left + by);
	row.dispatchEvent(new page.window.Event('scroll'));
	assert.deepEqual(tabs.more, ['end']);
	assert.equal(tabs.element.dataset.more, 'end');
	const [start, end] = tabs.element.querySelectorAll('.bui-scroll-edge');
	assert.equal(start.hidden, true);
	assert.equal(end.hidden, false);
	assert.equal(end.getAttribute('tabindex'), '-1');
	assert.equal(end.getAttribute('aria-hidden'), 'true');
	end.click();
	assert.equal(left, 240, 'most of its width');
	assert.deepEqual(tabs.more, ['start', 'end']);
	row.scrollLeft = 600;
	row.dispatchEvent(new page.window.Event('scroll'));
	assert.deepEqual(tabs.more, ['start']);
	assert.match(sheet, /\.bui-scroll-edge-end\s*\{[^}]*linear-gradient\(to left, var\(--bui-nav-surface\)/);
	tabs.destroy();
	assert.equal(tabs.element.querySelector('.bui-scroll-edge'), null, 'released on destroy');
});

test('a section entry with a long count keeps its label whole: the count gives way, shown whole when cut', async () => {
	const sidebar = new ui.Sidebar({ product: 'conduict', groups: [{ heading: 'Project', items: [{ label: 'Machines', href: '/machines', meta: '1 ready · 1 busy · 1 needs attention' }] }] }).mount(document.body);
	const meta = sidebar.element.querySelector('.bui-sidebar-meta');
	assert.equal(meta.textContent, '1 ready · 1 busy · 1 needs attention', 'the whole words stay in the name');
	assert.match(sheet, /\.bui-sidebar-label\s*\{[^}]*flex:\s*1 0 auto/);
	assert.match(sheet, /\.bui-sidebar-meta\s*\{[^}]*text-overflow:\s*ellipsis/);
	assert.match(sheet, /\.bui-sidebar-entry \.bui-sidebar-label\s*\{[^}]*min-width:\s*0/, "an entry's own title is still cut");
	sidebar.destroy();
});

test('a long fact stays in the value column; only a narrow container puts it under its label (D99)', () => {
	assert.doesNotMatch(sheet.replace(/@container[^{]*\{([^{}]*\{[^}]*\})*[^}]*\}/g, ''), /\.bui-facts-row\[data-long\]\s*\{[^}]*grid-template-columns/, 'not at every width');
	assert.match(sheet, /@container bui-facts \(max-width: 30rem\)\s*\{\s*\.bui-facts-row\[data-long\]\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/);
});
