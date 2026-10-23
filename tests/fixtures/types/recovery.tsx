import { Recovery, useRecovery, LastUpdate, EmptyState, Section, Collection, TechnicalDetails, type RecoveryRead } from '@beyond-js/ui/react';

// The React forms of 0.24.0 (D163): a notice from props or shared with a list, and the reads' places.
const reads: RecoveryRead[] = [{ key: 'machines', title: 'Machines', details: { request: 'req_1' }, run: () => undefined }];
export const notice = <Recovery title="Beyond Accounts did not answer" reads={reads} whole={false} />;
export function Shared() {
	const shared = useRecovery({ title: 'Beyond Accounts did not answer' });
	return (
		<>
			<Recovery notice={shared} />
			<Collection<{ id: string }> label="Requests" columns={[]} source={async () => ({ rows: [] })} recovery={shared} outage={() => true} details={() => ({ request: 'req_2' })} />
		</>
	);
}
export const places = (
	<>
		<EmptyState kind="outage" />
		<Section title="Machines" unavailable />
		<Section title="Work" updated={{ time: null }}>kept</Section>
		<LastUpdate time="2026-10-23T10:04:05Z" />
		<TechnicalDetails entries={[{ label: 'Machines', request: 'req_1' }]} />
	</>
);
