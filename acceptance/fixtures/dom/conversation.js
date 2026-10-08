// The conversation page of the plain DOM consumer, in English: the Sidebar with entries, a search and
// "New conversation"; a Page whose panel is kept in view; activity rows and a group, a plan without a
// region of its own, a live answer, the conversation's composer in a sticky dock and a new
// conversation's composer with its tools. window.fixture drives sends, streams and teardown.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { FamilyBar, Sidebar, Page, PageHeader, Section, Button, Composer, LiveText, ActivityRow, ActivityGroup, Steps, ChoiceMenu, status, el } from '@beyond-js/ui';
import { chosen, fallback, product } from '../data/family.js';
import { shape, words, groups, search, output, plan, answer } from '../data/conversation.js';

const copy = words.en;
const log = [];
const fixture = { log, refuse: false, delay: 80, draws: 0, ready: false };
window.fixture = fixture;
const root = document.getElementById('root');
const bar = new FamilyBar({ product, brand: { src: '../brand/wordmark.svg', href: '/projects/' }, descriptor: chosen(), fallback, account: { signout: () => {} } }).mount(root);
const shell = root.appendChild(el('div', { class: 'bui-shell' }));
const sidebar = new Sidebar({ product: copy.product, section: copy.section, context: { label: copy.project, name: 'Storefront' }, groups: groups(copy), action: { label: copy.action, href: '#/new' }, search: search(copy), onnavigate: item => log.push(`navigate:${item.href}`) }).mount(shell);
const main = shell.appendChild(el('main', { id: 'main' }));

/** A send the page answers after `fixture.delay`, or refuses when `fixture.refuse`. */
const send = message => {
	log.push(`send:${message.action}:${message.text}`);
	return new Promise((resolve, reject) => setTimeout(() => (fixture.refuse ? reject(new Error('refused')) : resolve()), fixture.delay));
};
const paragraphs = text => {
	fixture.draws += 1;
	return el('div', {}, text.split('\n\n').map(part => el('p', { text: part })));
};

const read = new ActivityGroup({ glyph: 'file', title: copy.read, rows: ['src/checkout/redirect.js', 'src/checkout/session.js', 'test/checkout.test.js'].map(path => new ActivityRow({ glyph: 'file', title: `Read ${path}` })) });
const edit = new ActivityRow({ glyph: 'code', title: 'Edited src/checkout/redirect.js', meta: '+1 −1', duration: 900, body: () => [{ label: 'Diff', text: '- return session.cart\n+ return order.confirmation' }] });
const failed = new ActivityRow({ glyph: 'terminal', title: 'Ran npm test', meta: 'exit 1', state: 'failed', duration: 12_400, body: () => [{ label: 'Input', text: 'npm test' }, { label: 'Output', text: output }] });
const running = new ActivityRow({ glyph: 'terminal', title: 'Running npm test -- --reporter=spec test/checkout/failed-payment.test.js test/checkout/redirect.test.js', state: shape.running ? 'running' : 'done', since: Date.now() - 4000, tail: 'ok 1 - keeps the cart\nok 2 - shows the error', body: () => [{ label: 'Input', text: 'npm test -- --reporter=spec' }] });
const steps = new Steps({ label: copy.plan, steps: plan(['Read the checkout', 'Write the failing test', 'Commit']), announce: false });
const live = new LiveText({ render: paragraphs });
const thread = el('div', { class: 'thread' }, [el('p', { class: 'message', text: 'Also add a test for a failed payment that keeps the cart, then commit it.' }), read.element, edit.element, failed.element, running.element, steps.element, live.element]);

const composer = new Composer({ label: copy.message, placeholder: copy.placeholder, actions: [{ id: 'queue', label: copy.queue }], stop: shape.running ? { label: copy.interrupt, run: () => new Promise(resolve => setTimeout(() => (log.push('interrupt'), resolve()), 800)) } : null, onsubmit: send });
const environment = new ChoiceMenu({ label: copy.environment, options: [{ value: 'web', label: 'web', status: ['Stopped', 'neutral'] }, { value: 'lab', label: 'lab' }], value: 'web' });
const engine = new ChoiceMenu({ label: copy.engine, options: [{ value: 'claude', label: 'Claude Code' }, { value: 'codex', label: 'Codex' }], value: 'claude' });
const fresh = new Composer({ label: copy.message, placeholder: 'Message Claude Code…', status: copy.state, tools: [environment, engine], actions: [{ id: 'start', label: copy.start, primary: true }, { id: 'wait', label: copy.wait }], onsubmit: send });
const details = new Button({ label: copy.details, variant: 'quiet' });
const header = new PageHeader({ title: copy.title, status: status(copy.status, 'warning'), facts: copy.facts, actions: [details] });
const facts = [copy.environment, copy.engine, copy.repository].map((title, index) => new Section({ title, level: 3, children: [el('p', { class: 'facts', text: ['web · Running · 4 vCPU', 'Claude Code · Max plan', 'acme/web from main'][index] }), index === 0 ? el('a', { href: '#/environments/web', text: 'Open web' }) : null] }).element);
const view = new Page({ template: 'detail', width: 'standard', header, children: [el('section', { class: 'fresh', id: 'fresh' }, [fresh.element]), thread, el('div', { class: 'dock' }, [composer.element])], aside: facts, label: copy.panel, panel: { cut: '73rem', open: shape.panel, title: copy.details, onchange: shown => log.push(`panel:${shown}`) } });
if (shape.place === 'element') main.append(view.element);
else view.mount(main);
view.panel.control(details.element);

Object.assign(fixture, {
	composer,
	fresh,
	live,
	rows: { read, edit, failed, running },
	sidebar,
	page: view,
	/** Streams the answer in pieces of `size` characters every `every` ms; resolves with the frames that passed. */
	stream(size = 3, every = 2) {
		return new Promise(resolve => {
			let frames = 0;
			let at = 0;
			const count = () => ((frames += 1), at < answer.length && requestAnimationFrame(count));
			requestAnimationFrame(count);
			const timer = setInterval(() => {
				live.append(answer.slice(at, at + size));
				at += size;
				if (at >= answer.length) {
					clearInterval(timer);
					requestAnimationFrame(() => requestAnimationFrame(() => resolve(frames)));
				}
			}, every);
		});
	},
	/** Makes sending from the new conversation's composer unavailable, with its reason, or available again. */
	block(reason) {
		fresh.disabled = reason ? { reason } : null;
	},
	/** Changes the conversation's entries as a live update would: a mark, a new entry first. */
	update() {
		const next = groups(copy);
		next[3].items = [{ key: 'c6', label: 'Check the logs', href: '#/conversations/c6' }, { ...next[3].items[0], mark: { label: 'Working', tone: 'progress' } }, ...next[3].items.slice(1)];
		sidebar.groups = next;
	},
	destroy() {
		for (const component of [view, composer, fresh, environment, engine, live, steps, read, edit, failed, running, details, sidebar, bar]) component.destroy();
	},
	ready: true
});
