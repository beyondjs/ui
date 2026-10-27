// The 0.44.0 page of the plain DOM consumer (LOAD-01, D185): a snapshot's page drawn before its reads answer.
// The arrival line holds its place until its way back is known, the header's title waits and its Restore is
// reserved, the facts line holds a ChoiceMenu, the Devices section's list waits beside its action, History
// waits whole and the sidebar's projects wait. window.fixture.answer() answers every read at once, and
// window.fixture.focus() asks for the title's focus as a router does; `?refused=1` refuses Restore.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { Sidebar, Page, PageHeader, Tabs, Section, Arrival, Button, ChoiceMenu, reserved, el } from '@beyond-js/ui';
import { words, earlier, projects, refused } from '../data/pending.js';

const copy = words.en;
const root = document.getElementById('root');
const shell = root.appendChild(el('div', { class: 'bui-shell' }));
const objects = state => [{ items: [{ label: copy.home, href: '#/', current: true }] }, { kind: 'object', key: 'projects', heading: copy.projects, action: { label: copy.create, href: '#/new' }, ...state }];
const sidebar = new Sidebar({ product: 'Beyond Home', groups: objects({ waiting: true }) }).mount(shell);
const main = shell.appendChild(el('main', { id: 'main' }));
const log = [];
const restore = new Button({ label: copy.restore, variant: 'primary', onclick: () => log.push('restore') });
const compare = new ChoiceMenu({ label: copy.facts, options: earlier, value: earlier[0].value });
const tabs = new Tabs({ items: [copy.overview, copy.files].map((label, index) => ({ label, href: `#${index}`, current: index === 0 })) });
const header = new PageHeader({ title: null, waiting: true, crumbs: [{ label: copy.snapshots, href: '#/snapshots' }], facts: [`${copy.facts} `, compare.element], actions: [reserved(restore)], tabs });
const arrival = new Arrival({ product: copy.from, href: null });
const devices = new Section({ title: copy.devices });
const list = devices.part({ waiting: { rows: 2 } });
devices.children = [el('div', {}, [new Button({ label: copy.away }).element]), list.element];
const history = new Section({ title: copy.history, waiting: { rows: 2 } });
new Page({ template: 'detail', width: 'standard', arrival, header, children: [devices.element, history.element] }).mount(main);

window.fixture = {
	log,
	/** A navigation's focus on the page's title, as a product's router asks for it */
	focus() {
		header.heading.focus({ preventScroll: true });
	},
	/** Every read answers at once */
	answer() {
		arrival.href = '#/projects/p0';
		header.title = copy.title;
		header.actions = refused ? [] : [restore];
		list.children = [el('ul', { class: 'bui-rows' }, [el('li', { text: copy.device })])];
		history.children = [el('p', { text: copy.change })];
		sidebar.groups = objects({ groups: [{ kind: 'entries', key: 'all', items: projects }] });
	},
	ready: true
};
