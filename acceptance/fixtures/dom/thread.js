// The thread page of the plain DOM consumer (0.11.0), in English: the Sidebar with ages and a count; a
// Page at the thread tier whose header turns compact on scroll and whose panel has its own head, Facts
// and Meters and a wide form; the composer with its state line and action, settings chips, attachments
// and suggestions; since 0.11.1 its Options below 30rem (`?compact=off` keeps the 0.11.0 toolbar), a
// product's own glyph-only control with the family `Hint`, and an age said by `Age` beside the thread.
// window.fixture records what the page heard and drives it.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { FamilyBar, Sidebar, Page, PageHeader, Button, Composer, ChoiceChip, Facts, Meter, Hint, Age, icon, status, el } from '@beyond-js/ui';
import { chosen, fallback, product } from '../data/family.js';
import { shape, words, groups, rows, models, levels, suggest, paragraphs, minutes } from '../data/thread.js';

const copy = words.en;
const log = [];
const fixture = { log, ready: false };
window.fixture = fixture;
const root = document.getElementById('root');
const bar = new FamilyBar({ product, brand: { src: '../brand/wordmark.svg', href: '/projects/' }, descriptor: chosen(), fallback, account: { signout: () => {} } }).mount(root);
const shell = root.appendChild(el('div', { class: 'bui-shell' }));
const sidebar = new Sidebar({ product: copy.product, context: { label: copy.project, name: 'Storefront' }, groups: groups(copy), action: { label: copy.action, href: '#/new' } }).mount(shell);
const main = shell.appendChild(el('main', { id: 'main' }));

/** The product's side of attachments: each file uploads in two steps; a name with "big" fails. */
let items = [];
const attach = list => {
	items = list;
	composer.attachments = items;
};
const upload = item => {
	attach([...items.filter(other => other.key !== item.key), { ...item, state: 'uploading', progress: 0.3 }]);
	setTimeout(() => attach(items.map(other => (other.key === item.key ? { ...other, progress: 0.7 } : other))), 60);
	setTimeout(() => attach(items.map(other => (other.key === item.key ? (/big/.test(other.name) ? { ...other, state: 'failed', reason: 'Larger than 10 MB' } : { ...other, state: 'ready', progress: null }) : other))), 140);
};
let count = 0;
const model = new ChoiceChip({ label: copy.model, options: models, value: 'opus', onchange: value => log.push(`model:${value}`) });
const autonomy = new ChoiceChip({ label: copy.autonomy, options: levels(copy), value: 'ask', onchange: value => log.push(`autonomy:${value}`) });
const composer = new Composer({
	label: copy.message,
	placeholder: copy.placeholder,
	status: { text: copy.stopped, action: { label: copy.start, run: () => log.push('start') } },
	settings: [model, autonomy],
	attach: {
		accept: 'image/*,text/plain',
		onfiles: (files, via) => {
			log.push(`files:${via}:${files.map(file => file.name).join(',')}`);
			for (const file of files) upload({ key: `f${(count += 1)}`, name: file.name, size: file.size, type: file.type, file });
		},
		onremove: item => (log.push(`remove:${item.name}`), attach(items.filter(other => other.key !== item.key))),
		onretry: item => (log.push(`retry:${item.name}`), upload({ ...item, name: item.name.replace('big', 'small') }))
	},
	onsuggest: suggest,
	suggest: { bound: 1500 },
	compact: shape.compact,
	onsubmit: message => (log.push(`send:${message.text}:${(message.attachments ?? []).length}`), attach([]), Promise.resolve())
});

const copier = new Button({ label: copy.copy, variant: 'quiet' });
const changes = new Facts({ head: { title: copy.changes, value: copy.summary, state: [copy.pushed, 'warning'] }, rows: rows(copy, copier) });
const engine = new Facts({ head: { title: copy.engine, value: 'Claude Code · Max plan' }, rows: [{ key: 'model', label: copy.model, value: 'claude-opus-5-5', mono: true }] });
const window5 = new Meter({ label: copy.window, value: 0.86, reset: Date.now() + 3 * 3_600_000 });
const week = new Meter({ label: copy.week, value: 0.4, stale: Date.now() - 26 * 3_600_000 });
const copied = new Button({ label: copy.copy, variant: 'quiet' });
const narrow = el('div', { class: 'narrow', id: 'narrow' }, [new Facts({ label: copy.changes, rows: rows(copy, copied).slice(0, 2) }).element]);
const said = new Age({ locale: 'en' }).of(Date.now() - minutes[1] * 60_000);
const own = el('div', { class: 'own', id: 'own' }, [el('button', { type: 'button', class: 'bui-icon-button', 'aria-label': copy.more, 'data-bui-hint': true }, [icon('more')]), el('time', { id: 'age', datetime: said.datetime, text: said.label })]);
const hint = new Hint(own);
const details = new Button({ label: copy.details, variant: 'quiet' });
const review = new Button({ label: copy.review, variant: 'quiet', onclick: () => (page.panel.wide = !page.panel.wide) });
const pull = new Button({ label: copy.pull, variant: 'primary' });
const header = new PageHeader({ title: copy.title, status: status(copy.status, 'progress'), facts: copy.facts, actions: [review, details], compact: { actions: [pull] } });
const thread = el('div', { class: 'thread', id: 'thread' }, [own, el('p', { class: 'message', text: 'Also add a test for a failed payment that keeps the cart.' }), ...paragraphs.map(text => el('p', { class: 'answer', text })), narrow]);
const page = new Page({ template: 'detail', width: 'thread', header, children: [thread, el('div', { class: 'dock' }, [composer.element])], aside: [changes.element, engine.element, window5.element, week.element], label: copy.panel, panel: { cut: '73rem', title: copy.details, head: true, wide: shape.wide, onchange: shown => log.push(`panel:${shown}`) } }).mount(main);
page.panel.control(details.element);

Object.assign(fixture, {
	composer,
	page,
	header,
	/** Sets the chips as the product would. */
	attach,
	get items() {
		return items;
	},
	destroy() {
		for (const component of [page, header, composer, model, autonomy, changes, engine, window5, week, copier, copied, hint, details, review, pull, sidebar, bar]) component.destroy();
	},
	ready: true
});
