import { Recovery, useRecovery, Picker, EmptyState, ChangeOutcome } from '@beyond-js/ui/react';

// The React forms of 0.33.0: a local notice, a picker joining it, a cell's outage and a change's outcome.
export function Joined() {
	const shared = useRecovery({ title: 'Beyond Projects did not answer', local: false });
	return (
		<>
			<Recovery notice={shared} local />
			<Picker label="Repositories" source={async () => ({ items: [] })} recovery={shared} outage={() => true} details={() => ({ request: 'req_1' })} />
			<p><EmptyState kind="outage" inline /></p>
			<ChangeOutcome outcome="unknown" cause="Conduict did not answer" check={{ label: 'Check the machine', onSelect: () => undefined }} labels={ChangeOutcome.labels.es} />
			<ChangeOutcome outcome="unavailable" cause="Beyond CDN did not answer" onAgain={async () => undefined} />
		</>
	);
}
