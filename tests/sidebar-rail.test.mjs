import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { groups, rail } from './fixtures/sidebar-rail.mjs';

const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => { page.reset(); page.window.happyDOM.setViewport({ width: 1440, height: 900 }); });
const make = options => new ui.Sidebar({ product: 'Conduict', groups, context: { label: 'Project', name: 'Willy' }, rail, ...options }).mount(document.body);
const toggle = sidebar => sidebar.element.querySelector('.bui-sidebar-rail-item[aria-expanded]');

test('the opt-in rail presents the existing sections in its own order and one contextual object group', () => {
	const sidebar = make();
	const navigation = sidebar.element.querySelector('.bui-sidebar-rail');
	assert.equal(navigation.getAttribute('aria-label'), 'Conduict sections');
	assert.deepEqual([...navigation.children].map(node => node.dataset.label), ['Home', 'Conversations', 'Repositories', 'Machines', 'Live', 'Settings']);
	assert.equal(navigation.querySelector('[aria-current="page"]').getAttribute('aria-label'), 'Repositories');
	assert.equal(navigation.querySelector('[data-label="Machines"]').getAttribute('aria-label'), 'Machines · 2');
	assert.equal(navigation.querySelector('[data-label="Settings"] svg').dataset.icon, 'settings');
	assert.ok([...navigation.children].every(node => node.hasAttribute('data-bui-hint')));
	const panel = sidebar.element.querySelector('.bui-sidebar-panel');
	assert.equal(panel.hidden, false);
	assert.equal(panel.querySelectorAll('.bui-sidebar-context').length, 0, 'the desktop context is already in the family bar');
	assert.equal(panel.querySelectorAll('.bui-sidebar-groups > *').length, 1);
	assert.ok(panel.textContent.includes('Improve checkout'));
	assert.equal(toggle(sidebar).getAttribute('aria-controls'), panel.id);
	sidebar.destroy();
});

test('a person collapses and reopens the panel with state, callback and focus kept on its rail toggle', () => {
	const calls = [];
	const sidebar = make({ rail: { ...rail, onchange: value => calls.push(value) } });
	const panel = sidebar.element.querySelector('.bui-sidebar-panel');
	const trigger = toggle(sidebar);
	panel.querySelector('.bui-sidebar-collapse').click();
	assert.equal(panel.hidden, true);
	assert.equal(trigger.getAttribute('aria-expanded'), 'false');
	assert.ok(document.activeElement === trigger);
	trigger.click();
	assert.equal(panel.hidden, false);
	assert.equal(trigger.getAttribute('aria-expanded'), 'true');
	assert.deepEqual(calls, [false, true]);
	sidebar.rail = { ...rail, open: false, onchange: () => calls.push('new') };
	assert.equal(panel.hidden, true);
	assert.deepEqual(calls, [false, true], 'a setter never announces a person action');
	trigger.click();
	assert.deepEqual(calls, [false, true, 'new'], 'the latest handler is used');
	sidebar.destroy();
});

test('groups update without replacing a focused rail entry and an object disappearing removes its toggle', () => {
	const sidebar = make();
	const link = sidebar.element.querySelector('.bui-sidebar-rail [data-label="Machines"]');
	link.focus();
	sidebar.groups = [{ ...groups[0], items: groups[0].items.map(item => item.key === 'machines' ? { ...item, meta: 3 } : item) }, groups[1]];
	assert.ok(document.activeElement === link);
	assert.equal(link.getAttribute('aria-label'), 'Machines · 3');
	sidebar.groups = [groups[0]];
	assert.equal(toggle(sidebar), null);
	assert.equal(sidebar.element.querySelector('.bui-sidebar-panel').hidden, true);
	sidebar.destroy();
});

test('rail navigation calls the same product handler with a readable label', () => {
	const calls = [];
	const sidebar = make({ onnavigate: item => calls.push(item) });
	sidebar.element.querySelector('.bui-sidebar-rail a[href="/live"]').click();
	assert.equal(calls.length, 1);
	assert.equal(calls[0].label, 'Live');
	assert.equal(calls[0].href, '/live');
	sidebar.destroy();
});

test('a removed contextual object returns its focused content to an existing rail destination', () => {
	const sidebar = make();
	const panel = sidebar.element.querySelector('.bui-sidebar-panel');
	panel.querySelector('a[href="/conversations/new"]').focus();
	sidebar.groups = [groups[0]];
	const current = sidebar.element.querySelector('.bui-sidebar-rail [aria-current="page"]');
	assert.ok(document.activeElement === current);
	assert.equal(current.getAttribute('aria-label'), 'Repositories');
	assert.equal(panel.hidden, true);
	sidebar.destroy();
});

test('the narrow drawer keeps every section, its object actions and the original context', () => {
	page.window.happyDOM.setViewport({ width: 390, height: 844 });
	const sidebar = make({ labels: ui.Sidebar.labels.es });
	assert.equal(sidebar.mode, 'drawer');
	assert.equal(sidebar.element.querySelector('.bui-sidebar-rail').hidden, true);
	assert.equal(sidebar.element.querySelector('.bui-sidebar-panel').hidden, true);
	sidebar.open();
	const drawer = sidebar.element.querySelector('dialog');
	assert.equal(drawer.open, true);
	assert.ok(drawer.textContent.includes('Repositories'));
	assert.ok(drawer.textContent.includes('Willy'));
	assert.ok(drawer.textContent.includes('Improve checkout'));
	assert.ok(drawer.querySelector('a[href="/conversations/new"]'));
	assert.equal(sidebar.element.querySelector('.bui-sidebar-collapse').getAttribute('aria-label'), 'Ocultar Conversations');
	sidebar.destroy();
});

test('disabling the opt-in restores the standard sidebar; no panel is invented for a missing object', () => {
	const sidebar = make();
	sidebar.rail = null;
	assert.equal(sidebar.element.hasAttribute('data-rail'), false);
	assert.equal(sidebar.element.querySelector('.bui-sidebar-rail'), null);
	assert.ok(sidebar.element.querySelector('.bui-sidebar-panel').textContent.includes('Repositories'));
	sidebar.rail = { panel: 'missing' };
	assert.equal(toggle(sidebar), null);
	assert.equal(sidebar.element.querySelector('.bui-sidebar-panel').hidden, true);
	sidebar.destroy();
});


test('a contextual object can navigate to its own route instead of toggling a global panel', () => {
	const calls = [];
	const changes = [];
	const copies = [{ ...groups[0], items: groups[0].items.map(item => ({ ...item, current: false })) }, { ...groups[1], href: '/conversations', current: true }];
	const sidebar = make({ groups: copies, rail: { ...rail, open: false, onchange: value => changes.push(value) }, onnavigate: item => calls.push(item) });
	const link = sidebar.element.querySelector('.bui-sidebar-rail [data-label="Conversations"]');
	assert.equal(link.localName, 'a');
	assert.equal(link.getAttribute('href'), '/conversations');
	assert.equal(link.getAttribute('aria-current'), 'page');
	assert.equal(link.hasAttribute('aria-expanded'), false);
	link.click();
	assert.equal(calls[0].href, '/conversations');
	assert.deepEqual(changes, [], 'navigation leaves panel visibility to its route owner');
	assert.equal(sidebar.element.querySelector('.bui-sidebar-panel').hidden, true);
	sidebar.rail = { ...rail, open: true };
	sidebar.element.querySelector('.bui-sidebar-collapse').click();
	assert.ok(document.activeElement === link, 'collapse returns focus to the destination link');
	sidebar.destroy();
});

test('the rail\'s foot keeps the product\'s object in use at its end, its state by shape and in words, opening its panel (0.19.1, D161)', () => {
	const pressed = [];
	const foot = { label: 'Recovered machine', glyph: 'box', status: { state: 'waking', label: 'Waking up' }, onclick: control => pressed.push(control) };
	const sidebar = make({ rail: { ...rail, foot } });
	const navigation = sidebar.element.querySelector('.bui-sidebar-rail');
	const control = navigation.lastElementChild;
	assert.ok(control.classList.contains('bui-sidebar-rail-foot'), 'the foot is the rail\'s last control');
	assert.equal(control.tagName, 'BUTTON');
	assert.equal(control.getAttribute('aria-label'), 'Recovered machine · Waking up', 'its name says the object and its state in words');
	assert.equal(control.getAttribute('aria-haspopup'), 'dialog');
	assert.ok(control.hasAttribute('data-bui-hint'), 'its name is its hint');
	assert.equal(control.querySelector('svg').dataset.icon, 'box');
	const mark = control.querySelector('.bui-sidebar-rail-state');
	assert.ok(mark.classList.contains('bui-status-progress'), 'waking is drawn as work in progress (a half-filled circle)');
	assert.equal(mark.getAttribute('aria-hidden'), 'true', 'the words carry the meaning; the mark only repeats it');
	control.click();
	assert.deepEqual(pressed, [control], 'a press hands the control to the product, for focus to return to');
	control.focus();
	sidebar.rail = { ...rail, foot: { ...foot, status: { state: 'ready', label: 'Ready' } } };
	assert.ok(navigation.lastElementChild === control, 'a change of state patches the same control');
	assert.ok(document.activeElement === control, 'and keeps focus on it');
	assert.equal(control.getAttribute('aria-label'), 'Recovered machine · Ready');
	assert.ok(control.querySelector('.bui-sidebar-rail-state').classList.contains('bui-status-success'));
	sidebar.groups = [{ ...groups[0], items: groups[0].items.map(item => (item.key === 'machines' ? { ...item, meta: 3 } : item)) }, groups[1]];
	assert.ok(navigation.lastElementChild === control, 'the sections\' updates keep the foot last');
	sidebar.rail = { ...rail, foot: { label: 'Recovered machine' } };
	assert.equal(control.querySelector('.bui-sidebar-rail-state'), null, 'without a state no mark is drawn');
	assert.equal(control.getAttribute('aria-label'), 'Recovered machine');
	sidebar.rail = { ...rail, foot: null };
	assert.equal(navigation.querySelector('.bui-sidebar-rail-foot'), null, 'none takes no room');
	sidebar.destroy();
});
