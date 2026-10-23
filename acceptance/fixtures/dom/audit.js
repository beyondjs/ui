// The 0.15.0 audit page of the plain DOM consumer: Floating's menus against the sticky bar, in a box that
// scrolls and at a composer's caret; a chip folded behind Options; Status, ListRow, DataTable, Tabs, a
// sidebar count and a CommandCard; since 0.20.5 a grouped list with its rows' marks, menus and end line
// (D162). window.fixture exposes them to the checks.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { FamilyBar, Sidebar, ActionMenu, ChoiceChip, Composer, Status, ListRow, DataTable, Tabs, CommandCard, Collection, Recency, el } from '@beyond-js/ui';
import { chosen, fallback, product } from '../data/family.js';
import { machines, options, tones, command } from '../data/audit.js';

const log = [];
const root = document.getElementById('root');
const bar = new FamilyBar({ product, brand: { src: '../brand/wordmark.svg', href: '/projects/' }, descriptor: chosen(), fallback, account: { signout: () => {} } }).mount(root);
const shell = root.appendChild(el('div', { class: 'bui-shell' }));
const sidebar = new Sidebar({ product: 'Conduict', groups: [{ heading: 'Project', items: [{ label: 'Machines', href: '#/machines', meta: '1 ready · 1 busy · 1 needs attention', current: true }, { label: 'Conversations', href: '#/conversations', meta: 3 }] }] }).mount(shell);
const main = shell.appendChild(el('main', { class: 'audit-page' }));
const model = new ChoiceChip({ label: 'Model', options, value: 'default', placement: 'above', onchange: value => log.push(`model:${value}`) });
main.append(el('div', { id: 'chip' }, [model.element]));
const effort = new ChoiceChip({ label: 'Effort', options: [{ value: 'low', label: 'Low' }, { value: 'high', label: 'High' }, { value: 'max', label: 'Max' }], value: 'low' });
const composer = new Composer({ label: 'Message', settings: [effort, new ChoiceChip({ label: 'Autonomy', options: [{ value: 'ask', label: 'Ask before acting' }, { value: 'auto', label: 'Act on its own' }], value: 'ask' })], attach: { onfiles: () => undefined }, commands: [{ value: '/model', label: 'Change the model', run: () => log.push('command:model') }, { value: '/review', label: 'Review the changes' }], onsubmit: () => Promise.resolve() }).mount(main);
const menu = new ActionMenu({ label: 'More', items: [{ label: 'Rename' }, { label: 'Duplicate' }, { label: 'Delete', tone: 'danger' }] });
main.append(el('div', { class: 'audit-scroller', id: 'scroller' }, [el('div', { class: 'audit-scroller-inner' }, [menu.element])]));
const statuses = el('div', { id: 'statuses' }, tones.map(state => new Status({ state }).element));
main.append(statuses);
const list = el('ul', { class: 'bui-rows', id: 'rows' }, machines.map(machine => new ListRow({ title: machine.name, href: `#/machines/${machine.id}`, meta: [machine.size, `${machine.conversations} conversations`], lead: { state: machine.state }, status: { state: machine.state }, facts: ['3 d'], actions: [{ label: 'Wake', run: () => log.push(`wake:${machine.id}`) }], menu: [{ label: 'Delete…', tone: 'danger' }] }).element));
main.append(list);
const table = new DataTable({ label: 'Machines', columns: [{ key: 'name', label: 'Name', sort: true }, { key: 'size', label: 'Size' }, { key: 'conversations', label: 'Conversations', align: 'end', sort: true }, { key: 'id', label: 'Identifier', mono: true }], rows: machines, onchange: state => log.push(`table:${JSON.stringify(state)}`) }).mount(main);
const hour = 3600000;
const recent = machines.map((machine, index) => ({ ...machine, at: Date.now() - [1, 30, 200][index % 3] * hour })).sort((a, b) => b.at - a.at);
const grouped = new Collection({ label: 'Recent machines', presentation: 'list', columns: [{ key: 'name', label: 'Name', primary: true }], source: Collection.local(recent), link: row => `#/machines/${row.id}`, row: row => ({ lead: { state: row.state }, meta: [row.size, '3 d'], menu: [{ label: 'Rename' }] }), group: new Recency().group(row => row.at), tools: 'external' }).mount(main);
grouped.element.id = 'grouped';
const tabs = new Tabs({ items: ['Overview', 'Conversations', 'Repositories', 'AI engines', 'Access', 'Runtime', 'Costs', 'Settings'].map((label, index) => ({ label, href: `#${index}`, current: index === 0 })) }).mount(main);
const card = new CommandCard({ title: 'Claude Code asks to run a command', command, scope: { label: 'Always allow commands like this' }, allow: () => log.push('allow'), deny: () => log.push('deny') }).mount(main);

window.fixture = {
	log,
	model,
	composer,
	effort,
	menu,
	card,
	destroy() {
		for (const component of [card, tabs, grouped, table, menu, composer, effort, model, sidebar, bar]) component.destroy();
	},
	ready: true
};
