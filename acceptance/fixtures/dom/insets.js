// The insets page of the plain DOM consumer (D184): the boxes no other fixture page draws, each in a block of
// its own named by its id, so the insets check measures one box at a time: callouts ending in actions, in
// text and in technical details, a framed empty state, a checklist, a raised section, a textarea and a
// refusal with no action; since 0.34.0 a request whose command may be corrected (an editable CommandCard)
// and an outage's line in a narrow block, its words wrapping beside Try again. window.fixture shows a toast
// with a detail and tears them down.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { callout, Button, EmptyState, Checklist, Section, Field, Unavailable, Toaster, CommandCard, Recovery, el } from '@beyond-js/ui';
import { words } from '../data/insets.js';

const copy = words.en;
const main = document.getElementById('root').appendChild(el('main', { class: 'insets-page' }));
const place = (id, node) => main.appendChild(el('div', { id }, [node]));
const time = Date.now() - 60_000;

const buttons = [new Button({ label: copy.info.action, variant: 'secondary' }), new Button({ label: copy.info.other, variant: 'quiet' })];
place('callout-actions', callout({ tone: 'info', title: copy.info.title, body: copy.info.body, actions: buttons.map(button => button.element) }));
place('callout-text', callout({ tone: 'warning', title: copy.warning.title, body: copy.warning.body }));
place('callout-details', callout({ tone: 'danger', title: copy.danger.title, body: copy.danger.body, details: { ...copy.danger.details, time } }));
const empty = new EmptyState({ kind: 'empty', title: copy.empty.title, text: copy.empty.text, action: { label: copy.empty.action, run: () => {} } });
place('empty', empty.element);
const checklist = new Checklist({ title: copy.checklist.title, steps: copy.checklist.steps.map(step => (step.action ? { ...step, action: { ...step.action, run: () => {} } } : step)) });
place('checklist', checklist.element);
const section = new Section({ title: copy.section.title, raised: true, children: [el('p', { text: copy.section.text })] });
place('section', section.element);
const notes = new Field({ label: copy.notes.label, type: 'textarea', value: copy.notes.value });
place('notes', notes.element);
const refusal = new Unavailable({ title: copy.refusal.title, reason: copy.refusal.reason, owner: copy.refusal.owner });
place('refusal', refusal.element);
const command = new CommandCard({ title: copy.command.title, command: copy.command.text, editable: true, allow: () => undefined, deny: () => undefined });
place('command-edit', command.element);
const recovery = new Recovery({ title: copy.recovery.cause });
recovery.set('project', { title: copy.recovery.read, details: { request: 'req_insets_7Hq2', time, text: copy.recovery.said }, run: async () => false });
place('recovery-wide', recovery.element);

const toaster = new Toaster().mount(document.body);

window.fixture = {
	toast: () => toaster.show(copy.toast.title, { detail: copy.toast.detail, duration: 600_000 }),
	destroy() {
		for (const component of [toaster, recovery, command, refusal, notes, section, checklist, empty, ...buttons]) component.destroy();
		main.remove();
	},
	ready: true
};
