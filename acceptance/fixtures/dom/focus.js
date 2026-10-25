// The focus page of the plain DOM consumer (0.34.0, D187), in English: the forms focus takes and where what has it
// lands. `?page=forms` (the default): a link and two buttons, a field, a field with a wrong value, a select, a
// list of rows with their arrow keys, an approval card, a side sheet a button opens and a heading a button focuses
// for reading. `?page=thread`: a conversation whose turns hold links, its composer docked. window.fixture records
// what the page heard.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { Button, Field, Select, ListRow, RowKeys, CommandCard, SideSheet, Page, PageHeader, Composer, ChoiceChip, el } from '@beyond-js/ui';

const log = [];
const fixture = { log, ready: false };
window.fixture = fixture;
const root = document.getElementById('root');
const shape = new URLSearchParams(location.search).get('page') ?? 'forms';

function forms() {
	const main = root.appendChild(el('main', { class: 'fixture-focus' }));
	const before = el('a', { id: 'before', href: '#before', text: 'Before the controls' });
	const open = new Button({ label: 'Open files', variant: 'secondary' });
	const create = new Button({ label: 'Create pull request', variant: 'primary' });
	const name = new Field({ label: 'Repository name', value: 'storefront' });
	const branch = new Field({ label: 'Branch', value: 'main feature', error: 'Use letters, digits and dashes.' });
	const region = new Field({ label: 'Region', control: new Select({ options: [{ value: 'eu', label: 'Europe' }, { value: 'us', label: 'United States' }] }) });
	const rows = el('ul', { class: 'bui-rows', id: 'rows' }, ['Fix the checkout total', 'Review the pricing page', 'Upgrade the payment SDK'].map((title, index) => new ListRow({ title, href: `#row-${index}`, meta: ['storefront', '2 h ago'], tag: 'li' }).element));
	const keys = new RowKeys(rows);
	const card = new CommandCard({ title: 'Claude Code asks to run a command', command: 'npm test', ondecide: answer => log.push(`decide:${answer.value}`) });
	const sheet = new SideSheet({ title: 'Details', children: [el('p', { text: 'No changes yet.' })] });
	const details = new Button({ label: 'Show details', variant: 'secondary', onclick: () => sheet.open() });
	const heading = el('h2', { id: 'results', tabindex: '-1', text: 'Results' });
	const read = new Button({ label: 'Read the results', variant: 'quiet', onclick: () => heading.focus() });
	details.element.id = 'details';
	read.element.id = 'read';
	main.append(before, el('div', { class: 'fixture-row' }, [open.element, create.element]), name.element, branch.element, region.element, rows, card.element, el('div', { class: 'fixture-row' }, [details.element, read.element]), heading, el('p', { text: 'Three rows match.' }));
	Object.assign(fixture, { card, sheet, keys });
}

function thread() {
	const model = new ChoiceChip({ label: 'Model', options: [{ value: 'opus', label: 'Opus 5.5 · Extra high' }], value: 'opus' });
	const composer = new Composer({ label: 'Message', placeholder: 'Message Claude Code', settings: [model], onsubmit: message => (log.push(`send:${message.text}`), Promise.resolve()) });
	const turns = el(
		'div',
		{ class: 'fixture-thread', id: 'thread' },
		Array.from({ length: 30 }, (_, index) => el('p', {}, [`Turn ${index + 1} changed the checkout's total and its tests; `, el('a', { href: `#turn-${index + 1}`, class: 'fixture-link', text: `see turn ${index + 1}` }), '.']))
	);
	const page = new Page({ template: 'thread', header: new PageHeader({ title: 'Fix the checkout total' }), children: [turns], dock: composer }).mount(root);
	Object.assign(fixture, { composer, page });
}

if (shape === 'thread') thread();
else forms();
fixture.ready = true;
