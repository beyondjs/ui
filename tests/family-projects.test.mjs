import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { inside, annotated, many, member, nobody, standing } from './fixtures/family.mjs';

/** The 0.4.0 location: project rows with their state, the chooser outside a project, search, notice and organizations. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const brand = { src: '/brand/wordmark.svg', href: '/own-home' };
const make = (options = {}) => new ui.FamilyBar({ product: 'delegate', brand, account: { signout: () => {} }, ...options }).mount(document.body);
const menu = (bar, part) => bar.element.querySelector(`.bui-family-wide [data-part="${part}"], .bui-family-narrow [data-part="${part}"]`);
// The rows a person sees once the menu opens: those the search has not hidden.
const rows = (bar, part) => [...menu(bar, part).querySelectorAll('.bui-navmenu-item')].filter(node => !node.closest('li[hidden], .bui-navmenu-section[hidden]'));
const texts = nodes => nodes.map(node => node.querySelector('.bui-navmenu-label').textContent);
const state = node => node.querySelector('.bui-navmenu-state')?.textContent.replace(/^, /, '') ?? null;

test('project rows: the current first, then by collation; states from `here`, the product\'s own group, overview and all', () => {
	const bar = make({ descriptor: annotated, fallback: { links: { projects: 'https://delegate.example.test/#/projects' } } });
	const items = rows(bar, 'project');
	assert.deepEqual(texts(items), ['Storefront', 'Ads', 'Ármadillo', 'Handbook', 'Zeta', 'Nora sample', 'Project overview', 'All projects of Northwind']);
	assert.deepEqual(items.slice(0, 6).map(state), [null, 'No access in Delegate', null, 'Not set up in Delegate', null, null], 'used and unmarked rows show nothing; mapped 0 is not set up');
	assert.equal(items[3].textContent, 'Handbook, Not set up in Delegate', 'the state is part of the row\'s name');
	assert.equal(items[0].getAttribute('aria-current'), 'true');
	assert.equal(items[3].getAttribute('href'), 'https://delegate.example.test/?project=prj_docs', 'here.url');
	assert.equal(items[4].getAttribute('href'), 'https://delegate.example.test/?project=prj_zeta', 'without here.url: the product\'s entry');
	assert.ok(items.slice(0, 6).every(item => item.tagName === 'A'), 'every state still links to the product\'s arrival');
	const only = menu(bar, 'project').querySelector('.bui-family-only');
	assert.equal(only.querySelector('.bui-navmenu-heading').textContent, 'Only in Delegate');
	assert.equal(items[7].getAttribute('href'), 'https://delegate.example.test/#/projects', 'all projects: the product\'s own page');
	assert.equal(menu(bar, 'project').querySelector('.bui-navmenu-search'), null, 'six rows: no search');
	bar.destroy();
	const spanish = make({ descriptor: annotated, labels: { unset: 'Sin configurar en {product}', denied: 'Sin acceso en {product}', only: 'Solo en {product}' } });
	assert.deepEqual(rows(spanish, 'project').slice(1, 4).map(state), ['Sin acceso en Delegate', null, 'Sin configurar en Delegate']);
	spanish.destroy();
});

test('a project row without `here`, or a descriptor that lost every `here`, shows no mark', () => {
	const lost = { ...annotated, projects: annotated.projects.map(({ here, ...project }) => project) };
	const bar = make({ descriptor: lost });
	assert.ok(rows(bar, 'project').every(item => !item.querySelector('.bui-navmenu-state')));
	assert.equal(menu(bar, 'project').querySelector('.bui-family-only'), null, 'no state: no product group');
	bar.destroy();
	const unknown = make({ descriptor: { ...annotated, projects: [{ id: 'p', name: 'Odd', here: { state: 'SOMETHING' } }, { id: 'q', name: 'Bad', here: 'yes' }] } });
	assert.deepEqual(rows(unknown, 'project').slice(0, 2).map(state), [null, null], 'an unknown state is not invented');
	unknown.destroy();
});

test('outside a project: "Choose a project", no overview, and an empty catalog says so', () => {
	const bar = make({ descriptor: { ...annotated, project: null } });
	const button = menu(bar, 'project').querySelector('.bui-navmenu-button');
	assert.equal(button.textContent, 'Choose a project');
	assert.ok(menu(bar, 'project').classList.contains('bui-family-choose'));
	assert.ok(!texts(rows(bar, 'project')).includes('Project overview'));
	assert.equal(rows(bar, 'project').filter(item => item.hasAttribute('aria-current')).length, 0);
	bar.destroy();
	const empty = make({ descriptor: { ...annotated, project: null, projects: [] } });
	assert.equal(menu(empty, 'project').querySelector('.bui-navmenu-none').textContent, 'Northwind has no projects yet');
	assert.deepEqual(texts(rows(empty, 'project')), ['All projects of Northwind'], 'never an empty menu');
	empty.destroy();
});

test('search: offered past eight rows, filters without case or accents, says when nothing matches and recovers', () => {
	const eight = make({ descriptor: { ...many, projects: many.projects.slice(0, 8) } });
	assert.equal(menu(eight, 'project').querySelector('.bui-navmenu-search'), null, 'exactly eight rows: no search');
	eight.destroy();
	const bar = make({ descriptor: { ...many, projects: [...many.projects, { id: 'dlg_x', name: 'Xylo', here: { state: 'only', url: '/x' } }] }, fallback: { links: { projects: 'https://delegate.example.test/projects' } } });
	const field = menu(bar, 'project').querySelector('input.bui-navmenu-field');
	assert.equal(field.getAttribute('aria-label'), 'Search projects');
	const type = text => {
		field.value = text;
		field.dispatchEvent(new Event('input', { bubbles: true }));
	};
	type('ÉCH');
	assert.deepEqual(texts(rows(bar, 'project')).filter(text => !text.startsWith('All projects')), ['Échelle']);
	assert.equal(menu(bar, 'project').querySelector('.bui-family-only').hidden, true, 'a group with no match is hidden');
	type('zzz');
	const none = menu(bar, 'project').querySelector('.bui-navmenu-none:not([hidden])');
	assert.equal(none.querySelector('.bui-navmenu-label').textContent, 'No projects match "zzz"');
	assert.equal(none.querySelector('a').getAttribute('href'), 'https://delegate.example.test/projects?q=zzz');
	assert.equal(none.querySelector('a').textContent, 'Search all projects of Northwind');
	type('');
	assert.equal(rows(bar, 'project').length, 14, 'twelve rows, the product\'s own row and all projects');
	assert.equal(menu(bar, 'project').querySelector('.bui-navmenu-none:not([hidden])'), null);
	bar.destroy();
});

test('search from the keyboard: the field first, arrows into the rows, Home and End left to the caret', () => {
	const bar = make({ descriptor: many });
	const trigger = menu(bar, 'project').querySelector('.bui-navmenu-button');
	page.key(trigger, 'Enter');
	trigger.click();
	const field = menu(bar, 'project').querySelector('input.bui-navmenu-field');
	assert.ok(document.activeElement === field, 'opened from the keyboard on the search field');
	assert.equal(page.key(field, 'Home').defaultPrevented, false);
	page.key(field, 'ArrowDown');
	assert.equal(document.activeElement.querySelector('.bui-navmenu-label').textContent, 'Atlas');
	bar.destroy();
});

test('the product\'s notice: one line at the top of the project menu, its action, replaced and removed', () => {
	const runs = [];
	const notice = { text: "Delegate isn't set up for Northwind", action: { label: 'Try again', run: () => runs.push('again') } };
	const bar = make({ descriptor: annotated, notice });
	const lines = menu(bar, 'project').querySelectorAll('.bui-navmenu-notice');
	assert.equal(lines.length, 1);
	assert.equal(lines[0].querySelector('span').textContent, notice.text);
	lines[0].querySelector('button').click();
	assert.deepEqual(runs, ['again']);
	assert.equal(bar.notice.text, notice.text);
	bar.notice = { text: 'Read more', href: '/why' };
	assert.equal(menu(bar, 'project').querySelector('.bui-navmenu-notice a').getAttribute('href'), '/why');
	bar.notice = null;
	assert.equal(menu(bar, 'project').querySelector('.bui-navmenu-notice'), null);
	bar.destroy();
});

test('unavailable with a notice: the project menu says so, keeps the project in view and all projects', () => {
	const notice = { text: "Beyond Projects didn't answer. Projects not yet in Delegate may be missing.", action: { label: 'Try again', run: () => {} } };
	const fallback = { organization: 'Northwind', project: 'Storefront', organizations: standing, links: { projects: '/delegate/projects' } };
	const bar = make({ descriptor: { unavailable: true }, fallback, notice });
	assert.equal(menu(bar, 'project').querySelector('.bui-navmenu-heading').textContent, 'Projects of Northwind');
	assert.ok(menu(bar, 'project').querySelector('.bui-navmenu-notice'));
	assert.deepEqual(texts(rows(bar, 'project')), ['Storefront', 'All projects of Northwind']);
	assert.equal(rows(bar, 'project')[0].getAttribute('aria-current'), 'true');
	bar.notice = null;
	assert.equal(menu(bar, 'project'), null, 'without a notice the project is text again');
	assert.equal(bar.element.querySelector('.bui-family-wide .bui-family-static.bui-family-project').textContent, 'Storefront');
	bar.destroy();
});

test('organizations: the product\'s own arrival when declared, Projects otherwise; one is a name; none is no location', () => {
	const bar = make({ descriptor: annotated });
	const items = rows(bar, 'organization');
	assert.equal(items[0].getAttribute('href'), 'https://delegate.example.test/?organization=org_north');
	assert.equal(items[0].querySelector('.bui-navmenu-meta').textContent, 'Owner');
	assert.equal(items[1].getAttribute('href'), 'http://localhost/projects/?organization=org_south');
	assert.equal(items[1].querySelector('.bui-navmenu-meta').textContent, 'Developer · Opens in Beyond Projects');
	assert.equal(menu(bar, 'organization').querySelector('.bui-navmenu-heading').textContent, 'Organizations');
	bar.destroy();
	const one = make({ descriptor: member });
	assert.equal(menu(one, 'organization'), null, 'one organization: no menu');
	assert.equal(one.element.querySelector('.bui-family-wide .bui-family-static.bui-family-organization').textContent, 'Northwind');
	assert.ok(menu(one, 'project'), 'the project menu still follows it');
	assert.equal(one.element.querySelector('.bui-family-narrow [data-part="location"] .bui-navmenu-heading').textContent, 'Organization');
	one.destroy();
	const none = make({ descriptor: nobody });
	assert.equal(none.element.querySelector('.bui-family-location').textContent, '');
	assert.equal(none.element.querySelector('.bui-family-divider'), null);
	none.destroy();
});

test('fallback organizations drive the organization menu while the descriptor loads or is unavailable', () => {
	for (const descriptor of [null, { unavailable: true }]) {
		const bar = make({ product: 'cdn', descriptor, fallback: { organizations: standing } });
		const items = rows(bar, 'organization');
		assert.deepEqual(texts(items), ['Northwind', 'Southwind'], `${descriptor ? 'unavailable' : 'loading'}`);
		assert.equal(items[1].getAttribute('href'), 'https://cdn.example.test/?organization=org_south');
		assert.deepEqual(items.map(item => item.getAttribute('aria-current')), ['true', null]);
		assert.equal(menu(bar, 'project'), null, 'no catalog: no project menu');
		bar.destroy();
	}
	const one = make({ product: 'cdn', descriptor: { unavailable: true }, fallback: { organizations: [{ ...standing[1], current: true }] } });
	assert.equal(menu(one, 'organization'), null);
	assert.equal(one.element.querySelector('.bui-family-wide .bui-family-static').textContent, 'Southwind');
	one.destroy();
	const ready = make({ product: 'cdn', descriptor: inside, fallback: { organizations: standing } });
	assert.equal(rows(ready, 'organization')[1].getAttribute('href'), 'http://localhost/projects/?organization=org_south', 'a ready descriptor wins over the fallback');
	ready.destroy();
});

test('FamilyBar toggle passes through and destroy releases everything', () => {
	const changes = [];
	const bar = make({ descriptor: inside, toggle: { controls: 'sidebar', expanded: false, onchange: value => changes.push(value) } });
	const toggle = bar.element.querySelector('.bui-header-toggle');
	assert.equal(toggle.getAttribute('aria-controls'), 'sidebar');
	toggle.click();
	assert.deepEqual(changes, [true]);
	assert.equal(bar.expanded, true);
	menu(bar, 'organization').querySelector('.bui-navmenu-button').click();
	bar.destroy();
	assert.equal(document.querySelector('.bui-family'), null);
	assert.equal(bar.destroyed, true);
});
