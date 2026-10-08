// 0.10.0: a typed plain DOM consumer of the conversation pieces, the Sidebar's entries and search, the Page's panel and Steps without a region.
import { Composer, LiveText, ActivityRow, ActivityGroup, Sidebar, Page, PagePanel, Steps, Clock, icon } from '@beyond-js/ui';
import type { ActivityState, ComposerMessage, SidebarEntries, SidebarSearchOptions } from '@beyond-js/ui';

const composer = new Composer({
	label: 'Message to Claude Code',
	placeholder: 'Message Claude Code…',
	actions: [{ id: 'start', label: 'Start and send', primary: true }, { id: 'wait', label: 'Send without starting' }],
	stop: { label: 'Interrupt', run: async () => undefined },
	disabled: { reason: 'Only an owner or admin can start web.' },
	submit: 'enter',
	onsubmit: async (message: ComposerMessage) => message.text.length,
	explain: error => (error instanceof Error ? error.message : null),
	labels: Composer.labels.es
});
composer.status = 'web is stopped.';
composer.tools = [document.createElement('button')];
composer.disabled = null;
composer.busy = false;
const sent: Promise<boolean> = composer.submit('wait');
const sending: boolean = composer.sending;
// @ts-expect-error submit is enter or mod
void new Composer({ label: 'x', onsubmit: async () => undefined, submit: 'shift' });

const live = new LiveText({ render: text => document.createTextNode(text), labels: LiveText.labels.es });
live.append('Hel');
live.set('Hello');
live.settle();
live.abandon('Interrupted · not kept');
const state: 'live' | 'settled' | 'abandoned' = live.state;

const clock = new Clock();
const row = new ActivityRow({ glyph: 'terminal', title: 'Running npm test', state: 'running', since: Date.now(), tail: 'PASS a.test.js', body: () => [{ label: 'Input', text: 'npm test' }, { label: 'Diff', content: document.createElement('div') }, 'Exit 0'], clock });
row.update({ state: 'done', until: Date.now(), meta: 'exit 0', tail: null });
const finished: ActivityState = row.state;
// @ts-expect-error a row's state is one of the five
row.update({ state: 'stopped' });
// @ts-expect-error a glyph comes from the catalog
void new ActivityRow({ glyph: 'trash', title: 'x' });
const group = new ActivityGroup({ glyph: 'file', title: count => `Read ${count} files`, rows: [row] });
group.add(new ActivityRow({ glyph: 'file', title: 'Read b.js' }));
void [group.state, group.remove(row), icon('file'), icon('terminal')];

const recent: SidebarEntries = { kind: 'entries', key: 'recent', heading: 'Recent', items: [{ key: 'c1', label: 'Fix the checkout', href: '#/c1', current: true, mark: { label: 'Needs you', tone: 'warning' } }], more: { label: 'All conversations', href: '#/conversations' } };
const search: SidebarSearchOptions = { label: 'Search conversations', source: async ({ query, signal }) => (signal.aborted ? [] : [{ key: query, label: query, href: '#/x' }]), all: query => `#/conversations?q=${query}` };
const sidebar = new Sidebar({ product: 'Conduict', groups: [{ items: [{ label: 'Overview', href: '#/o' }] }, recent], action: { label: 'New conversation', href: '#/new' }, search });
sidebar.groups = [recent];
sidebar.action = null;
sidebar.search = null;

const page = new Page({ aside: [document.createElement('section')], label: 'Conversation details', panel: { cut: '73rem', open: true, onchange: shown => void shown, title: 'Details' } });
const panel: PagePanel | null = page.panel;
const release: (() => void) | undefined = panel?.control(document.createElement('button'));
panel?.open();
const mode: 'beside' | 'sheet' | null = panel?.mode ?? null;
void new Steps({ label: 'Plan', steps: [], announce: false });
void [sent, sending, state, finished, release, mode];
