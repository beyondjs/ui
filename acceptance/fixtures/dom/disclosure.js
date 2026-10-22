import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { Disclosure, Help, el } from '@beyond-js/ui';
const root = document.getElementById('root');
root.append(el('button', { id: 'action', text: 'Open branch', onclick: () => { root.dataset.opened = 'true'; } }));
const section = new Disclosure({ label: 'Development', outside: false, children: [el('input', { 'aria-label': 'Command' })] }).mount(root);
section.element.id = 'section';
new Disclosure({ label: 'Menu', children: [el('button', { text: 'Menu action' })] }).mount(root);

new Help({ topic: 'Command', text: 'Choose a command.' }).mount(root);
window.fixture = { ready: true };
