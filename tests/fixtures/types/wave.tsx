import { useRef } from 'react';
import { CommandPalette, ChoiceCards, Composer, Sidebar, CommandCard, type CommandPaletteHandle } from '@beyond-js/ui/react';

export function Fixture() {
	const palette = useRef<CommandPaletteHandle>(null);
	return (
		<>
			<CommandPalette ref={palette} shortcut recent={{ key: 'conduict' }} sources={[{ key: 'actions', label: 'Actions', empty: true, search: () => [{ id: 'new', label: 'New conversation', run: () => undefined }] }]} />
			<ChoiceCards label="Size" options={[{ value: 'small', title: 'Small' }]} value="small" onChange={value => value} />
			<Composer label="Message" onSubmit={() => undefined} step={{ label: 'Choose a machine and send', onSelect: ({ text }) => text !== '' }} />
			<Sidebar product="Conduict" merge />
			<CommandCard title="Run?" command="ls" decisions={[{ value: 'once', label: 'Allow once', kind: 'allow' }]} onDecide={answer => answer.value} editable />
		</>
	);
}
