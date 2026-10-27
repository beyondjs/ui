// The measure page of the plain DOM consumer (0.41.0): boxes of known geometry that test the inset measurer
// itself (`support/insets.mjs`), each in a block of its own named by its id. A definition list drawn with its
// groups as `display: contents` and the same list without them; boxes that hide a trimmed overflow
// (`overflow: hidden`, `overflow: clip`) and one whose content fits; a box holding a caption only a screen reader
// reads, clipped on purpose, and one whose text a line clamp ends on purpose; a row whose background draws only
// a 1 px divider, one whose background fills it and one whose 1 px layer repeats into a fill.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { el } from '@beyond-js/ui';

const main = document.getElementById('root').appendChild(el('main', { class: 'measure-page' }));
const place = (id, children) => main.appendChild(el('div', { id, class: 'measure-box' }, children));
const facts = [['Region', 'us-east4'], ['Size', 'Standard, 4 vCPU'], ['Disk', '40 GB, 2 GB left']];
const pair = ([term, value]) => [el('dt', { text: term }), el('dd', { text: value })];

place('grouped', [el('dl', {}, facts.map(fact => el('div', { class: 'measure-group' }, pair(fact))))]);
place('flat', [el('dl', {}, facts.flatMap(pair))]);
const lines = 'A machine that sleeps keeps its disk and wakes up when a conversation needs it, so nothing you started is lost while it waits for you.';
place('hidden', [el('p', { text: lines })]);
place('clip', [el('p', { text: lines })]);
place('fits', [el('p', { text: 'Ready' })]);
place('caption', [el('p', { text: 'Ready' }), el('span', { class: 'measure-caption', text: lines })]);
place('clamped', [el('p', { class: 'measure-clamp', text: lines })]);
place('lined', [el('p', { class: 'measure-lined', text: 'Prepare storefront' })]);
place('filled', [el('p', { class: 'measure-filled', text: 'Prepare storefront' })]);
place('repeated', [el('p', { class: 'measure-repeated', text: 'Prepare storefront' })]);

window.fixture = { ready: true };
