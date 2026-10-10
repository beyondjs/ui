/** Declarations of 0.14.0 in React: the thread template's dock, the Sidebar's objects and shortcut, the composer's edges, ActionLine. */
import { Page, Sidebar, Composer, ActionLine, Facts, RailItem, Diff, Highlighter } from '@beyond-js/ui/react';

export const view = (
	<Page template="thread" dock={<Composer label="Message" onSubmit={() => undefined} tray={<button type="button">web · Ready</button>} commands={[{ value: '/model', run: () => undefined }]} recall={() => null} dictation={{ transcribe: async () => ({ text: '' }) }} />}>
		<Sidebar product="Conduict" shortcut groups={[{ kind: 'object', heading: 'Conversations', action: { label: 'New', href: '#/new' }, groups: [] }]} />
		<ActionLine facts={['42 s', '$0.08']} label="Answer actions">
			<button type="button">Copy</button>
		</ActionLine>
		<Facts rows={[{ label: 'Files', value: 3, numeric: true }]} />
		<RailItem wide>
			<pre>{Highlighter.language('ts')}</pre>
		</RailItem>
		<Diff files={[{ path: 'a.ts' }]} highlight />
	</Page>
);
