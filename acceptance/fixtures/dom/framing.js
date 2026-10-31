// Framed choices (0.46.0) in the plain DOM consumer: several permissions, each with its hint and a state tag, one
// chosen and one disabled with its reason, and a framed radio group. window.fixture holds what the groups reported.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { Choices, Button, el } from '@beyond-js/ui';
import { permissions, chosen, reach } from '../data/framing.js';

const changes = [];
const main = document.getElementById('root').appendChild(el('main'));
const before = new Button({ label: 'Before the permissions' });
main.append(before.element);
new Choices({ legend: 'What it may do', options: permissions, value: chosen, framed: true, onchange: value => changes.push(value) }).mount(main).element.id = 'permissions';
new Choices({ legend: 'Where', type: 'radio', name: 'reach', options: reach, value: 'one', framed: true, onchange: value => changes.push(value) }).mount(main).element.id = 'reach';
window.fixture = { changes, ready: true };
