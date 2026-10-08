// 0.11.0: a typed plain DOM consumer of Facts, Meter, ChoiceChip, the composer's settings, state line,
// attachments and suggestions, the thread tier, the panel's head and wide form, the compact header and
// the sidebar's ages and counts.
import { Facts, Meter, ChoiceChip, ChoiceMenu, Composer, Page, PageHeader, Sidebar, Button, Clock, status } from '@beyond-js/ui';
import type { ComposerAttachment, ComposerMessage, ComposerSuggestion, FactsRow, MeterLevel, SidebarEntries } from '@beyond-js/ui';

const copy = new Button({ label: 'Copy', variant: 'quiet' });
const rows: FactsRow[] = [{ key: 'branch', label: 'Branch', value: 'conduict/fix', mono: true, action: copy }, { label: 'State', value: 'Stopped', stale: 'Not reported since 23:10' }];
const facts = new Facts({ head: { title: 'Changes', value: '3 files · +52 −3', state: ['Not pushed', 'warning'] }, rows });
facts.rows = [];
facts.head = null;
// @ts-expect-error a state's tone is one of the family's
void new Facts({ head: { state: ['Open', 'purple'] } });

const meter = new Meter({ label: '5-hour window', value: 0.42, reset: Date.now() + 3_600_000, clock: new Clock(), locale: 'en', labels: Meter.labels.es });
meter.update({ stale: '23:10', thresholds: { warning: 0.7, danger: 0.9 } });
const level: MeterLevel = meter.level;
// @ts-expect-error a meter is named by its label
void new Meter({ value: 0.5 });

const model = new ChoiceChip({ label: 'Model', options: [{ value: 'opus', label: 'Opus 5.5', detail: 'The most capable', status: ['Default', 'neutral'] }], value: 'opus', state: ['Needs a sign-in', 'warning'] });
model.state = null;
const menu: ChoiceMenu = model;

const attachments: ComposerAttachment[] = [{ key: 'a', name: 'a.png', size: 1200, state: 'uploading', progress: 0.4 }];
const files: ComposerSuggestion[] = [{ value: '@src/a.js', label: 'src/a.js', mono: true }];
const composer = new Composer({
	label: 'Message to Claude Code',
	status: { text: 'My first VM is stopped', action: { label: 'Start', run: () => undefined } },
	settings: [model],
	attach: { accept: 'image/*', onfiles: (picked, via) => void [picked.length, via], onremove: item => void item.key, onretry: item => void item.key },
	attachments,
	onsuggest: async (query, signal) => (signal.aborted ? [] : files.filter(item => item.value.includes(query))),
	suggest: { trigger: '@', bound: 8000, delay: 120, label: 'Files' },
	locale: 'en',
	onsubmit: async (message: ComposerMessage) => message.attachments?.length ?? message.text.length
});
composer.attachments = [];
composer.settings = [];
composer.attach();
const open: boolean = composer.suggestions?.open ?? false;
// @ts-expect-error a chip's state is one of three
composer.attachments = [{ key: 'b', name: 'b', state: 'sent' }];

const header = new PageHeader({ title: 'Fix the redirect', status: status('Working', 'progress'), compact: { actions: [new Button({ label: 'Create pull request' })] } });
const bar: HTMLElement | null = header.bar;
header.measure();
const page = new Page({ width: 'thread', header, aside: [facts.element], label: 'Details', panel: { cut: '73rem', title: 'Details', head: true, wide: false, labels: { hide: 'Hide {title}' } } });
if (page.panel) page.panel.wide = true;
// @ts-expect-error a width tier the family has
void new Page({ width: 'chat' });

const recent: SidebarEntries = { kind: 'entries', key: 'recent', heading: 'Recent', count: 12, items: [{ key: 'c1', label: 'Fix', href: '#/c1', age: Date.now() }, { key: 'c2', label: 'Tidy', href: '#/c2', age: { label: '2 h', title: 'Today at 08:00' } }] };
void new Sidebar({ product: 'Conduict', groups: [recent] });

export { level, menu, open, bar };
