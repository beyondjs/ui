/** Declarations of 0.12.0's rail and exchange, as a DOM consumer uses them. */
import { Rail, RailItem, RailMoment, ActivityRow } from '@beyond-js/ui';

const rail = new Rail({ element: document.createElement('div'), label: 'Work of this turn' });
const item = new RailItem({ glyph: 'clock', tone: 'neutral', content: 'Thought for 9 s' });
item.update({ tone: 'progress' }).update({ glyph: null, content: document.createElement('p') });
rail.element.append(item.element, new RailMoment({ text: '10:51', datetime: '2026-10-09T10:51:00Z' }).element);
const tone: 'danger' | 'neutral' | 'success' | 'info' | 'progress' | 'warning' = Rail.tone('danger');
void tone;
void item.body;
void new ActivityRow({ glyph: 'terminal', title: 'Ran ls', body: () => [{ exchange: [{ label: 'In', text: 'ls' }, { label: 'Out', text: 'a.js' }] }] });
// @ts-expect-error a tone the rail does not know
void new RailItem({ tone: 'purple' });
