// A plain DOM consumer in TypeScript: compiled, never run, to check the `dom` and `tokens` declarations.
import { productNames, type FamilyProductId, Dialog, Picker, ChoiceMenu, NotificationEntry, Header, Collection, confirm, FamilyBar, ProductNav, Sidebar, Unavailable, Button, badge, availability, icon, icons, unlabeled, Preferences, type Appearance, type NotificationAdapter, type NoticeSummary, type NoticePage, type FamilyDescriptor, type FamilyNotice } from '@beyond-js/ui';
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
