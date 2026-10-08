// 0.11.1 in React: useHint, Age and Hint re-exported, the Composer's compact and a cut list from onSuggest.
import { Age, Composer, Hint, useHint } from '@beyond-js/ui/react';
import type { AgeWords } from '@beyond-js/ui/react';

export function Toolbar() {
	const ref = useHint<HTMLDivElement>();
	const said: AgeWords | null = new Age().of(Date.now());
	void Hint;
	return (
		<div ref={ref}>
			<button type="button" className="bui-icon-button" aria-label="Copy link" data-bui-hint />
			<time dateTime={said?.datetime}>{said?.label}</time>
			<Composer label="Message" compact={false} onSuggest={async () => ({ items: [{ value: '@a' }], total: 9 })} onSubmit={async () => undefined} />
		</div>
	);
}
