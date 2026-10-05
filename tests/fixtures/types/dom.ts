// A plain DOM consumer in TypeScript: compiled, never run, to check the `dom` and `tokens` declarations.
import { productNames, type FamilyProductId, Select, type NameTip, Clock, Steps, Awaited, Freshness, TechnicalDetails, Tooltip, type Step, type AwaitedState, Dialog, Picker, ChoiceMenu, NotificationEntry, Header, Collection, confirm, FamilyBar, ProductNav, Sidebar, Unavailable, Button, badge, availability, icon, icons, unlabeled, Preferences, type Appearance, type NotificationAdapter, type NoticeSummary, type NoticePage, type FamilyDescriptor, type FamilyNotice } from '@beyond-js/ui';
import { tokens, TokenSheet } from '@beyond-js/ui/tokens';

declare const adapter: NotificationAdapter;
const entry = new NotificationEntry({ adapter, href: '/notifications', products: { cdn: 'CDN' } });
const bounded: NoticeSummary = { unread: 99, more: true, sources: [{ product: 'cdn', state: 'unavailable' }, { product: 'delegate', state: 'available' }] };
const legacy: NoticeSummary = { unread: 3, available: true, unavailable: ['cdn'] };
const page: NoticePage = { items: [], next: null, sources: [{ product: 'cdn', state: 'unavailable' }] };
const partial: boolean = entry.more && entry.missing.includes('cdn') && Boolean(bounded && legacy && page);
entry.close(true);
const header = new Header({ brand: { label: 'Beyond', href: '/' }, notifications: entry.element }).mount(document.body);
header.expanded = true;
const dialog = new Dialog({ title: 'Rename', escape: false });
dialog.busy = true;
const picker = new Picker({ label: 'People', source: async () => ({ items: [], next: null }) });
picker.mark('p1', { state: 'stale', reason: 'Moved' });
const list = new Collection<{ id: string }>({ label: 'Rows', columns: [{ key: 'id', label: 'Id' }], source: Collection.local([{ id: 'a' }]) });
list.state = { query: '', filters: {}, page: 1 };
const sheet: string = new TokenSheet(tokens).css;
void confirm({ title: 'Leave?' }).then((answer: boolean) => answer && partial && sheet);
const descriptor: FamilyDescriptor = { person: { name: 'Ana' }, organization: { id: 'org_1', name: 'Northwind' }, products: [{ product: 'cdn', available: false, reason: 'UNCONFIGURED' }], links: { home: '/' } };
const family = new FamilyBar({ product: 'delegate', brand: { src: '/wordmark.svg', href: '/' }, descriptor: null, fallback: { organization: 'Northwind', links: { account: '/account', docs: '/docs/' } }, notifications: entry.element, account: { signout: { href: '/signout' }, items: [{ label: 'Settings', href: '/settings' }] }, onnavigate: item => item.url, labels: { NOT_ADMITTED: 'Aún no está abierto para ti' } }).mount(document.body);
family.descriptor = descriptor;
family.descriptor = { unavailable: true };
const state: 'loading' | 'unavailable' | 'ready' = family.state;
const annotated: FamilyDescriptor = { organization: { id: 'org_1', name: 'Northwind' }, organizations: [{ id: 'org_1', name: 'Northwind', role: 'owner', url: '/?organization=org_1' }], projects: [{ id: 'p', name: 'Shop', here: { mapped: 0, url: '/?project=p', state: 'unset' } }], links: { manage: { account: '/account', members: '/m' } } };
family.descriptor = annotated;
const notice: FamilyNotice = { text: 'Beyond Projects did not answer.', action: { label: 'Try again', run: () => undefined } };
family.notice = notice;
family.fallback = { organizations: [{ id: 'org_1', name: 'Northwind', current: true }], links: { projects: '/projects', manage: { create: '/create' } } };
new FamilyBar({ product: 'cdn', brand: { src: '/w.svg', href: '/' }, notice: null, transient: ['dialog'] }).destroy();
const sidebar = new Sidebar({ product: 'Delegate', groups: [{ heading: 'Project', items: [{ label: 'Requests', href: '/r', current: true, meta: 3 }, null] }], context: { label: 'Project', name: 'Shop' }, cut: 850, onnavigate: item => item.url }).mount(document.body);
const mode: 'permanent' | 'drawer' = sidebar.mode;
sidebar.groups = [];
sidebar.section = null;
NotificationEntry.delay = 250;
new ProductNav({ items: [{ label: 'Requests', href: '/requests', current: true }], sticky: true }).mount(document.body);
new Unavailable({ title: 'Not open to you yet', reason: 'By invitation.', owner: 'An owner', action: new Button({ label: 'Ask' }).element, kind: 'access', code: 'NOT_ADMITTED', level: 3 }).mount(document.body);
const tags = availability.map(entry => badge(entry.label, entry.tone));
void confirm({ title: 'Delete Storefront?', accept: 'Delete project', consequence: { lost: ['Entries'], kept: 'Records', recovery: 'None' } }).then(answer => answer && state && tags.length);
// The icon catalog and Preferences (0.3.0).
const glyphs: SVGSVGElement[] = [icon('close', { size: 16, label: 'Close' }), icon('pin'), ...icons.map(name => icon(name, { size: 24 }))];
const bare: readonly string[] = unlabeled;
const preferences = new Preferences({ key: 'beyond-projects', fallback: { appearance: 'light', locale: 'en' }, storage: null });
preferences.restore();
preferences.apply({ appearance: null, locale: 'es' });
const release: () => void = preferences.subscribe(values => values.appearance === 'dark' && glyphs.length && bare.length);
const appearance: Appearance = preferences.choose({ appearance: 'system' }).appearance;
void [release, appearance, preferences.labels.everywhere, Preferences.labels.es.everywhere];
const engine = new ChoiceMenu({ label: 'AI engine', placeholder: 'Choose', options: [{ value: 'claude', label: 'Claude Code', detail: 'Signed in', status: ['Ready', 'success'] }, false], actions: [{ label: 'Connect another…', run: () => undefined }], onchange: (value: string) => value }).mount(document.body);
engine.value = 'claude';
const chosen: string | null = engine.chosen?.value ?? null;
engine.disabled = !chosen;
// The family's product names (0.4.1): every family id is a string, they pass as a component's `products`, and none is writable.
const delegate: string = productNames.delegate;
const ids: FamilyProductId[] = ['conduict', 'desktop'];
const named: string = productNames['notice-product'] ?? 'notice-product';
const products: Record<string, string> = productNames;
new NotificationEntry({ adapter, products: productNames }).destroy();
// @ts-expect-error the names are read-only
productNames.cdn = 'Content';
// @ts-expect-error not a family product id
const odd: FamilyProductId = 'mail';
void [delegate, ids, named, odd, products];
// Long operations (0.5.0): one clock per page, timed steps, the awaited card, freshness and technical details.
const beat = new Clock({ now: () => Date.now() });
const timed: Step[] = [{ id: 'machine', label: 'Machine', state: 'done', since: 0, until: 84_000 }, { label: 'Startup', state: 'stalled', reason: { text: 'Blocked', details: { text: 'i/o timeout', request: 'req_1', time: new Date() } } }];
const timeline = new Steps({ label: 'Preparing', steps: timed, clock: beat, labels: Steps.labels.es }).mount(document.body);
timeline.steps = [...timed, { label: 'Sign-in', state: 'waiting', expected: { median: 60_000, p90: 120_000 } }];
const card = new Awaited({ title: 'Starting', since: '2026-10-03T19:47:00Z', expected: { median: 120_000 }, steps: timed, check: async () => undefined, onend: outcome => outcome === 'done', clock: beat });
card.update({ reason: { text: 'Cannot reach it', action: { label: 'Open', run: () => undefined } } });
card.end('failed');
const waiting: AwaitedState = card.state;
const fresh = new Freshness({ label: 'Running', tone: 'success', checked: Date.now(), clock: Clock.system });
fresh.update({ connected: false });
const facts = new TechnicalDetails({ text: 'refused', request: 'req_2', time: Date.now(), labels: TechnicalDetails.labels.es });
void facts.copy().then((copied: boolean) => copied && facts.report);
// @ts-expect-error not a step state
const odd2: Step = { label: 'x', state: 'running' };
void [timeline, waiting, fresh, odd2];
// Signing out of Beyond (0.5.0): the product ends its session; `before` may cancel; the earlier forms still type.
const signed = new FamilyBar({ product: 'cdn', brand: { src: '/w.svg', href: '/' }, account: { signout: { end: async () => undefined, before: () => confirm({ title: 'Leave unsaved work?' }), after: () => undefined, bound: 5000 } } });
const leaveAt: FamilyDescriptor['links'] = { leave: 'https://accounts.example.test/leave' };
const tip = new Tooltip(document.body, { text: 'Northwind Creative Studio', describe: false, when: () => true });
void [signed, leaveAt, tip];
// A select's cut-name tooltip (0.5.0, D44), for a product that draws its own select markup.
const chooser = document.createElement('select');
const whole: NameTip = Select.tip(chooser);
const shownTip: Tooltip | null = whole.tooltip;
whole.destroy();
// @ts-expect-error a select element, not any element
Select.tip(document.body);
void shownTip;

// The family page system (0.6.0, D52, D54).
import { Page, PageHeader, Tabs, Section, Arrival, PreferencesDialog, status } from '@beyond-js/ui';
const heading = new PageHeader({ title: 'web', crumbs: [{ label: 'Environments', href: '/environments' }], status: status('Ready', 'success'), facts: ['Compute Engine'], tabs: new Tabs({ items: [{ label: 'Overview', href: '#o', current: true }] }) });
const region = new Page({ template: 'detail', width: 'standard', header: heading, arrival: new Arrival({ product: 'Conduict', href: '/back', ondismiss: () => {} }), children: [new Section({ title: 'Repositories' }).element] });
region.aside = [document.createElement('p')];
region.width = 'form';
heading.focus();
const settings = new Preferences({ key: 'beyond-types', fallback: { appearance: 'system', locale: 'en' } });
const asked = new PreferencesDialog({ preferences: settings, everywhere: () => '/account' });
void asked.open({ restore: () => document.body });
const shown: boolean = asked.shown;
asked.leave();
void shown;
void new FamilyBar({ product: 'delegate', brand: { src: '/brand.svg', href: '/' }, account: { preferences: { preferences: settings, everywhere: '/account' } } });

// "Choose, never type" (0.7.0, D56).
import { RefChooser, ProjectPicker, SecretField, Draft, SideSheet, ProviderWindow, StatusRow, CopyMessage, ListDetail, Field } from '@beyond-js/ui';
import type { PickerItem, PickerFound, ProviderState } from '@beyond-js/ui';
const rows: PickerItem[] = [{ id: '1', label: 'acme/web', visibility: 'private', meta: 'main', updated: Date.now(), state: ['Ready', 'success'], marks: [{ label: 'In Website', reason: 'Also in Website' }], avatar: '/a.png' }];
const resource = new Picker({
	label: 'Repositories',
	source: async ({ account, query }) => ({ items: rows.filter(() => account !== null && query !== undefined), suggested: { label: 'Recent', items: rows } }),
	accounts: { items: [{ id: 'con_1', label: 'acme', detail: 'GitHub organization' }], connect: { label: 'Install on another GitHub organization', run: () => {} } },
	footer: [document.createElement('button')],
	recognize: text => ({ label: text, match: item => item.label === text, value: { owner: 'acme', name: 'web' } }),
	onrecognize: (found: PickerFound | null) => void found?.outcome,
	bound: 5000
});
resource.gate = { title: 'Connect GitHub', reason: 'Nothing is connected yet.', action: document.createElement('button') };
resource.gate = null;
const viewing: string | null = resource.account;
const refs = new RefChooser({ refs: [{ name: 'main', default: true }], value: 'main', escape: true, validate: value => (value === 'HEAD' ? 'Choose a branch' : null), onchange: value => void value });
refs.unavailable = { retry: () => {} };
refs.loading = true;
const projects = new ProjectPicker({ product: 'Delegate', projects: [{ id: 'prj_1', name: 'Storefront', here: { state: 'unset' } }], only: 'unset', onchange: id => void id });
const secret = new SecretField({ label: 'Supabase access', connect: { label: 'Connect Supabase', run: () => {} }, credential: 'access token', stored: true, name: 'token' });
const pasted: string | null = secret.value;
const draft = Draft.read('https://conduict.example.test/#/acme/web?environment=env_1&from=conduict');
const next: string = new Draft({ ...draft.values, agent: 'claude' }).address('/new');
const panel = new SideSheet({ title: 'Add repositories', width: 'form' });
panel.busy = true;
panel.error(null);
void panel.open({ restore: document.body });
const provider = new ProviderWindow({ provider: 'GitHub', href: '/start', origin: 'https://projects.example.test', read: async () => ({ state: 'done' }), onend: outcome => void outcome });
const where: ProviderState = provider.state;
const row = new StatusRow({ title: 'acme', kind: 'GitHub organization', state: { label: 'Active', tone: 'success', checked: Date.now() }, owner: 'Owners of acme', more: [{ label: 'Disconnect', run: () => {} }] });
row.update({ reason: 'Suspended on GitHub' });
const message = new CopyMessage({ text: 'git clone …', kind: 'command' });
void message.copy();
const split = new ListDetail({ list: document.createElement('div'), back: { label: 'Repositories', href: '?view=repositories' } });
split.detail = null;
const menu = new ChoiceMenu({ label: 'Branch', options: [{ value: 'main', label: 'main', search: 'main' }], search: 8, statement: false, name: 'branch', labels: ChoiceMenu.labels.es });
const slug = new Field({ label: 'Slug', suggest: 'storefront' });
slug.suggest = 'storefront-2';
const columns = new Collection({ label: 'Repositories', columns: [{ key: 'name', label: 'Name', primary: true }, { key: 'branch', label: 'Branch', priority: 2 }], source: Collection.local([]), labels: Collection.labels.es });
// @ts-expect-error a side sheet is form or standard wide
void new SideSheet({ title: 'x', width: 'reading' });
void [viewing, projects, pasted, next, where, menu, slug.edited, columns, refs];
// 0.7.1: statements keep the hint and state; Spanish for the questions, Dialog, Unavailable and Toaster; AwaitedLine.
import { AwaitedLine, Question, Toaster as Toasts, alert as tell, prompt as ask, Choices as Group } from '@beyond-js/ui';
const lone = new Group({ legend: 'AI engine', type: 'radio', options: [{ value: 'claude', label: 'Claude Code', hint: 'Connected', status: ['Ready', 'success'] }] });
void new Select({ options: [{ value: 'a', label: 'A', hint: 'Only one', status: ['Ready', 'success'] }] });
void confirm({ title: '¿Borrar?', labels: confirm.labels.es });
void [Question.labels.es, ask.labels.en, tell.labels.es, Dialog.labels.es, Unavailable.labels.es, Toasts.labels.es, lone];
const cloning = new AwaitedLine({ title: 'Cloning', since: Date.now(), expected: { median: 60_000, p90: 120_000 }, check: async () => undefined, labels: AwaitedLine.labels.es });
cloning.update({ reason: 'GitHub didn’t answer' });
const said: string = cloning.text;
void said;
