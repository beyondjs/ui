// 0.11.2 in React: Diff with a patch or files, Spanish copy and the parser on the component.
import { Diff } from '@beyond-js/ui/react';
import type { DiffFile } from '@beyond-js/ui/react';

export function Changes({ patch, files }: { patch: string | null; files: DiffFile[] }) {
	const count = Diff.parse(patch ?? '').length;
	return (
		<>
			<Diff patch={patch} label={`Changes · ${count}`} level={2} open="all" summary={false} labels={Diff.labels.es} locale="es" />
			<Diff files={files} />
			{/* @ts-expect-error a level is 2, 3 or 4 */}
			<Diff files={files} level={5} />
		</>
	);
}
