// A plain JavaScript DOM consumer of @beyond-js/ui, built from the installed package the way Branding
// consumes it. Components are created, mounted and destroyed; window.fixture exposes the sources the
// browser checks switch and a teardown that destroys everything.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import { Header, NotificationEntry, NotificationInbox, Button, ActionMenu, Dialog, confirm, prompt, Picker, Collection, Help, Tooltip, Field, FocusedForm, Toaster, status } from '@beyond-js/ui';
import { People, teams } from '../data/people.js';
import { rows, states } from '../data/rows.js';
import { Notices } from '../data/notices.js';
import { terms, clauses } from '../data/terms.js';

const params = new URLSearchParams(location.search);
const notices = new Notices(params.get('notices'));
const people = new People();
const mounted = [];
const log = [];
const keep = component => (mounted.push(component), component);
// A builder's element belongs to the page that placed it; the page removes it on teardown.
const builder = element => ({ element, destroy: () => element.remove() });
const section = id => document.getElementById(id);
const products = { delegate: 'Delegate', cdn: 'CDN', projects: 'Projects' };

const entry = keep(new NotificationEntry({ adapter: notices.adapter, href: '#/notifications', products, onopen: destination => (location.hash = destination.slice(1)), onview: () => (location.hash = '/notifications') }));
keep(new Header({
	brand: { label: 'Beyond', href: '#/' },
	context: [{ label: 'Northwind', href: '#/o/northwind' }, { label: 'Storefront', current: true }],
	nav: [{ label: 'Requests', href: '#/requests', current: true }, { label: 'Versions', href: '#/versions' }, { label: 'Settings', href: '#/settings' }],
	notifications: entry.element,
	account: keep(new ActionMenu({ label: 'AN', name: 'Account: Ana', glyph: null, items: [{ label: 'Your account', href: '#/account' }, { label: 'Sign out', run: () => log.push('signout') }] })).element
})).mount(section('header'));

const toaster = keep(new Toaster()).mount(document.body);
const row = el => (section('actions').append(el), el);
const plain = keep(new Dialog({ title: 'Rename area', description: 'Members see the new name.', backdrop: true, children: [keep(new Field({ label: 'Name', value: 'Billing' })).element] }));
plain.actions = [keep(new Button({ label: 'Close', onclick: () => plain.close('closed') })).element];
const paragraph = text => Object.assign(document.createElement('p'), { textContent: text });
const long = keep(new Dialog({ title: terms.en.title, children: clauses('en').map(paragraph) }));
long.actions = [keep(new Button({ label: terms.en.accept, variant: 'primary', onclick: () => long.close('accepted') })).element];
const actions = document.createElement('div');
actions.className = 'row';
row(actions).append(
	keep(new Button({ label: 'Open dialog', onclick: () => plain.open().then(value => log.push(`dialog:${value}`)) })).element,
	keep(new Button({ label: terms.en.open, onclick: () => long.open().then(value => log.push(`terms:${value}`)) })).element,
	keep(new Button({ label: 'Delete project', variant: 'danger', onclick: async () => log.push(`confirm:${await confirm({ title: 'Delete project?', message: 'This cannot be undone.', tone: 'danger', accept: 'Delete', work: () => fixture.work(), explain: error => `Not deleted: ${error.message}` })}`) })).element,
	keep(new Button({ label: 'Name area', onclick: async () => log.push(`prompt:${await prompt({ title: 'New area', label: 'Area name', messages: { valueMissing: 'Name the area.' } })}`) })).element,
	keep(new ActionMenu({ label: 'More', name: 'More actions', items: [{ label: 'Duplicate', run: () => log.push('menu:duplicate') }, { label: 'Archive', disabled: true, reason: 'Only owners archive' }, { label: 'Toast', run: () => toaster.show('Saved') }] })).element,
	keep(builder(status('Live', 'success'))).element
);

const picker = keep(new Picker({
	label: 'People in this batch',
	hint: 'Search by name; choices stay while you filter or load more.',
	source: people.source,
	name: 'people',
	selected: [{ id: 'gone', label: 'Former member', state: 'stale', reason: 'Left the organization' }],
	filters: [{ name: 'team', label: 'Team', options: teams }],
	onchange: items => log.push(`picked:${items.length}`)
})).mount(section('picking'));

keep(new Collection({
	label: 'Requests',
	columns: [{ key: 'title', label: 'Request', primary: true }, { key: 'state', label: 'State' }, { key: 'votes', label: 'Support', numeric: true }],
	source: async request => (await new Promise(resolve => setTimeout(resolve, 40)), Collection.local(rows, (item, query, filters) => item.title.toLowerCase().includes(query.toLowerCase()) && (!filters.state || item.state === filters.state))(request)),
	link: item => `#/requests/${item.id}`,
	filters: [{ name: 'state', label: 'State', options: states }],
	limit: 5,
	onstate: state => log.push(`state:${JSON.stringify(state)}`)
})).mount(section('listing'));

const label = document.createElement('p');
label.className = 'row';
label.append('Project identifier ', Object.assign(document.createElement('code'), { textContent: 'prj_8f2a' }));
section('helping').append(label);
keep(new Help({ topic: 'Project identifier', text: ['The identifier never changes, even when the project is renamed.', 'Support asks for it.'] })).mount(label);
const copy = keep(new Button({ label: 'Copy address', small: true })).mount(section('helping'));
keep(new Tooltip(copy.element, { text: 'Copies the preview address to the clipboard' }));

const form = document.createElement('form');
const name = keep(new Field({ label: 'Request title', name: 'title', required: true, messages: { valueMissing: 'Give the request a title.' } }));
form.append(name.element, keep(new Button({ label: 'Submit request', variant: 'primary', type: 'submit' })).element);
section('form').append(form);
keep(new FocusedForm(form, { fields: [name], labels: { busy: 'Submitting…' }, submit: values => (log.push(`submit:${values.title}`), new Promise(resolve => setTimeout(resolve, 400))), onsuccess: () => toaster.show('Request submitted') }));

keep(new NotificationInbox({ adapter: notices.adapter, products, limit: 10, onopen: destination => (location.hash = destination.slice(1)), onstate: state => log.push(`inbox:${JSON.stringify(state)}`) })).mount(section('inbox'));

let attempts = 0;
const fixture = {
	notices,
	people,
	log,
	picker,
	entry,
	/** The confirmation's operation: fails once, then succeeds; each run takes 600 ms. */
	work: () => new Promise((resolve, reject) => setTimeout(() => (++attempts === 1 ? reject(new Error('locked')) : resolve()), 600)),
	/** Destroys every component this page created. */
	destroy() {
		for (const component of mounted.reverse()) component.destroy();
		mounted.length = 0;
	},
	ready: true
};
window.fixture = fixture;
