/** Declarations of 0.29.0's TurnIndex and the compact line's subject, as a DOM consumer uses them. */
import { TurnIndex, PageHeader } from '@beyond-js/ui';
import type { Turn, TurnSeen, TurnState } from '@beyond-js/ui';

const seen: TurnSeen[] = [];
const index = new TurnIndex({ label: 'Turns', labels: TurnIndex.labels.es, keys: true, choose: (key: string, how: 'press' | 'key') => void [key, how], onview: (turn: TurnSeen) => void seen.push(turn) });
const turns: Turn[] = [
	{ key: 't1', title: 'Make the composer quieter', summary: 'Send is quiet while the field is empty.', facts: ['Changed 2 files', '12:01', '1 min 5 s'], href: '#/c/1?turn=t1', element: document.createElement('li'), head: document.createElement('div') },
	{ key: 2, title: 'Fix the flaky test', state: 'waiting', stateLabel: 'Needs you' }
];
index.update({ turns }).update({ label: null });
const moved: boolean = index.move(-1);
const focused: boolean = index.focus('t1', { preventScroll: true });
const current: string | null = index.current;
const covered: boolean = index.covered;
const state: TurnState = TurnIndex.states[0];
index.measure();
const header = new PageHeader({ title: 'Fix the checkout redirect', compact: true });
header.subject = { text: 'Make the composer quieter', href: '#/c/1?turn=t1' };
header.subject = null;
void [moved, focused, current, covered, state, index.keys, index.element];
// @ts-expect-error a turn needs a title
index.update({ turns: [{ key: 'x' }] });
// @ts-expect-error choose says how the turn was chosen
void new TurnIndex({ choose: (key: string, how: number) => [key, how] });
