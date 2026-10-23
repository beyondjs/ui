/** Declarations of 0.22.0's Lanes, as a DOM consumer uses them. */
import { Lanes, Clock } from '@beyond-js/ui';
import type { Lane, LaneState } from '@beyond-js/ui';

const lanes = new Lanes({ label: 'Subagents of this turn', clock: new Clock({ now: () => 0 }), locale: 'es', labels: Lanes.labels.es, trace: true, choose: (key: string, event: Event) => void [key, event.type] });
const crew: Lane[] = [
	{ key: 'explore', state: 'running', stateLabel: 'Working', title: 'Explore the auth module', kind: 'Explore', now: document.createElement('span'), facts: [{ text: '48k', label: 'tokens' }, '31 steps', 7], since: '2026-10-23T10:42:05Z' },
	{ key: 2, depth: 1, state: 'done', title: 'Map', until: new Date(), current: true }
];
lanes.update({ lanes: crew }).update({ label: 'Trabajo en paralelo', trace: false });
const moved: boolean = lanes.focus('explore', { preventScroll: true });
const keys: string[] = lanes.keys;
const state: LaneState = Lanes.states[0];
const steps: readonly number[] = Lanes.steps;
void [moved, keys, state, steps, lanes.element];
// @ts-expect-error a lane needs a key
lanes.update({ lanes: [{ title: 'No key' }] });
// @ts-expect-error choose takes the lane's key and the event
void new Lanes({ choose: (key: number) => key });
