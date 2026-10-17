import { CommandPalette, ChoiceCards, Primaries, Composer, Sidebar, FamilyBar, CommandCard, type PaletteSource, type CommandAnswer } from '@beyond-js/ui';

const machines: PaletteSource = { key: 'machines', label: 'Machines', empty: true, search: async (query, { signal }) => (signal.aborted ? [] : [{ id: 'm1', label: `web ${query}`, href: '/machines/web', glyph: 'box', keys: 'G M' }]) };
const palette = new CommandPalette({ sources: [machines], recent: { key: 'conduict', limit: 5 }, shortcut: true, onnavigate: (item, event) => [item.href, event.type] });
palette.open('we');
const shown: string = palette.keys.text;
const cards = new ChoiceCards({ label: 'Size', options: [{ value: 'small', title: 'Small', facts: ['2 cores', '4 GB'], status: ['Default', 'info'] }, { value: 'large', title: 'Large', disabled: true, reason: 'Not open to developers' }], value: 'small', onchange: (value: string) => value });
const primaries = new Primaries({ root: document.body, warn: (message, region) => [message, region] });
const found: number = primaries.check().length;
const composer = new Composer({ label: 'Message', onsubmit: async () => undefined, step: { label: 'Choose a machine and send', run: ({ text }) => text.length > 0 } });
composer.step = null;
const bar = new FamilyBar({ product: 'conduict', brand: { src: '/w.svg', href: '/' } });
const sidebar = new Sidebar({ product: 'Conduict', groups: [] });
sidebar.merge(bar);
const card = new CommandCard({ title: 'Run?', command: 'ls', editable: true, decisions: [{ value: 'once', label: 'Allow once', kind: 'allow' }, { value: 'conversation', label: 'Allow for this conversation', kind: 'allow' }, { value: 'deny', label: 'Deny with a note', kind: 'deny', note: { placeholder: 'What should it do instead?' } }], ondecide: (answer: CommandAnswer) => answer.note });
export { shown, cards, found, card, FamilyBar };
