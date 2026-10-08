// 0.10.0 in React: the conversation pieces, the Sidebar's entries and search, the Page's panel with PanelToggle.
import { useRef } from 'react';
import { Composer, LiveText, ActivityRow, ActivityGroup, Sidebar, Page, PageHeader, PanelToggle, Steps } from '@beyond-js/ui/react';
import type { ComposerHandle, LiveTextHandle, PagePanel } from '@beyond-js/ui/react';

export function Conversation({ draft }: { draft: string }) {
	const composer = useRef<ComposerHandle>(null);
	const live = useRef<LiveTextHandle>(null);
	const panel = useRef<PagePanel | null>(null);
	void [composer.current?.submit('send'), live.current?.append('x'), panel.current?.toggle()];
	return (
		<>
			<Sidebar product="Conduict" groups={[{ kind: 'entries', heading: 'Recent', items: [{ key: 'c1', label: 'Fix', href: '#/c1', mark: { label: 'Failed', tone: 'danger' } }] }]} action={{ label: 'New conversation', href: '#/new' }} search={{ label: 'Search conversations', source: async () => [] }} />
			<Page header={<PageHeader title="Fix the checkout" actions={<PanelToggle label="Details" />} />} aside={<section>Environment</section>} label="Conversation details" panel={{ cut: 1168, onChange: shown => void shown }} panelRef={panel}>
				<LiveText ref={live} text={draft} render={text => <p>{text}</p>} />
				<ActivityRow glyph="terminal" title="Ran npm test" state="done" duration={3000} body={() => <pre>ok</pre>} />
				<ActivityRow glyph="code" title="Edited a.js" body={[{ label: 'Diff', text: '-a\n+b' }]} />
				<ActivityGroup glyph="file" title={count => `Read ${count} files`} rows={[{ key: 'a', glyph: 'file', title: 'Read a.js' }]} />
				<Steps label="Plan" steps={[]} announce={false} />
				<Composer ref={composer} label="Message to Claude Code" status={<a href="#/connect">Connect</a>} tools={<button>web</button>} actions={[{ id: 'send', label: 'Send' }]} stop={{ label: 'Interrupt', onSelect: () => undefined }} onSubmit={async ({ text }) => text} labels={Composer.labels.es} />
			</Page>
		</>
	);
}
// @ts-expect-error a row's title is text in React
export const wrong = <ActivityRow title={<b>x</b>} />;
