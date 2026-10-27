// The tools page of the plain DOM consumer (0.44.0): a page whose header holds a collection's tools, with a
// period filter beside a finite one, over a list of usage records; `?empty=1` shows the empty collection
// and its one action, the section's own. window.fixture logs the source's requests and the action's presses.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { Collection, Page, PageHeader, el } from '@beyond-js/ui';
import { clock, chosen, words } from '../data/tools.js';

const text = words.en;
const requests = [];
const pressed = [];
const tools = el('div', { class: 'tools-outlet' });
const header = new PageHeader({ title: text.title, actions: [tools] });
const list = new Collection({
	label: text.title,
	presentation: 'list',
	tools: 'external',
	columns: [{ key: 'name', label: text.title, primary: true }, { key: 'amount', label: 'USD', end: true }],
	filters: [{ name: 'period', label: text.period, kind: 'period', now: clock }, { name: 'kind', label: text.kind, options: text.kinds }],
	source: async request => (requests.push(request), { rows: chosen(request), total: chosen(request).length }),
	empty: { title: text.empty, body: text.body, action: { label: text.register, run: () => pressed.push(text.register) } }
});
tools.append(list.tools.element);
const page = new Page({ header, children: [list.element] }).mount(document.getElementById('root'));

window.fixture = {
	requests,
	pressed,
	destroy() {
		for (const component of [list, page, header]) component.destroy();
	},
	ready: true
};
