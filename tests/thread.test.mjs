import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page as Window } from './support/page.mjs';
import { Listeners } from './support/listeners.mjs';

/** The page's 0.11.0 parts: the thread tier, the panel's own head and its wide form, and the header's compact line on scroll. */
const page = new Window();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => {
	page.reset();
	page.window.happyDOM.setViewport({ width: 1280, height: 800 });
});

const frame = () => new Promise(resolve => requestAnimationFrame(() => resolve()));
/** A conversation page with a panel that has its own head, as Conduict builds it. */
function scene({ toggle = true, panel = {}, header = {} } = {}) {
	const changes = [];
	const details = new ui.Button({ label: 'Details', variant: 'quiet' });
	const heading = new ui.PageHeader({ title: 'Fix the checkout redirect', status: ui.status('Working', 'progress'), actions: toggle ? [details] : [], ...header });
	const aside = [new ui.Facts({ head: { title: 'Changes', value: '3 files · +52 −3' } }).element];
	const view = new ui.Page({ width: 'thread', header: heading, children: [document.createElement('p')], aside, label: 'Conversation details', panel: { cut: 1000, title: 'Details', head: true, onchange: shown => changes.push(shown), ...panel } }).mount(document.body);
	if (toggle) view.panel.control(details.element);
	return { view, heading, panel: view.panel, toggle: details.element, changes };
}

test('the thread tier is a width of its own; an unknown width is still refused', () => {
	const view = new ui.Page({ width: 'thread' }).mount(document.body);
	assert.equal(view.element.dataset.width, 'thread');
	assert.ok(ui.Page.widths.includes('thread'));
	view.width = 'standard';
	view.width = 'thread';
	assert.throws(() => (view.width = 'chat'), TypeError);
	view.destroy();
});

test('beside, the panel has its own head: its title and a hide control named and hinted; hiding moves focus to the toggle, or to the page heading without one', () => {
	const { view, panel, toggle, changes } = scene();
	const head = panel.element.querySelector('.bui-page-panel-head');
	assert.ok(head && panel.element.firstElementChild === head, 'the head comes first');
	assert.equal(head.querySelector('h2.bui-page-panel-title').textContent, 'Details');
	const hide = head.querySelector('.bui-page-panel-hide');
	assert.equal(hide.getAttribute('aria-label'), 'Hide Details');
	assert.ok(hide.hasAttribute('data-bui-hint'), 'its tooltip (D11)');
	assert.equal(hide.querySelector('svg').dataset.icon, 'close', 'a glyph of the closed list');
	hide.focus();
	hide.click();
	assert.equal(panel.expanded, false);
	assert.deepEqual(changes, [false], 'the choice is reported for the device to keep');
	assert.ok(document.activeElement === toggle, 'focus to the toggle');
	assert.equal(toggle.getAttribute('aria-expanded'), 'false');
	panel.title = 'Context';
	assert.equal(head.querySelector('h2').textContent, 'Context');
	assert.equal(hide.getAttribute('aria-label'), 'Hide Context');
	view.destroy();
	const bare = scene({ toggle: false });
	bare.panel.element.querySelector('.bui-page-panel-hide').focus();
	bare.panel.element.querySelector('.bui-page-panel-hide').click();
	assert.ok(document.activeElement === bare.heading.heading, 'without a toggle, focus to the page heading');
	bare.view.destroy();
});

test('below the cut the head is not drawn: the sheet shows its own head and Close; without head the panel is as in 0.10.0', () => {
	page.window.happyDOM.setViewport({ width: 800, height: 800 });
	const { view, panel, toggle } = scene();
	panel.measure();
	assert.equal(panel.mode, 'sheet');
	assert.equal(panel.element.hidden, true, 'the panel and its head are out of the page');
	toggle.click();
	const sheet = document.querySelector('dialog.bui-sheet[open]');
	assert.ok(sheet, 'its sheet opens');
	assert.equal(sheet.querySelector('.bui-page-panel-head'), null, 'the head stays behind');
	assert.equal(sheet.querySelector('.bui-sheet-close').getAttribute('aria-label'), 'Close');
	view.destroy();
	const plain = new ui.Page({ aside: [document.createElement('p')], panel: { title: 'Details' } }).mount(document.body);
	assert.equal(plain.panel.element.querySelector('.bui-page-panel-head'), null);
	plain.destroy();
});

test('the wide form is a toggle a product sets; destroy clears it; Spanish copy', () => {
	const { view, panel } = scene({ panel: { wide: true } });
	assert.equal(panel.wide, true);
	assert.ok(view.element.hasAttribute('data-panel-wide'));
	panel.wide = false;
	assert.ok(!view.element.hasAttribute('data-panel-wide'));
	panel.wide = true;
	const element = view.element;
	view.destroy();
	assert.ok(!element.hasAttribute('data-panel-wide'));
	const spanish = scene({ panel: { title: 'Detalles', labels: ui.PagePanel.labels.es } });
	assert.equal(spanish.panel.element.querySelector('.bui-page-panel-hide').getAttribute('aria-label'), 'Ocultar Detalles');
	spanish.view.destroy();
});

test("the header's compact line: placed by Page right before the header, the title and the status repeated for sight only, shown once the title's line is out", async () => {
	const tools = new ui.Button({ label: 'Create pull request', variant: 'primary' });
	const { view, heading } = scene({ header: { compact: { actions: [tools] } } });
	const bar = heading.bar;
	assert.ok(bar && bar.nextElementSibling === heading.element, 'right before the header');
	assert.ok(bar.parentElement === view.element.querySelector('.bui-page-frame'), 'in the page\'s frame, so it stays in view');
	const text = bar.querySelector('.bui-page-compact-text');
	assert.equal(text.getAttribute('aria-hidden'), 'true', 'the header already says it');
	assert.equal(bar.querySelector('.bui-page-compact-title').textContent, 'Fix the checkout redirect');
	assert.equal(bar.querySelector('.bui-page-compact-status').textContent, 'Working');
	assert.ok(bar.querySelector('.bui-page-compact-actions').contains(tools.element), "the product's own actions");
	heading.status = ui.status('Waiting for you', 'warning');
	heading.title = 'Fix the redirect';
	assert.equal(bar.querySelector('.bui-page-compact-status').textContent, 'Waiting for you');
	assert.equal(bar.querySelector('.bui-page-compact-title').textContent, 'Fix the redirect');
	assert.equal(heading.compacted, false);
	const line = heading.element.querySelector('.bui-page-title');
	line.getBoundingClientRect = () => ({ top: -80, bottom: -20, left: 0, right: 0, width: 0, height: 60 });
	page.window.dispatchEvent(new Event('scroll'));
	await frame();
	await frame();
	assert.equal(heading.compacted, true, 'shown once the title is out of view');
	assert.ok(bar.hasAttribute('data-shown'));
	line.getBoundingClientRect = () => ({ top: 100, bottom: 160, left: 0, right: 0, width: 0, height: 60 });
	heading.measure();
	assert.equal(heading.compacted, false);
	view.destroy();
	heading.destroy();
	assert.equal(bar.isConnected, false);
});

test('without compact there is no line; a destroyed compact header leaves no listener on the window', async () => {
	const plain = new ui.PageHeader({ title: 'Settings' });
	assert.equal(plain.bar, null);
	assert.equal(plain.compacted, false);
	const listeners = new Listeners(page.window).install();
	try {
		const before = listeners.present();
		const header = new ui.PageHeader({ title: 'A long conversation', compact: true });
		const view = new ui.Page({ header }).mount(document.body);
		assert.ok(listeners.present().includes('window:scroll') && listeners.present().includes('window:resize'));
		view.destroy();
		header.destroy();
		await frame();
		assert.deepEqual(listeners.present(), before);
	} finally {
		listeners.uninstall();
	}
});
