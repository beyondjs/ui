import { Section, waiting, loading, type WaitingShape } from '@beyond-js/ui';

// A region's wait (0.23.0, LOAD-01): a builder, a section that waits in place and its shape.
const shape: WaitingShape = { rows: 3, kind: 'table', frame: false, label: loading.text({ name: 'the machines' }) };
const framed: HTMLElement = waiting();
const counted: HTMLElement = waiting(2);
const section = new Section({ title: 'Recent', waiting: true });
section.wait(shape);
section.children = [framed, counted];
// @ts-expect-error a wait's kind is one of the skeleton's shapes
waiting({ kind: 'cards' });
