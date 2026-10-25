// The hanging page of the plain DOM consumer (0.37.0, D188): quiet controls where a page puts them, each case in
// a block of its own named by its id, so the hanging check measures where their words land and where their
// surface reaches: a column's quiet actions under its text, an action line, a quiet action beside a bordered
// one and after a sentence, a callout led by a quiet action, a composer's state band with its action at its end
// and with a product's own line whose action wraps under it, and a copyable value.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { ActionLine, Button, Composer, CopyValue, callout, el, status } from '@beyond-js/ui';

const main = document.getElementById('root').appendChild(el('main', { class: 'hanging-page' }));
const place = (id, node) => (main.appendChild(el('section', { id, class: 'hanging-case' }, [node])), node);
const quiet = (label, small = false) => new Button({ label, variant: 'quiet', small }).element;

place(
	'column',
	el('div', { class: 'hanging-column' }, [
		el('p', { 'data-edge': '', text: 'Access refused. The machine did not answer.' }),
		el('div', { class: 'hanging-row' }, [quiet('Try waking it up again')]),
		el('div', { class: 'hanging-row' }, [quiet('Try waking it up again', true)]),
		new ActionLine({ actions: [quiet('Show the log'), quiet('Copy the request')] }).element,
		el('div', { class: 'hanging-row', 'data-beside': '' }, [new Button({ label: 'Save', variant: 'secondary', small: true }).element, quiet('Cancel', true)]),
		el('div', { class: 'hanging-row hanging-sentence', 'data-after': '' }, [el('span', { text: 'Not available right now' }), quiet('Open the machine', true)])
	])
);
place('callout', callout({ tone: 'warning', title: 'Your machine goes to sleep in 4 minutes', body: 'Its work is kept.', actions: [quiet('Keep awake'), new Button({ label: 'Settings', variant: 'secondary' }).element] }));

const composer = (id, state) => new Composer({ label: 'Message', placeholder: 'Message Claude Code', onsubmit: () => Promise.resolve(), status: state }).mount(place(id, el('div')));
composer('band-end', { text: 'My first VM is asleep', action: { label: 'Wake up', run: () => {} } });
composer('band-line', el('span', { class: 'hanging-line', role: 'status' }, [status('Development Machine · Needs attention · Access refused', 'failure'), quiet('Try waking it up again', true)]));

place('copy', el('p', { class: 'hanging-fact' }, [new CopyValue({ value: 'req_01JBX4T0M2Q8', label: 'the request identifier' }).element]));

window.fixture = { ready: true };
