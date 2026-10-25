/** Declarations of 0.34.0's waits (D183): a chooser that waits for an earlier choice and a held Send's place. */
import { ChoiceMenu, ChoiceChip, Composer } from '@beyond-js/ui';

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
