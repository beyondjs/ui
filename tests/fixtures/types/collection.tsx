import { useRef } from 'react';
import { Collection, CollectionTools, Differ, Period, useCollectionTools, type CollectionPeriodFilter } from '@beyond-js/ui/react';

// 0.44.0: one set of tools for a graph and a table, a toolbar drawn where it is rendered, and an empty list's action.
const period: CollectionPeriodFilter & { label: string } = { name: 'period', label: 'Period', kind: 'period', months: 2 };

export function Composition({ state, go }: { state: { query: string; filters: Record<string, string> }; go: (next: { query: string; filters: Record<string, string> }) => void }) {
	const tools = useCollectionTools({ label: 'Packages', filters: [{ name: 'kind', label: 'Kind', options: [{ value: 'widget', label: 'Widget' }] }, period], state, onChange: go, compact: false, delay: 150 });
	const range = Period.range(tools.state.filters.period);
	tools.tools?.focus();
	return <div ref={tools.ref} data-from={range?.start.toISOString()} />;
}

export function Header() {
	const handle = useRef<{ focus(): void }>(null);
	return <CollectionTools ref={handle} label="Usage" search={false} filters={[period]} labels={CollectionTools.labels.es} onChange={state => handle.current?.focus() ?? state.query} />;
}

export function Requests({ create }: { create: () => void }) {
	return (
		<>
			<Collection label="Requests" columns={[{ key: 'title', label: 'Request' }]} source={async () => ({ rows: [] })} empty={{ title: 'No requests yet', action: { label: 'New request', onSelect: () => create() } }} />
			<Collection label="Applications" columns={[]} source={async () => ({ rows: [] })} empty={{ title: 'No applications yet', action: <button onClick={create}>Register application</button> }} />
			<Collection label="Usage" columns={[]} source={async () => ({ rows: [] })} filters={[period]} />
			<Collection<{ area: string }> label="Requests" presentation="list" columns={[{ key: 'area', label: 'Area' }]} source={async () => ({ rows: [] })} row={(row, { differ }) => ({ meta: differ.in((each: { area: string }) => each.area) ? [row.area] : [] })} />
		</>
	);
}

// @ts-expect-error The tools need the list's name.
const nameless = <CollectionTools filters={[period]} />;
// @ts-expect-error The React empty action takes onSelect, the DOM's run is not a prop here.
const wrong = <Collection label="x" columns={[]} source={async () => ({ rows: [] })} empty={{ title: 'x', action: { label: 'x', run: () => {} } }} />;
void [nameless, wrong, Differ.of([1, 2], value => value)];
