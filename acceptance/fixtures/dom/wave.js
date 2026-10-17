// The 0.16.0 page of the plain DOM consumer: the family bar merged with the sidebar on a phone, ⌘K's
// palette, choice cards, a composer whose Send names its missing step, an approval card with scoped
// decisions and a region with two primary actions. window.fixture records what the page heard.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { FamilyBar, Sidebar, CommandPalette, ChoiceCards, Composer, CommandCard, Section, Button, Primaries, el } from '@beyond-js/ui';
import { chosen, fallback, product } from '../data/family.js';
import { sizes, sources, decisions } from '../data/wave.js';

const log = [];
const root = document.getElementById('root');
const bar = new FamilyBar({ product, brand: { src: '../brand/wordmark.svg', href: '/projects/' }, descriptor: chosen(), fallback, account: { signout: () => {} } }).mount(root);
const shell = root.appendChild(el('div', { class: 'bui-shell' }));
const sidebar = new Sidebar({ product: 'Conduict', groups: [{ heading: null, items: [{ label: 'Machines', href: '#/machines', current: true }, { label: 'Conversations', href: '#/conversations' }] }] }).mount(shell);
sidebar.merge(bar);
const main = shell.appendChild(el('main', { class: 'wave-page', id: 'main' }));
const palette = new CommandPalette({ sources: sources(log), recent: { key: 'fixture' }, shortcut: true, delay: 0, onnavigate: item => log.push(`palette:${item.href}`) });
const cards = new ChoiceCards({ label: 'Size', options: sizes, value: 'small', onchange: value => log.push(`size:${value}`) }).mount(main);
const composer = new Composer({ label: 'Message', onsubmit: async message => log.push(`send:${message.text}`), step: { label: 'Choose a machine and send', run: async ({ text }) => (log.push(`step:${text}`), composer.step = null, true) } }).mount(main);
const card = new CommandCard({ title: 'Claude Code asks to run a command', command: 'rm -rf build', decisions, ondecide: answer => log.push(`decide:${answer.value}:${answer.note ?? ''}`) }).mount(main);
const twice = new Section({ title: 'Two primaries', children: [new Button({ label: 'One', variant: 'primary' }).element, new Button({ label: 'Two', variant: 'primary' }).element] }).mount(main);

// A development build (the fixture defines NODE_ENV) checks its regions, as a Page does by itself
const primaries = Primaries.enabled ? new Primaries({ root: main }) : null;

window.fixture = {
	log,
	palette,
	destroy() {
		primaries?.destroy();
		for (const component of [twice, card, composer, cards, palette, sidebar, bar]) component.destroy();
	},
	ready: true
};
