/** Declarations of 0.27.0's Lanes in React. */
import { createRef } from 'react';
import { Lanes } from '@beyond-js/ui/react';
import type { LanesHandle } from '@beyond-js/ui/react';

const ref = createRef<LanesHandle>();
export const view = <Lanes ref={ref} label="Subagents of this turn" lanes={[{ key: 'a', state: 'waiting', stateLabel: 'Waiting for you', title: 'Fix the flaky test', now: 'run npm test', facts: ['11k'], since: Date.now() }]} trace onChoose={(key: string) => ref.current?.focus(key)} labels={Lanes.labels.en} />;
// @ts-expect-error a React lane's title is text
export const wrong = <Lanes lanes={[{ key: 'a', title: <b>Fix</b> }]} />;
