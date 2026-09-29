// The family bar page of the plain DOM consumer, in English (the package defaults): FamilyBar with the
// descriptor `?family=` names, ProductNav, the lockup at every height from 18 to 40 px, Unavailable and
// a confirmation with its consequence. window.fixture exposes the bar, a log and a teardown.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import { FamilyBar, ProductNav, NotificationEntry, Unavailable, Button, confirm, lockup, badge, availability } from '@beyond-js/ui';
import { Notices } from '../data/notices.js';
import { chosen, descriptors, fallback } from '../data/family.js';

const log = [];
const root = document.getElementById('root');
const products = { delegate: 'Delegate', cdn: 'CDN', projects: 'Projects' };
const entry = new NotificationEntry({ adapter: new Notices('ready').adapter, href: '#/notifications', products });
const bar = new FamilyBar({
	product: 'delegate',
	brand: { src: '../brand/wordmark.svg', href: '/projects/' },
	descriptor: chosen(),
	fallback,
	notifications: entry.element,
	account: { signout: () => log.push('signout'), items: [{ label: 'Delegate settings', href: '#/settings' }] },
	onnavigate: item => log.push(`navigate:${item.href}`)
}).mount(root);
const nav = new ProductNav({ label: 'Delegate', items: ['Requests', 'Versions', 'Environments', 'Services', 'Consumption', 'Settings'].map((label, index) => ({ label, href: `#/${label.toLowerCase()}`, current: index === 4 })) }).mount(root);

const main = document.createElement('main');
main.id = 'main';
main.innerHTML = '<h1>Family bar</h1><section id="lockups" class="lockups" aria-label="Lockups"></section><section id="patterns" class="row"></section><div class="tall"></div>';
root.append(main);
for (let height = 18; height <= 40; height++) {
	const row = document.createElement('div');
	row.style.setProperty('--bui-lockup-height', `${height}px`);
	row.append(lockup({ src: '../brand/wordmark.svg', name: 'Delegate' }));
	main.querySelector('#lockups').append(row);
}
const patterns = main.querySelector('#patterns');
const ask = new Button({ label: 'Ask for access', variant: 'primary' });
const missing = new Unavailable({ title: 'Workspace is not open to you yet', reason: 'Development environments open by invitation.', owner: 'An owner of Northwind Studio', action: ask.element, code: 'NOT_ADMITTED' }).mount(patterns);
const remove = new Button({ label: 'Delete project', variant: 'danger', onclick: async () => log.push(`confirm:${await confirm({ title: 'Delete Storefront redesign?', message: 'The project is deleted for everyone.', accept: 'Delete project', tone: 'danger', consequence: { lost: ['Its entries in each product', 'Its repositories'], kept: 'Each product’s own records', recovery: 'Deletion cannot be undone.' } })}`) }).mount(patterns);
for (const state of availability) patterns.append(badge(state.label, state.tone));

window.fixture = {
	bar,
	log,
	descriptors,
	/** Destroys everything this page created. */
	destroy() {
		for (const component of [remove, ask, missing, nav, bar, entry]) component.destroy();
	},
	ready: true
};
