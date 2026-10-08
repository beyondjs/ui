// 0.11.2 in React: the Composer's summary and drop surface, CopyButton, Bytes and a long Facts row.
import { useRef } from 'react';
import { Bytes, Composer, CopyButton, Facts } from '@beyond-js/ui/react';

export function Dock() {
	const surface = useRef<HTMLElement>(null);
	return (
		<main ref={surface}>
			<Composer label="Message" summary="Opus 5.5" attach={{ onFiles: () => undefined, zone: surface }} onSubmit={async () => undefined} />
			<CopyButton text="https://example.test/c/1" label="Copy link" onResult={copied => void copied} labels={CopyButton.labels.es} />
			<Facts rows={[{ key: 'sandbox', label: 'Sandbox', value: 'Not checked on lab yet', long: true }]} />
			<span>{new Bytes().of(99)}</span>
		</main>
	);
}
