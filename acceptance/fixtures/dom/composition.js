import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { Page, PageHeader, Collection, ListRow, OrganizationMark, Button, callout, badge, el } from '@beyond-js/ui';
import { organizations, detail, body } from '../data/composition.js';

const rows = organizations.map(item => new ListRow({ title: item.name, href: `#${item.id}`, inline: true, lead: new OrganizationMark({ name: item.name }).element, meta: badge(item.role), menu: [{ label: 'Settings', run: () => { window.fixture.menu++; } }] }));
const list = el('ul', { class: 'bui-rows', 'data-framed': '', id: 'objects' }, rows.map(row => row.element));
const stacked = el('ul', { class: 'bui-rows', 'data-framed': '', id: 'stacked' }, [new ListRow({ title: 'Archive studio', href: '#archive', lead: new OrganizationMark({ name: 'Archive studio' }).element, meta: 'Read only history' }).element]);
const wrapped = el('ul', { class: 'bui-rows', 'data-framed': '', id: 'wrapped' }, organizations.map(item => el('li', {}, [new ListRow({ tag: 'div', title: item.name, href: `#wrapped-${item.id}` }).element])));
const action = new Button({ label: 'Check the current machine state', onclick: () => { window.fixture.reads++; } });
const notice = callout({ tone: 'warning', title: 'Not available right now', body, actions: [action.element], details: detail });
notice.id = 'notice';
const collection = new Collection({ label: 'Grouped objects', columns: [{ key: 'name', label: 'Name', primary: true }], presentation: 'list', framed: true, source: async () => ({ rows: organizations, total: 2 }), group: item => ({ key: item.role, label: item.role }), search: false });
window.fixture = { ready: false, reads: 0, menu: 0 };
new Page({ header: new PageHeader({ title: 'Organizations', lead: 'Choose where to work.' }), children: [list, stacked, wrapped, notice, callout({ body: 'A body-only notice.' }), collection.element] }).mount(document.getElementById('root'));
await collection.load();
window.fixture.ready = true;
