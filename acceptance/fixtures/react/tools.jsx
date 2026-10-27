// The tools page of the React consumers, in Spanish under StrictMode (0.44.0): <CollectionTools> in the page
// header with a period filter, its one state driving two views of the same records (a list and a table, as
// Packages' composition draws a graph and a table), and a Collection whose empty state holds the section's
// own action as React content (`?empty=1`). window.fixture logs the tools' changes and the action's presses.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { StrictMode, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Collection, CollectionTools, ListRow, Page, PageHeader, Section } from '@beyond-js/ui/react';
import { clock, chosen, shape, words } from '../data/tools.js';

const text = words.es;
window.fixture = { changes: [], pressed: [], ready: false };

function View() {
	const [state, setState] = useState({ query: '', filters: {} });
	const handle = useRef(null);
	window.fixture.focus = () => handle.current?.focus();
	const rows = chosen(state);
	const filters = [{ name: 'period', label: text.period, kind: 'period', now: clock }, { name: 'kind', label: text.kind, options: text.kinds }];
	const tools = <CollectionTools ref={handle} label={text.title} filters={filters} labels={CollectionTools.labels.es} state={state} onChange={next => (window.fixture.changes.push(next), setState(next))} />;
	const register = <Button variant="primary" label={text.register} onClick={() => window.fixture.pressed.push(text.register)} />;
	return (
		<Page header={<PageHeader title={text.title} actions={tools} />}>
			<Section title={text.graph}>
				<ul className="bui-rows" data-view="graph">{rows.map(row => <ListRow key={row.id} title={row.name} facts={[row.amount]} />)}</ul>
			</Section>
			<Section title={text.table}>
				<ul className="bui-rows" data-view="table">{rows.map(row => <ListRow key={row.id} title={row.name} meta={[row.kind]} />)}</ul>
			</Section>
			{shape.empty && (
				<Section title={text.empty}>
					<Collection label={text.title} columns={[{ key: 'name', label: text.title, primary: true }]} source={async () => ({ rows: [], total: 0 })} labels={Collection.labels.es} empty={{ title: text.empty, body: text.body, action: register }} />
				</Section>
			)}
		</Page>
	);
}

createRoot(document.getElementById('root')).render(<StrictMode><View /></StrictMode>);
window.fixture.ready = true;
