/** Declarations of 0.14.0 for a plain DOM consumer: the thread template's dock, the Sidebar's objects, the composer's edges, ActionLine, Highlighter, Facts' numbers. */
import { Page, PageDock, Sidebar, Composer, ComposerDictation, ActionLine, Highlighter, Facts, RailItem, Diff, Button } from '@beyond-js/ui';

const composer = new Composer({
	label: 'Message to Claude Code',
	onsubmit: async () => undefined,
	tray: [new Button({ label: 'web · Ready' })],
	commands: [{ value: '/model', label: 'Change the model', run: ({ value }) => console.log(value) }, { value: '/review' }],
	recall: () => 'Also add a test',
	dictation: { transcribe: async (blob, { signal, type, seconds }) => ({ text: `${blob.size} ${type} ${seconds} ${signal.aborted}` }), cap: 120, minimum: 1, explain: error => (error instanceof Error ? { text: error.message, retry: true } : null) }
});
composer.tray = null;
const state: string | undefined = composer.dictation?.state;
const expanded: boolean = composer.editor.expanded;
const page = new Page({ template: 'thread', dock: composer, children: [] });
const dock: PageDock | null = page.dock;
page.dock = [composer];
const sidebar = new Sidebar({
	product: 'Conduict',
	shortcut: true,
	groups: [
		{ items: [{ label: 'Overview', href: '#/overview' }] },
		{ kind: 'object', key: 'conversations', heading: 'Conversations', action: { label: 'New', href: '#/new', row: true }, search: { label: 'Search conversations', source: async () => [] }, groups: [{ kind: 'entries', key: 'needs', heading: 'Needs you', attention: true, items: [] }, { kind: 'entries', heading: 'Recent', fold: false, items: [] }], more: { label: 'All conversations', href: '#/conversations' } }
	]
});
sidebar.shortcut = false;
const opened: boolean = sidebar.seek();
const folded: boolean = sidebar.folds.folded('needs');
const line = new ActionLine({ actions: [new Button({ label: 'Copy', variant: 'quiet' })], facts: ['42 s', '$0.08'], label: 'Answer actions' });
const highlighter = new Highlighter(Highlighter.from('src/a.ts'));
const code = highlighter.fill(document.createElement('code'), 'const a = 1;');
const kinds = highlighter.tokens('x').map(token => token.kind);
const facts = new Facts({ rows: [{ label: 'Files', value: 3 }, { label: 'Cost', value: '$0.08', numeric: true }] });
const numeric: boolean = Facts.numeric({ label: 'Files', value: 3 });
const item = new RailItem({ wide: true });
const diff = new Diff({ files: [{ path: 'a.py', language: 'python' }], highlight: false });
const labels = ComposerDictation.labels.es;
export { state, expanded, dock, opened, folded, line, code, kinds, facts, numeric, item, diff, labels };
