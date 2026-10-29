import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { groups, rail } from './fixtures/sidebar-rail.mjs';

const page = new Page();
const { Sidebar } = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => { page.reset(); page.window.localStorage.clear(); page.window.happyDOM.setViewport({ width: 1440, height: 900 }); });
const make = options => new Sidebar({ product: 'Conduict', groups, navigation: { key: 'conduict' }, ...options }).mount(document.body);

test('first visit keeps full navigation, toggling retains selection and writes only the desktop preference', () => {
 const changes = [];
 const sidebar = make({ navigation: { key: 'conduict', onchange: value => changes.push(value) } });
 const button = sidebar.element.querySelector('.bui-sidebar-global-toggle');
 assert.equal(sidebar.collapsed, false); assert.equal(button.getAttribute('aria-expanded'), 'true');
 assert.equal(sidebar.element.querySelector('.bui-sidebar-panel').hidden, false);
 const current = sidebar.element.querySelector('.bui-sidebar-panel [aria-current]');
 button.click(); assert.equal(sidebar.collapsed, true);
 assert.equal(sidebar.element.querySelector('.bui-sidebar-panel').hidden, true);
 assert.equal(page.window.localStorage.getItem('bui-sidebar-navigation:v1:conduict'), 'collapsed');
 assert.equal(sidebar.element.querySelector('.bui-sidebar-panel [aria-current]'), current);
 assert.deepEqual(changes, [true]); sidebar.destroy();
 const next = make(); assert.equal(next.collapsed, true); next.destroy();
});

test('global collapse does not close a contextual panel or change its current destination', () => {
 const changes = [];
 const sidebar = make({ rail: { ...rail, onchange: value => changes.push(value) } });
 const panel = sidebar.element.querySelector('.bui-sidebar-panel');
 const current = sidebar.element.querySelector('.bui-sidebar-rail [aria-current]');
 sidebar.collapsed = true;
 assert.equal(panel.hidden, false); assert.equal(sidebar.rail.open, true);
 assert.equal(panel.querySelector('nav').getAttribute('aria-label'), 'Conversations');
 assert.equal(sidebar.element.querySelector('.bui-sidebar-rail [aria-current]'), current);
 assert.deepEqual(changes, []); sidebar.destroy();
});

test('object controls in an inline collapsed pane reveal the original full object group', () => {
 const sidebar = make(); sidebar.collapsed = true;
 const object = sidebar.element.querySelector('.bui-sidebar-rail button[data-label="Conversations"]');
 assert.ok(object); object.click(); assert.equal(sidebar.collapsed, false);
 assert.ok(sidebar.element.querySelector('.bui-sidebar-panel .bui-sidebar-object-head'));
 assert.ok(sidebar.element.querySelector('.bui-sidebar-panel .bui-sidebar-object').contains(document.activeElement));
 assert.equal(sidebar.element.querySelector('.bui-sidebar-panel .bui-sidebar-collapse'), null);
 sidebar.destroy();
});

test('storage failures and corrupt values preserve a usable view; translated names use the stable key', () => {
 const storage = { getItem() { return '{broken'; }, setItem() { throw new Error('blocked'); } };
 const sidebar = make({ product: 'Producto', navigation: { key: 'stable', storage } });
 assert.equal(sidebar.collapsed, false); sidebar.collapsed = true;
 sidebar.groups = groups; assert.equal(sidebar.collapsed, true);
 sidebar.navigation = { key: 'stable', storage }; assert.equal(sidebar.collapsed, true);
 sidebar.destroy();
});

test('mobile open and cancellation do not overwrite desktop preference; a resize keeps it', () => {
 const sidebar = make(); sidebar.collapsed = true;
 page.window.happyDOM.setViewport({ width: 390, height: 844 }); page.window.dispatchEvent(new page.window.Event('resize'));
 sidebar.open(); assert.equal(sidebar.expanded, true); sidebar.close();
 assert.equal(page.window.localStorage.getItem('bui-sidebar-navigation:v1:conduict'), 'collapsed');
 page.window.happyDOM.setViewport({ width: 1440, height: 900 }); page.window.dispatchEvent(new page.window.Event('resize'));
 assert.equal(sidebar.collapsed, true); sidebar.destroy();
});

test('section icons remain available with full labels in the inline view and drawer', () => {
 const sidebar = make();
 assert.equal(sidebar.element.querySelector('.bui-sidebar-panel a[href="/settings"] svg')?.dataset.icon, 'settings');
 assert.equal(sidebar.element.querySelector('.bui-drawer a[href="/settings"] svg')?.dataset.icon, 'settings');
 sidebar.destroy();
});


test('inline expansion exposes only one named navigation and no hidden duplicate destinations', () => {
 const sidebar = make();
 const rail = sidebar.element.querySelector('.bui-sidebar-rail');
 assert.equal(rail.getAttribute('role'), 'presentation');
 assert.equal(rail.hasAttribute('aria-label'), false);
 assert.ok([...rail.querySelectorAll('.bui-sidebar-rail-item')].every(node => node.hidden));
 sidebar.collapsed = true;
 assert.equal(rail.getAttribute('role'), 'navigation');
 assert.ok([...rail.querySelectorAll('.bui-sidebar-rail-item')].every(node => !node.hidden));
 assert.equal(sidebar.element.querySelector('.bui-sidebar-panel').hidden, true);
 sidebar.destroy();
});
