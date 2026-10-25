// The clear page of the plain DOM consumer (0.35.0): the family bar beside the Sidebar (merged with the bar
// with `?merged=1`) or over a ProductNav (`?nav=row`), and a machine's Settings whose two rows of tabs hold
// more than a phone shows, with long sections an address points at. The rows are given their tabs before the
// page is in the document and are never mounted by themselves, as a product's header and area append them.
// window.fixture exposes a teardown.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { FamilyBar, Sidebar, ProductNav, Page, PageHeader, Tabs, Section, Button, status, el } from '@beyond-js/ui';
import { chosen, fallback, product } from '../data/family.js';
import { shape, words, entries } from '../data/clear.js';

const text = words.en;
const root = document.getElementById('root');
const bar = new FamilyBar({ product, brand: { src: '../brand/wordmark.svg', href: '/projects/' }, descriptor: chosen(), fallback, account: { signout: () => {} } }).mount(root);
const shell = root.appendChild(el('div', { class: shape.nav === 'row' ? 'bui-stack' : 'bui-shell' }));
const places = entries(text.places, text.place, key => `#/${key}`);
const nav = shape.nav === 'row' ? new ProductNav({ items: places }).mount(shell) : new Sidebar({ product: text.product, groups: [{ heading: null, items: places }], context: text.project }).mount(shell);
if (shape.merged && shape.nav !== 'row') nav.merge(bar);
const main = shell.appendChild(el('main', { id: 'main' }));
const areas = new Tabs({ name: text.title, items: entries(text.areas, text.area, key => `#/machines/web-1/${key}`) });
const header = new PageHeader({ title: text.title, crumbs: [{ label: text.machines, href: '#/machines' }], status: status(text.ready, 'success'), tabs: areas, compact: shape.compact ? { actions: [new Button({ label: text.restart, small: true })] } : null });
const settings = new Tabs({ name: text.manage, items: entries(text.settings, shape.at) });
// Each section is a target an address points at, its heading focused by code after a navigation
const parts = text.parts.map(([id, title, paragraphs]) => {
	const section = new Section({ title, children: paragraphs.map(words => el('p', { class: 'bui-reading', text: words })) });
	section.element.id = id;
	section.element.classList.add('clear-part');
	section.element.querySelector('.bui-section-title').tabIndex = -1;
	return section;
});
const page = new Page({ template: 'settings', header, children: [settings.element, ...parts.map(part => part.element)] }).mount(main);

window.fixture = {
	destroy() {
		for (const component of [page, settings, areas, ...parts, nav, bar]) component.destroy();
	},
	ready: true
};
