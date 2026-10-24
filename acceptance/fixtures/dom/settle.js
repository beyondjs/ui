// The settling page of the plain DOM consumer (0.32.0), in English: beside the shared Sidebar under the family bar,
// a conversation whose composer is a running Codex turn's (the + with an entry, two long chips, Interrupt and
// Queue), docked in the thread template (`?page=thread`, the default) or held in a plain page's section
// (`?page=plain`), with a panel kept in view from a 73rem region. The settling checks narrow the window and read
// every frame it paints. window.fixture records what the page heard.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { FamilyBar, Sidebar, Page, PageHeader, Section, Button, Composer, ChoiceChip, Facts, el } from '@beyond-js/ui';
import { chosen, fallback, product } from '../data/family.js';
import { shape, words, groups, models, levels, summary, actions, paragraphs } from '../data/settle.js';

const copy = words.en;
const log = [];
const fixture = { log, ready: false };
window.fixture = fixture;
const root = document.getElementById('root');
const bar = new FamilyBar({ product, brand: { src: '../brand/wordmark.svg', href: '/projects/' }, descriptor: chosen(), fallback, account: { signout: () => {} } }).mount(root);
const shell = root.appendChild(el('div', { class: 'bui-shell' }));
const sidebar = new Sidebar({ product: copy.product, context: { label: copy.project, name: 'Storefront' }, groups: groups(copy) }).mount(shell);
const main = shell.appendChild(el('main', { id: 'main' }));

const model = new ChoiceChip({ label: copy.model, options: models, value: 'sol', onchange: value => log.push(`model:${value}`) });
const autonomy = new ChoiceChip({ label: copy.autonomy, options: levels(copy), value: 'folder', onchange: value => log.push(`autonomy:${value}`) });
const composer = new Composer({
	label: copy.message,
	placeholder: copy.placeholder,
	add: [{ label: copy.mention, keys: '@', run: () => log.push('mention') }],
	settings: [model, autonomy],
	summary,
	actions: actions(copy),
	stop: { label: copy.interrupt, run: () => log.push('interrupt') },
	onsubmit: message => (log.push(`send:${message.action}:${message.text}`), Promise.resolve())
});

const details = new Button({ label: copy.details, variant: 'quiet' });
const header = new PageHeader({ title: copy.title, actions: [details] });
const facts = new Facts({ head: { title: copy.changes, value: copy.summary }, rows: [{ key: 'engine', label: copy.engine, value: 'Codex' }] });
const thread = el('div', { class: 'fixture-thread', id: 'thread' }, paragraphs.map(text => el('p', { text })));
const panel = { cut: '73rem', title: copy.details, head: true, onchange: shown => log.push(`panel:${shown}`) };
const section = shape.page === 'plain' ? new Section({ title: copy.section, children: [composer.element] }) : null;
const page =
	shape.page === 'plain'
		? new Page({ header, children: [section.element, thread], aside: [facts.element], label: copy.panel, panel }).mount(main)
		: new Page({ template: 'thread', header, children: [thread], dock: composer, aside: [facts.element], label: copy.panel, panel }).mount(main);
page.panel.control(details.element);

Object.assign(fixture, {
	composer,
	page,
	destroy() {
		for (const component of [page, header, composer, model, autonomy, facts, details, sidebar, bar]) component.destroy();
	},
	ready: true
});
