// The page system of the plain DOM consumer: the family bar with "Language and appearance", the
// Sidebar (or ProductNav) and one Page whose template, width, side panel and arrival line the address
// chooses. window.fixture exposes the preferences and a teardown.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { FamilyBar, Sidebar, ProductNav, Page, PageHeader, Tabs, Section, Arrival, Button, Preferences, status, el } from '@beyond-js/ui';
import { chosen, fallback, product } from '../data/family.js';
import { shape, words, groups } from '../data/layout.js';

const root = document.getElementById('root');
const preferences = new Preferences({ key: 'beyond-layout', fallback: { appearance: 'system', locale: 'en' }, storage: null });
const bar = new FamilyBar({ product, brand: { src: '../brand/wordmark.svg', href: '/projects/' }, descriptor: chosen(), fallback, account: { signout: () => {}, preferences: { preferences, everywhere: 'https://accounts.example.test/account' } } }).mount(root);
const shell = root.appendChild(el('div', { class: shape.nav === 'sidebar' ? 'bui-shell' : 'bui-stack' }));
const nav = shape.nav === 'sidebar' ? new Sidebar({ product: 'Conduict', groups, context: { label: 'Project', name: 'Storefront' } }).mount(shell) : new ProductNav({ items: groups[0].items }).mount(shell);
const main = shell.appendChild(el('main', { id: 'main' }));
const tabs = new Tabs({ items: ['Overview', 'Conversations', 'Repositories', 'AI engines', 'Access', 'Runtime'].map((label, index) => ({ label, href: `#${index}`, current: index === 0 })) });
const header = new PageHeader({ title: words.title, crumbs: [{ label: 'Environments', href: '#/environments' }], status: status('Ready', 'success'), facts: words.facts, actions: [new Button({ label: 'Start a conversation', variant: 'primary' }), new Button({ label: 'Stop the environment' }), new Button({ label: 'More actions' })], tabs });
const arrival = shape.arrival ? new Arrival({ product: 'Conduict', href: '#/back', ondismiss: () => {} }) : null;
const repositories = new Section({ title: 'Repositories', description: words.description, actions: [new Button({ label: 'Add a repository' })], children: [el('ul', {}, words.rows.map(row => el('li', { text: row })))] });
const access = new Section({ title: 'Access', children: [el('p', { class: 'bui-reading', text: words.description })] });
const page = new Page({ template: shape.template, width: shape.width, arrival, header, children: [repositories.element, access.element], aside: shape.aside ? [el('h2', { text: 'About' }), el('ul', {}, words.facts2.map(fact => el('li', { text: fact })))] : null, label: 'About this environment' }).mount(main);

window.fixture = {
	preferences,
	destroy() {
		for (const component of [page, nav, bar]) component.destroy();
	},
	ready: true
};
