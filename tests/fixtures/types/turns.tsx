/** Declarations of 0.29.0's TurnIndex and the compact line's subject in React. */
import { createRef } from 'react';
import { TurnIndex, PageHeader } from '@beyond-js/ui/react';
import type { TurnIndexHandle, Turn } from '@beyond-js/ui/react';

const ref = createRef<TurnIndexHandle>();
const turns: Turn[] = [{ key: 'a', title: 'Fix the flaky test', state: 'failed', facts: ['12:01'] }];
export const view = <TurnIndex ref={ref} label="Turns" turns={turns} keys onChoose={(key: string, how: 'press' | 'key') => void [key, how, ref.current?.move(1)]} onView={seen => void seen.covered} labels={TurnIndex.labels.en} />;
export const header = <PageHeader title="Fix the checkout redirect" compact subject={{ text: 'Make the composer quieter', href: '#/c/1?turn=a' }} />;
/** 0.41.0 (D191): a page's lead under its facts line. */
export const led = <PageHeader title="GitHub" facts="Beyond (GitHub App)" lead={<>Choose which repositories Beyond Projects may read.</>} />;
// @ts-expect-error a turn's key is a string or a number
export const wrong = <TurnIndex turns={[{ key: true, title: 'Fix' }]} />;
