// The 0.33.0 page of the plain DOM consumer (D163, D186): one outage of Beyond Projects said once by the
// page's Recovery, a table's cells and a picker saying it in their own places, and a rename answered
// unavailable in the warning tone. `?inbox=1`: the inbox's outage in the page form. window.fixture answers.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { Page, PageHeader, Section, Recovery, DataTable, EmptyState, Picker, FocusedForm, NotificationInbox, el } from '@beyond-js/ui';
import { words, shape, Reads } from '../data/closing.js';

const read = new Reads();
const main = document.getElementById('root').appendChild(el('main'));
const header = new PageHeader({ title: shape().inbox ? 'Notifications' : words.title });
if (shape().inbox) {
	const inbox = new NotificationInbox({ adapter: read.adapter, locale: 'en' });
	new Page({ template: 'overview', width: 'fluid', header, children: [inbox.element] }).mount(main);
} else {
	const recovery = new Recovery({ title: words.cause, focus: () => document.querySelector('h1') });
	const outage = error => error?.outage === true;
	const details = error => ({ request: error.request, time: Date.now(), text: error.message });
	const columns = [{ key: 'name', label: words.name, primary: true }, { key: 'work', label: words.work, render: () => new EmptyState({ kind: 'outage', inline: true }).element }];
	const table = new DataTable({ label: words.title, columns, rows: words.projects, search: false });
	recovery.set('work', { title: words.work, details: { request: 'req_work_7Hq2', time: Date.now(), text: 'Beyond Projects is unavailable (UNAVAILABLE)' }, run: async () => read.answer });
	const picker = new Picker({ label: words.repositories, source: read.source, delay: 0, recovery, outage, details });
	const form = el('form', { class: 'closing-form' }, [el('label', { class: 'bui-field-label', for: 'closing-name', text: words.field }), el('input', { id: 'closing-name', class: 'bui-input', name: 'name', value: 'Atlas' }), el('button', { type: 'submit', class: 'bui-button bui-button-primary', text: words.rename })]);
	new FocusedForm(form, { submit: async () => { throw read.failure(); }, explain: () => ({ outcome: 'unavailable', cause: words.cause }) });
	new Page({ template: 'overview', width: 'fluid', header, children: [recovery.element, new Section({ title: words.title, children: [table.element] }).element, new Section({ title: words.repositories, children: [picker.element] }).element, new Section({ title: words.rename, children: [form] }).element] }).mount(main);
	window.fixture = { read, recovery };
}
window.fixture = { ...(window.fixture ?? {}), read, ready: true };
