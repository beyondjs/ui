// The page system of the plain DOM consumer: the family bar with "Language and appearance", the
// Sidebar (or ProductNav) and one Page whose template, width, side panel and arrival line the address
// chooses; since 0.38.0 its side panel may be pinned, its main column long and its header compact, and since 0.41.0
// its header may hold a lead, and since 0.42.0 its main column may start with a checklist of first steps.
// window.fixture exposes the preferences and a teardown.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { FamilyBar, Sidebar, ProductNav, Page, PageHeader, Tabs, Section, Arrival, Button, ListRow, ActionLine, Checklist, Preferences, status, el } from '@beyond-js/ui';
import { chosen, fallback, product } from '../data/family.js';
import { shape, words, groups } from '../data/layout.js';

const root = document.getElementById('root');
const preferences = new Preferences({ key: 'beyond-layout', fallback: { appearance: 'system', locale: 'en' }, storage: null });
const bar = new FamilyBar({ product, brand: { src: '../brand/wordmark.svg', href: '/projects/' }, descriptor: chosen(), fallback, account: { signout: () => {}, preferences: { preferences, everywhere: 'https://accounts.example.test/account' } } }).mount(root);
const shell = root.appendChild(el('div', { class: shape.nav === 'sidebar' ? 'bui-shell' : 'bui-stack' }));
const nav = shape.nav === 'sidebar' ? new Sidebar({ product: 'Conduict', groups, context: { label: 'Project', name: 'Storefront' } }).mount(shell) : new ProductNav({ items: groups[0].items }).mount(shell);
const main = shell.appendChild(el('main', { id: 'main' }));
const tabs = new Tabs({ items: ['Overview', 'Conversations', 'Repositories', 'AI engines', 'Access', 'Runtime'].map((label, index) => ({ label, href: `#${index}`, current: index === 0 })) });
const header = new PageHeader({ title: words.title, crumbs: [{ label: 'Environments', href: '#/environments' }], kind: words.kind, status: status('Ready', 'success'), facts: words.facts, lead: shape.lead ? [words.lead.en, ' ', el('a', { href: words.more.href, text: words.more.en })] : null, actions: [new Button({ label: 'Start a conversation', variant: 'primary' }), new Button({ label: 'Stop the environment' }), new Button({ label: 'More actions' })], tabs, compact: shape.compact });
const arrival = shape.arrival ? new Arrival({ product: 'Conduict', href: '#/back', ondismiss: () => {} }) : null;
// The last row holds a list of its own, as a repository's copies are listed under it: it never reaches past the page
const rows = words.rows.map((row, index) =>
	index < words.rows.length - 1
		? new ListRow({ title: row, href: `#/${row}`, meta: [words.branch], tag: 'li' }).element
		: el('li', {}, [new ListRow({ title: row, href: `#/${row}`, meta: [words.branch], tag: 'div' }).element, el('ul', { class: 'bui-rows' }, words.nested.map(name => new ListRow({ title: name, href: `#/${name}`, tag: 'li' }).element))])
);
const repositories = new Section({ title: 'Repositories', description: words.description, actions: [new Button({ label: 'Add a repository' })], children: [el('ul', { class: 'bui-rows' }, rows)] });
// A wide table that scrolls inside its own box, as a collection does: it must never widen the page
const table = el('div', {}, [el('div', { class: 'layout-scroll' }, [el('table', {}, [el('tr', {}, words.columns.map(text => el('td', { text })))])])]);
const access = new Section({ title: 'Access', children: [el('p', { class: 'bui-reading', text: words.description }), table] });
// A resource page's raised panel (0.30.0): its regions, and a copy whose actions start under its name
const copy = () => el('li', {}, [
	new ListRow({ title: words.copy.machine, lead: { state: 'success', label: 'Ready' }, meta: words.copy.meta, tag: 'div' }).element,
	el('div', { class: 'bui-row-under' }, [new ActionLine({ actions: words.copy.actions.map(label => new Button({ label, variant: 'quiet', small: true })) }).element])
]);
const raised = () => [new Section({ title: 'About', children: [el('ul', {}, words.facts2.map(fact => el('li', { text: fact })))] }).element, new Section({ title: 'Working copies', children: [el('ul', { class: 'bui-rows' }, [copy()])] }).element];
// Start an application (0.38.0): the page's action first in the raised panel, beside a long list of components
const start = words.start.en;
const action = () => new Section({ title: start.title, children: [el('p', { text: start.text }), el('div', {}, [new Button({ label: start.action, variant: 'primary' }).element])] }).element;
const components = new Section({ title: start.components, description: start.description, children: [el('ul', { class: 'bui-rows' }, words.components.map(({ name, meta }) => new ListRow({ title: name, meta, tag: 'li' }).element))] });
const aside = shape.raised ? [...(shape.long ? [action()] : []), ...raised()] : shape.aside ? [el('h2', { text: 'About' }), el('ul', {}, words.facts2.map(fact => el('li', { text: fact })))] : null;
// A first run's steps (0.42.0), first in the main column as the Packages interface's arrival draws them
const first = shape.first ? new Checklist({ title: words.first.title, level: 2, steps: words.first.steps.map(step => (step.action ? { ...step, action: { ...step.action, run: () => {} } } : step)) }) : null;
const children = [...(first ? [first.element] : []), repositories.element, access.element, ...(shape.long ? [components.element] : [])];
const page = new Page({ template: shape.template, width: shape.width, arrival, header, children, aside, raised: shape.raised, pinned: shape.pinned, label: 'About this environment' }).mount(main);

window.fixture = {
	preferences,
	destroy() {
		for (const component of [page, nav, bar, ...(first ? [first] : [])]) component.destroy();
	},
	ready: true
};
