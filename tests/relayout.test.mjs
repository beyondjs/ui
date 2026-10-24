import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { groups, rail } from './fixtures/sidebar-rail.mjs';

/**
 * `Relayout` (0.32.0): a page's part that moves the columns without the window's says so with a `bui-layout`
 * event bubbling from it, once per change, so a part that measures itself decides in the frame the change
 * lands. The page's panel tells it (`panel.test.mjs`), and so does the Sidebar's panel.
 */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => {
	page.reset();
	page.window.happyDOM.setViewport({ width: 1440, height: 900 });
});

/** Records each `bui-layout` heard on the document, with the node it came from. */
function hear() {
	const told = [];
	const listen = event => told.push(event.target);
	document.addEventListener(ui.Relayout.event, listen);
	return { told, stop: () => document.removeEventListener(ui.Relayout.event, listen) };
}

test('a change tells once, bubbling from the node given; no change tells nothing', () => {
	const { told, stop } = hear();
	const page = document.body.appendChild(document.createElement('div'));
	const panel = page.appendChild(document.createElement('aside'));
	ui.Relayout.hide(panel, true, page);
	assert.equal(told.length, 1);
	assert.ok(told[0] === page, 'from the node given');
	assert.equal(panel.hidden, true);
	ui.Relayout.hide(panel, true, page);
	assert.equal(told.length, 1, 'already hidden: nothing told');
	ui.Relayout.hide(panel, false);
	assert.ok(told[1] === panel, 'from the element itself by default');
	ui.Relayout.mark(page, 'data-wide', true);
	ui.Relayout.mark(page, 'data-wide', true);
	assert.equal(told.length, 3, 'an attribute set once tells once');
	assert.equal(page.hasAttribute('data-wide'), true);
	ui.Relayout.mark(page, 'data-wide', false);
	assert.equal(told.length, 4);
	ui.Relayout.tell(null);
	assert.equal(told.length, 4, 'no node, nothing told');
	stop();
});

test('the Sidebar\'s panel tells each time it is collapsed or opened again beside the content', () => {
	const sidebar = new ui.Sidebar({ product: 'Conduict', groups, context: { label: 'Project', name: 'Willy' }, rail }).mount(document.body);
	const { told, stop } = hear();
	const panel = sidebar.element.querySelector('.bui-sidebar-panel');
	panel.querySelector('.bui-sidebar-collapse').click();
	assert.equal(panel.hidden, true);
	assert.equal(told.length, 1, 'collapsed: told once');
	sidebar.element.querySelector('.bui-sidebar-rail-item[aria-expanded]').click();
	assert.equal(panel.hidden, false);
	assert.equal(told.length, 2, 'opened again');
	stop();
	sidebar.destroy();
});
