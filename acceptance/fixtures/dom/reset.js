// The reset page of the plain DOM consumer (0.44.0, D187): the package's styles, then a product's unlayered reset
// (`../reset.css`, Tailwind 3's `:-moz-focusring { outline: auto; }`; `?reset=off` leaves it out), and no focus rule
// of the product's own. The family bar with twelve projects (its menu's search field); a link, two buttons, a
// product's own button and checkbox, a field, a select, a product's own box (`bui-edge`) around a field, a button
// that opens the command palette and one that focuses a heading for reading; then a product's heading with a ring
// of its own and a field with a coral border, which `Focus` (started over the document) names. window.fixture
// records what the page heard and what `Focus` warned.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { FamilyBar, Button, Field, Select, CommandPalette, Focus, el } from '@beyond-js/ui';
import { descriptors, fallback, product } from '../data/family.js';
import { sources } from '../data/wave.js';

if (new URLSearchParams(location.search).get('reset') === 'off') document.getElementById('reset').remove();
const log = [];
const warned = [];
const focus = new Focus({ root: document, warn: (message, node) => warned.push({ id: node.id || node.className, message }) });
const root = document.getElementById('root');
const bar = new FamilyBar({ product, brand: { src: '../brand/wordmark.svg', href: '/projects/' }, descriptor: descriptors.many, fallback, account: { signout: () => {} } }).mount(root);
const main = root.appendChild(el('main', { class: 'fixture-focus' }));
const palette = new CommandPalette({ sources: sources(log), delay: 0, onnavigate: item => log.push(`palette:${item.href}`) });
const identified = (control, id) => ((control.element.id = id), control.element);
const heading = el('h2', { id: 'results', tabindex: '-1', text: 'Results' });
main.append(
	el('a', { id: 'before', href: '#before', text: 'Before the controls' }),
	el('div', { class: 'fixture-row' }, [identified(new Button({ label: 'Open files', variant: 'secondary' }), 'open'), identified(new Button({ label: 'Create pull request', variant: 'primary' }), 'create'), el('button', { id: 'own', type: 'button', text: 'Copy the address' })]),
	el('label', { class: 'fixture-row' }, [el('input', { id: 'notify', type: 'checkbox' }), 'Notify me']),
	identified(new Field({ label: 'Repository name', value: 'storefront' }), 'name'),
	identified(new Field({ label: 'Region', control: new Select({ options: [{ value: 'eu', label: 'Europe' }, { value: 'us', label: 'United States' }] }) }), 'region'),
	el('label', { class: 'bui-edge fixture-box', id: 'box' }, [el('input', { id: 'inside', 'aria-label': 'Host', value: 'example.com' })]),
	el('div', { class: 'fixture-row' }, [identified(new Button({ label: 'Search', variant: 'secondary', onclick: () => palette.open() }), 'search'), identified(new Button({ label: 'Read the results', variant: 'quiet', onclick: () => heading.focus() }), 'read')]),
	heading,
	el('p', { text: 'Three rows match.' }),
	el('h2', { id: 'ringed', class: 'fixture-ringed', tabindex: '-1', text: 'Ringed' }),
	el('input', { id: 'coral', class: 'fixture-coral', 'aria-label': 'Coral' })
);
window.fixture = { log, warned, bar, palette, focus, ready: true };
