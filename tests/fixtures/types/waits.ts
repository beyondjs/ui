/** Declarations of 0.35.0's waits (D183): a chooser that waits for an earlier choice, a held Send's place and `Required.report`. */
import { ChoiceMenu, ChoiceChip, Composer, Required, RefChooser } from '@beyond-js/ui';

const repository = new ChoiceChip({ label: 'Repository', options: [{ value: 'web', label: 'acme/web' }] });
const branch = new ChoiceChip({ label: 'Branch', options: [{ value: 'main', label: 'main' }], waiting: true, place: () => repository.control });
const menu = new ChoiceMenu({ label: 'Branch', options: [{ value: 'main', label: 'main' }], waiting: true });
branch.waiting = false;
const waits: boolean = menu.waiting && branch.open();
const composer = new Composer({ label: 'Message', onsubmit: () => Promise.resolve(), disabled: { reason: 'Choose a machine first.', place: () => repository.control } });
composer.disabled = { reason: 'Choose a machine first.', place: null };
const place: (() => HTMLElement | null | undefined) | null | undefined = composer.disabled?.place;
// @ts-expect-error a place is a function that returns an element, never the element itself
new ChoiceMenu({ label: 'Branch', options: [], place: repository.control });
// @ts-expect-error waiting is a yes or no
menu.waiting = 'soon';
void [waits, place];
// React Form's `report` reads the same rule (0.35.0)
const reported: boolean = new Required(document.createElement('form')).report(new Event('submit', { cancelable: true }));
void reported;
// A ref chooser waits for its repository too (0.35.0)
const refs = new RefChooser({ refs: [{ name: 'main', default: true }], waiting: true, place: () => repository.control });
refs.waiting = false;
void refs.waiting;
