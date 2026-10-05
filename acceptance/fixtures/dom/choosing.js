// "Choose, never type" in the plain DOM consumer (0.7.0): the side sheet, the resource picker, the ref
// chooser, the project picker, the secret field, a status row with a message to copy, a provider's
// window and a list-detail over a collection with column priorities. window.fixture exposes the log.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { SideSheet, Picker, RefChooser, ProjectPicker, SecretField, StatusRow, CopyMessage, ProviderWindow, ListDetail, Collection, Button, Choices, AwaitedLine, confirm, el } from '@beyond-js/ui';
import { shape, accounts, source, recognize, branches, projects, repositories, columns } from '../data/choosing.js';

const log = [];
const root = document.getElementById('root');
const section = id => root.appendChild(el('section', { id }));
const picker = () => new Picker({ label: 'Repositories', source: source(log), delay: 50, bound: 2000, accounts: { items: accounts, connect: { label: 'Install on another GitHub organization', run: () => log.push('connect') } }, footer: [el('button', { type: 'button', class: 'bui-link-button', text: 'Choose which repositories Beyond can see on GitHub', onclick: () => log.push('escape') })], recognize, onrecognize: found => found && log.push(`recognized:${found.label}:${found.outcome}`), onchange: items => log.push(`picked:${items.map(item => item.id).join(',')}`) });

const opener = new Button({ label: 'Add repositories', variant: 'primary', onclick: () => sheet.open() }).mount(section('sheeting'));
const work = new Button({ label: 'Add 1 repository', variant: 'primary', onclick: () => (sheet.busy = !sheet.busy) });
const inner = picker();
const sheet = new SideSheet({ title: 'Add repositories to Storefront', description: 'They’re added to Storefront in Beyond Projects, and Conduict clones them on My first VM.', children: [inner.element], actions: [work.element, new Button({ label: 'Cancel', onclick: () => sheet.close() }).element], onclose: value => log.push(`sheet:${value}`) });
inner.control.setAttribute('data-autofocus', '');
picker().mount(section('picking'));
new RefChooser({ label: 'Base branch', refs: branches, value: 'main', onchange: value => log.push(`ref:${value}`) }).mount(section('refs'));
new ProjectPicker({ product: 'Delegate', projects, onchange: id => log.push(`project:${id}`) }).mount(section('projects'));
new SecretField({ label: 'Supabase access', credential: 'access token', connect: { label: 'Connect Supabase', run: () => log.push('supabase') } }).mount(section('secret'));
const rows = section('rows');
new StatusRow({ title: 'acme', kind: 'GitHub organization', state: { label: 'Suspended', tone: 'warning', checked: Date.now() - 120_000 }, reason: 'The Beyond app is suspended on acme.', owner: 'Whoever suspended it on GitHub', action: new Button({ label: 'Unsuspend on GitHub' }), more: [{ label: 'Disconnect acme', run: () => log.push('disconnect') }] }).mount(rows);
new CopyMessage({ text: 'Could you approve the Beyond app for acme on GitHub? It lets Beyond read the repositories we choose for our projects.', label: 'Message for an owner of acme' }).mount(rows);
localStorage.removeItem('attempt');
new ProviderWindow({ provider: 'GitHub', href: '../provider.html', origin: location.origin, same: false, read: async () => ({ state: localStorage.getItem('attempt') === 'done' ? 'done' : 'none' }), onend: outcome => log.push(`provider:${outcome}`) }).mount(section('provider'));
// 0.7.5: a two-leg trip whose landing is on another origin (localhost beside 127.0.0.1), with no opener and a
// window that never closes itself; the page learns how it went only by reading the server
const trip = `trip-${Date.now()}`;
const landing = `${location.protocol}//localhost:${location.port}/fixtures/trip.html?id=${trip}&leg=1`;
new ProviderWindow({ provider: 'GitHub', href: landing, origin: null, same: false, interval: 500, read: async () => ({ state: await (await fetch(`/attempt?id=${trip}`)).text() }), onend: outcome => log.push(`trip:${outcome}`) }).mount(section('trip'));
const list = new Collection({ label: 'Repositories', columns, source: Collection.local(repositories), search: false, link: row => `?detail=1&repository=${row.id}` });
new ListDetail({ list, label: 'Repository', detail: shape.detail ? el('div', {}, [el('h2', { text: 'acme/web' }), el('p', { text: 'Ready · updated from GitHub when the last conversation started.' })]) : null, back: { label: 'Repositories', href: '?' } }).mount(section('listing'));
const following = section('following');
new Choices({ legend: 'AI engine', type: 'radio', name: 'engine', options: [{ value: 'claude', label: 'Claude Code', hint: 'Connected with the Max plan · its sign-in lasts until you disconnect it', status: ['Ready', 'success'] }] }).mount(following);
new AwaitedLine({ title: 'Cloning acme/web', since: Date.now() - 40_000, expected: { median: 60_000, p90: 120_000 } }).mount(following);
new Button({ label: 'Delete My first VM', variant: 'danger', onclick: () => confirm({ title: 'Delete My first VM?', accept: 'Delete environment', tone: 'danger', consequence: { affected: ['2 running conversations stop'], lost: 'The machine and its copies', costing: 'The disk snapshot, until you delete it', recovery: 'Deletion cannot be undone.' } }).then(answer => log.push(`confirm:${answer}`)) }).mount(section('consequence'));
if (shape.sheet) sheet.open();
window.fixture = { log, stall: false, sheet, opener: opener.element, ready: true };
