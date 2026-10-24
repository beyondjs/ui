// The turns page of the plain DOM consumer (0.29.0, D180 to D184): a centred thread of twelve turns, each the
// person's message as a card across the turn and its answer, beside the shared Sidebar under the family
// bar; the index of its turns in the thread's gutter; the header's compact line saying the message of the
// turn being read; and the composer on its lane in the dock. Each turn's address is its fragment
// (`#turn=t3`), so a mark and the keys go where the browser takes them. `?turns=1` draws one turn.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { FamilyBar, Sidebar, Page, PageHeader, Composer, TurnIndex, status, el } from '@beyond-js/ui';
import { chosen, fallback, product } from '../data/family.js';
import { copy, turns } from '../data/turns.js';

const words = copy('en');
const log = [];
const fixture = { log, ready: false };
window.fixture = fixture;
const root = document.getElementById('root');
const bar = new FamilyBar({ product, brand: { src: '../brand/wordmark.svg', href: '/projects/' }, descriptor: chosen(), fallback, account: { signout: () => {} } }).mount(root);
const shell = root.appendChild(el('div', { class: 'bui-shell' }));
const sidebar = new Sidebar({ product: 'Conduict', context: { label: 'Project', name: 'Storefront' }, groups: [{ items: [{ key: 'home', label: 'Home', href: '#home', glyph: 'home' }] }] }).mount(shell);
const main = shell.appendChild(el('main', { id: 'main' }));

const count = Number(new URLSearchParams(location.search).get('turns')) || Infinity;
const list = turns('en').slice(0, count);
const drawn = list.map(turn => {
	const head = el('div', { class: 'fixture-message' }, [turn.message]);
	const element = el('li', { class: 'fixture-turn', id: `turn=${turn.key}` }, [head, el('div', { class: 'fixture-answer' }, turn.answer.split('. ').map(sentence => el('p', { text: sentence })))]);
	return { ...turn, title: turn.message, element, head };
});
const thread = el('ol', { class: 'fixture-turns', 'aria-label': words.turns }, drawn.map(turn => turn.element));
const header = new PageHeader({ title: words.title, status: status('Working', 'progress'), compact: true });
const index = new TurnIndex({ onview: ({ key, covered }) => {
	log.push(`view:${key}:${covered}`);
	const turn = drawn.find(each => each.key === key);
	header.subject = covered && turn ? { text: turn.message, href: turn.href } : null;
} });
const composer = new Composer({ label: words.label, placeholder: words.placeholder, add: [{ label: 'Mention a file', run: () => log.push('mention') }], onsubmit: message => (log.push(`send:${message.text}`), Promise.resolve()) });
const page = new Page({ template: 'thread', lane: 'center', header, children: [index.element, thread], dock: composer }).mount(main);
index.update({ turns: drawn });

Object.assign(fixture, {
	index,
	header,
	composer,
	page,
	destroy() {
		for (const component of [page, header, index, composer, sidebar, bar]) component.destroy();
	},
	ready: true
});
