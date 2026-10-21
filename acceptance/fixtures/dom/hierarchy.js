// The hierarchy page of the plain DOM consumer (0.19.0, D158): a side sheet drawn as a machine's panel (its
// title, sections at level 3 holding a state, sentences, meters and a note, and one quiet line of ways
// on), a dialog, and a second sheet that breaks the rule on purpose (a region's heading drawn as a label
// above meters and a sentence), so the development build's Hierarchy warning has something to name.
// window.fixture exposes the sheets, the dialog and the warnings the page gave.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { SideSheet, Dialog, Section, Meter, ActionLine, Button, status, el } from '@beyond-js/ui';

const warnings = [];
const warn = console.warn.bind(console);
console.warn = (message, ...rest) => {
	if (String(message).startsWith('@beyond-js/ui: the heading')) warnings.push(String(message));
	warn(message, ...rest);
};
const root = document.getElementById('root');
const link = (href, text) => el('a', { href, text });
const section = (title, children) => new Section({ title, level: 3, children }).element;
const sheet = new SideSheet({
	title: 'lab',
	description: 'Your machine in Storefront',
	children: [
		section('State', [el('div', { class: 'row' }, [status('Asleep'), new Button({ label: 'Wake up', variant: 'primary', small: true }).element]), el('p', { class: 'fixture-note', text: 'Put to sleep at 17:08 by its idle policy' })]),
		section('When it sleeps', [el('p', { text: 'When it is awake, it goes to sleep after 30 min with nothing running.' }), new ActionLine({ actions: [link('#settings', 'Change when it sleeps')] }).element]),
		section('Work on it', [el('p', { text: 'Nothing runs on it now.' })]),
		section('Load', [new Meter({ label: 'Processor', value: 0 }).element, new Meter({ label: 'Memory', value: 0.04 }).element, el('p', { class: 'fixture-note', text: 'Measured at 17:07' })]),
		section('Used this month', [el('p', { text: '2 d 4 h awake in October' }), el('p', { text: 'About $10.22 at list price · an estimate, not a charge' })]),
		new ActionLine({ label: 'Ways on', actions: [link('#machine', 'Open lab'), link('#files', 'Files on lab'), link('#usage', 'Usage')] }).element
	]
});
const wrong = new SideSheet({
	title: 'web',
	children: [el('section', { 'aria-labelledby': 'wrong-load' }, [el('h3', { id: 'wrong-load', class: 'fixture-eyebrow', text: 'Load' }), new Meter({ label: 'Processor', value: 0.5 }).element]), el('section', { 'aria-labelledby': 'wrong-work' }, [el('h3', { id: 'wrong-work', class: 'fixture-eyebrow', text: 'Work on it' }), el('p', { text: 'Fix the checkout redirect' })])]
});
const dialog = new Dialog({ title: 'Put lab to sleep now?', children: [el('p', { text: 'The turn running on it stops; its work so far is kept.' })] });
root.append(el('main', {}, [el('h1', { text: 'Hierarchy' }), new Button({ label: 'Show lab', onclick: () => sheet.open() }).element]));
window.fixture = { sheet, wrong, dialog, warnings, ready: true };
