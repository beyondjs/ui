/** Declarations of 0.32.0's Required and Quiet (D183). */
import { Required, Quiet, Field, Button } from '@beyond-js/ui';

const form = document.createElement('form');
const required = new Required(form);
const waits: boolean = required.missing && required.focus();
const held: boolean = required.hold(new Event('submit', { cancelable: true }));
const buttons: Array<HTMLButtonElement | HTMLInputElement> = required.buttons;
const first = required.first;
const name = new Field({ label: 'Name', name: 'name', required: true });
const fielded = new Required(form, { fields: [name] });
const empty: boolean = Required.empty(name.control);
const quiet = new Quiet(document.createElement('button'), { waiting: () => true, place: () => document.querySelector('input'), form });
const still: boolean = quiet.waiting;
quiet.settle();
quiet.destroy();
fielded.destroy();
// @ts-expect-error a quiet control says what it waits for
new Quiet(document.createElement('button'), {});
const add = new Button({ label: 'Add', waiting: true, place: () => document.querySelector('input') });
add.waiting = false;
const ask: string = Required.ask;
const told: string = Required.change;
Required.tell(form);
const order: boolean = Required.before(form, document.body);
// A control's own state that no form frees (0.35.0)
const kept: boolean = Required.held(form);
const unread: Element | null = required.unread ?? required.wrong;
void [waits, held, buttons, first, empty, still, ask, told, order, unread, kept];
