// The pressing page of the plain DOM consumer (0.34.0, D183): where a press puts the person. A new
// conversation's composer, docked in the thread template, whose tray holds the repository chip, a branch
// chip that waits for it and the line comments that go with the next message (`ComposerChip`); its Send is
// held until a repository is chosen, a press on it going to the repository chip. The settings hold one
// more chip that acts, which the insets and the shortened toolbar's tooltip are measured on. The page's
// development warnings are kept. window.fixture logs what runs.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { Page, PageHeader, Composer, ComposerChip, ChoiceChip, el } from '@beyond-js/ui';
import { words } from '../data/pressing.js';

const copy = words.en;
const log = [];
const warnings = [];
const warn = console.warn.bind(console);
console.warn = (message, ...rest) => (warnings.push(String(message)), warn(message, ...rest));
const main = document.getElementById('root').appendChild(el('main', { id: 'main' }));
const repository = new ChoiceChip({ label: copy.repository, options: copy.repositories, onchange: value => choose(value) });
const branch = new ChoiceChip({ label: copy.branch, options: copy.branches, waiting: true, place: () => repository.control, onchange: value => log.push(`branch:${value}`) });
const comments = new ComposerChip({ label: copy.comments, value: 2, glyph: 'chat', description: copy.description, onclick: () => log.push('comments:open') });
const instructions = new ComposerChip({ label: copy.instructions, value: 1, glyph: 'book', onclick: () => log.push('instructions:open') });
const composer = new Composer({
	label: copy.label,
	placeholder: copy.placeholder,
	value: copy.draft,
	settings: [instructions],
	tray: [repository, branch, comments],
	disabled: { reason: copy.held, place: () => repository.control },
	onsubmit: message => (log.push(`send:${message.text}`), Promise.resolve())
});
const header = new PageHeader({ title: copy.title });
const page = new Page({ template: 'thread', header, children: [el('div', { id: 'thread' })], dock: composer }).mount(main);

/** A repository chosen: the branch can be chosen and the message sent. */
function choose(value) {
	log.push(`repository:${value}`);
	branch.waiting = false;
	composer.disabled = null;
}

window.fixture = {
	log,
	warnings,
	composer,
	destroy() {
		for (const component of [page, header, composer, repository, branch, comments, instructions]) component.destroy();
	},
	ready: true
};
