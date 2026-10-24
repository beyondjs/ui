// The round page of the plain DOM consumer (0.14.0): the Sidebar's objects with their action, search icon,
// folding groups and ⌘K; a thread page with its anchored dock (D94), its turns and the composer's lane (D180), a panel that moves
// (D95), Facts' column (D99) and a quiet action line (D102); the composer's tray, commands, recall, cap with
// Expand and Dictate (D100). window.fixture records what the page heard and drives it.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { FamilyBar, Sidebar, Page, PageHeader, Button, Composer, ChoiceChip, Facts, ActionLine, Highlighter, ActivityRow, Rail, RailItem, CopyButton, el } from '@beyond-js/ui';
import { chosen, fallback, product } from '../data/family.js';
import { shape, groups, turns, commands, transcribe } from '../data/round.js';

const log = [];
const fixture = { log, ready: false };
window.fixture = fixture;
const root = document.getElementById('root');
const bar = new FamilyBar({ product, brand: { src: '../brand/wordmark.svg', href: '/projects/' }, descriptor: chosen(), fallback, account: { signout: () => {} } }).mount(root);
const shell = root.appendChild(el('div', { class: 'bui-shell' }));
const sidebar = new Sidebar({ product: 'Conduict', context: { label: 'Project', name: 'Storefront' }, groups: groups(), shortcut: shape.shortcut, onnavigate: item => log.push(`navigate:${item.href}`) }).mount(shell);
const main = shell.appendChild(el('main', { id: 'main' }));

const highlighter = new Highlighter('javascript');
const block = turn => {
	if (turn.kind === 'message') return el('p', { class: 'message', text: turn.text });
	if (turn.kind === 'prose') return el('p', { class: 'answer', text: turn.text });
	return highlighter.fill(el('pre', { class: 'code bui-lane-wide' }), turn.text);
};
const copier = new CopyButton({ text: 'answer', variant: 'quiet' });
const details = new Button({ label: 'Details', variant: 'quiet' });
const answer = new ActionLine({ actions: [copier, new Button({ label: 'Copy link', variant: 'quiet' })], facts: ['42 s', '12k tokens', '$0.08'], label: 'Answer actions' });
const step = new ActivityRow({ glyph: 'terminal', title: 'Ran npm test', meta: 'exit 0', body: () => [{ label: 'Output', text: 'ok 1\nok 2', language: 'shell' }] });
const rail = new Rail({ children: [step, new RailItem({ glyph: 'check', tone: 'success', content: 'Worked for 42 s' })] });
const items = turns();
const thread = el('div', { class: 'thread', id: 'thread' }, [...items.map(block), items.length ? rail.element : null, items.length ? answer.element : null, items.length ? el('details', { id: 'more' }, [el('summary', { class: 'bui-summary', text: 'More details' }), el('p', { text: 'Started 10:42 · ended 10:43' })]) : null]);

const model = new ChoiceChip({ label: 'Model', options: [{ value: 'opus', label: 'Opus 5.5' }, { value: 'sonnet', label: 'Sonnet 5' }], value: 'opus' });
const tray = [new Button({ label: 'web · Ready', variant: 'secondary' }), new Button({ label: 'Claude Code', variant: 'secondary' })];
const composer = new Composer({
	label: 'Message to Claude Code',
	placeholder: 'Message Claude Code…',
	settings: [model],
	tray,
	commands: commands(log),
	recall: () => 'Also add a test',
	dictation: { transcribe: transcribe(log), bound: 4000 },
	onsubmit: message => (log.push(`send:${message.text}`), Promise.resolve())
});
const facts = new Facts({ head: { title: 'Changes', value: '3 files · +52 −3' }, rows: [{ key: 'model', label: 'Model', value: 'Opus' }, { key: 'files', label: 'Files', value: 3 }, { key: 'cost', label: 'Cost', value: '$0.08', numeric: true }] });
const header = new PageHeader({ title: 'Fix the checkout redirect', status: null, actions: [details] });
const page = new Page({ template: 'thread', header, children: [thread], dock: composer, aside: [facts.element], label: 'Conversation details', panel: { cut: '73rem', title: 'Details', head: true, onchange: shown => log.push(`panel:${shown}`) } }).mount(main);
page.panel.control(details.element);

Object.assign(fixture, {
	composer,
	page,
	sidebar,
	/** A new item that needs the person arrives. */
	arrive() {
		sidebar.groups = groups({ added: true });
	},
	destroy() {
		for (const component of [page, header, composer, model, ...tray, facts, answer, copier, details, step, rail, sidebar, bar]) component.destroy();
	},
	ready: true
});
