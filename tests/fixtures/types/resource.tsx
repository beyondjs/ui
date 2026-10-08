// 0.11.0 in React: Facts, Meter, ChoiceChip, the Composer's settings, state line, attachments and suggestions, the compact header and the panel's head.
import { useRef } from 'react';
import { Facts, Meter, ChoiceChip, Composer, Page, PageHeader } from '@beyond-js/ui/react';
import type { ComposerHandle } from '@beyond-js/ui/react';

export function Round({ wide }: { wide: boolean }) {
	const composer = useRef<ComposerHandle>(null);
	void composer.current?.attach();
	const model = <ChoiceChip label="Model" options={[{ value: 'opus', label: 'Opus 5.5' }]} value="opus" state={['Default', 'neutral']} onChange={value => void value} />;
	return (
		<Page width="thread" header={<PageHeader title="Fix the redirect" compact={{ actions: <button>Create pull request</button> }} />} aside={<Facts head={{ title: 'Changes', value: '3 files' }} rows={[{ key: 'branch', label: 'Branch', value: 'conduict/fix', mono: true, action: <button>Copy</button> }]} />} label="Details" panel={{ cut: '73rem', title: 'Details', head: true, wide }}>
			<Meter label="5-hour window" value={0.5} reset="Resets 23:10" />
			<Composer
				ref={composer}
				label="Message to Claude Code"
				settings={model}
				status={{ text: 'My first VM is stopped', action: { label: 'Start', onSelect: () => undefined } }}
				attach={{ onFiles: (files, via) => void [files, via], onRemove: item => void item.key }}
				attachments={[{ key: 'a', name: 'a.png', state: 'ready' }]}
				onSuggest={async query => [{ value: `@${query}` }]}
				suggest={{ trigger: '@' }}
				onSubmit={async ({ text, attachments }) => [text, attachments]}
			/>
			{/* @ts-expect-error a meter is named by its label */}
			<Meter value={0.5} />
		</Page>
	);
}
