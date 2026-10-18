// The 0.17.1 page of the plain DOM consumer: a family bar whose descriptor changes while a menu is open,
// a CopyValue in a fact's narrow value, and an outage that tries again by itself. window.fixture drives them.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { FamilyBar, CopyValue, Unavailable, el } from '@beyond-js/ui';
import { chosen, fallback, product } from '../data/family.js';

const root = document.getElementById('root');
const descriptor = chosen();
const bar = new FamilyBar({ product, brand: { src: '../brand/wordmark.svg', href: '/projects/' }, descriptor, fallback, account: { signout: () => {} } }).mount(root);
const main = root.appendChild(el('main', { class: 'hold-page' }));
const value = new CopyValue({ value: 'snap_01HZX9K3M4N5P6Q7R8S9T0V1W2', label: 'the identifier' });
main.append(el('div', { class: 'hold-fact', id: 'fact' }, [value.element]));
const read = { tries: 0, answer: false };
const outage = new Unavailable({
	title: 'Snapshots is not answering',
	reason: 'Your snapshots are safe. This page opens by itself when it answers.',
	kind: 'outage',
	again: async () => {
		read.tries += 1;
		if (!read.answer) throw new Error('unavailable');
		outage.element.replaceWith(el('p', { id: 'recovered', text: 'Your snapshots' }));
	}
}).mount(main);

let round = 0;
window.fixture = {
	read,
	outage,
	/** A new descriptor: one more project, the same place */
	redraw() {
		round += 1;
		bar.descriptor = { ...descriptor, projects: [...descriptor.projects, { id: `prj_${round}`, name: `Project ${round}`, current: false }] };
	},
	/** The same descriptor again */
	same() {
		bar.descriptor = { ...descriptor, projects: [...descriptor.projects] };
	},
	ready: true
};
