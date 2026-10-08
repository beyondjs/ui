// 0.11.1 in plain DOM: a narrow composer's Options, a cut suggestion list, Hint and Age.
import { Age, Composer, Hint } from '@beyond-js/ui';
import type { AgeWords, ComposerFold, ComposerSuggestAnswer } from '@beyond-js/ui';

const cut: ComposerSuggestAnswer = { items: [{ value: '@src/a.js', mono: true }], total: 120 };
const unknown: ComposerSuggestAnswer = { items: [], more: true, note: 'Only files under src' };
const composer = new Composer({ label: 'Message', compact: false, onsuggest: async () => cut, onsubmit: async () => undefined });
const fold: ComposerFold = composer.fold;
fold.toggle(true);
const expanded: boolean = fold.open;
const button: HTMLButtonElement = fold.button;
// @ts-expect-error compact is a boolean
void new Composer({ label: 'Message', compact: 'auto', onsubmit: async () => undefined });

const hint = new Hint(document.body);
hint.release(button);
hint.destroy();

const age = new Age({ locale: 'es', now: () => Date.now(), labels: { weeks: '{count} sem' } });
const said: AgeWords | null = age.of('2026-10-08T10:00:00Z');
const label: string = said?.label ?? '';
const moment: number | null = Age.moment(new Date());
const units: string = Age.labels.es.weeks as string;
// @ts-expect-error an age is a moment, not words
void age.of({ label: '2 h' });

export { unknown, expanded, label, moment, units };
