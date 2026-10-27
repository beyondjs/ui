import { Recovery, useRecovery, Picker, EmptyState, ChangeOutcome, TechnicalDetails, FamilyBar, useAgain, AgainLine } from '@beyond-js/ui/react';

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
			{/* 0.44.0: a record's evidence in Spanish, inline */}
			<ChangeOutcome outcome="unavailable" cause="Beyond CDN no respondió" details={{ request: 'req_2', locale: 'es', labels: TechnicalDetails.labels.es }} labels={ChangeOutcome.labels.es} />
		</>
	);
}

// 0.44.0: the family bar's notice says an outage with useAgain's moments
export function Bar() {
	const again = useAgain(true, async () => undefined);
	return <FamilyBar product="delegate" brand={{ src: '/brand.svg', href: '/' }} notice={{ text: 'Beyond Projects did not answer.', action: { label: 'Try again', onSelect: () => void again.now() }, outage: { moments: again, locale: 'es', labels: AgainLine.labels.es } }} />;
}
