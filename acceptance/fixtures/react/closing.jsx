// The 0.33.0 page of the React consumers (D163, D186): the DOM page's outage drawn with React's Recovery
// from useRecovery, DataTable cells with EmptyState's inline place, a joined Picker and ChangeOutcome.
// `?inbox=1`: the inbox's outage in the page form. window.fixture answers the reads.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Page, PageHeader, Section, Recovery, useRecovery, DataTable, EmptyState, Picker, ChangeOutcome, NotificationInbox } from '@beyond-js/ui/react';
import { words, shape, Reads } from '../data/closing.js';

const read = new Reads();
const outage = error => error?.outage === true;
const details = error => ({ request: error.request, time: Date.now(), text: error.message });
const columns = [{ key: 'name', label: words.name, primary: true }, { key: 'work', label: words.work, render: () => <EmptyState kind="outage" inline /> }];

function Projects() {
	const notice = useRecovery({ title: words.cause, focus: () => document.querySelector('h1') });
	const [renamed, setRenamed] = useState(false);
	window.fixture = { read, recovery: notice, ready: true };
	const reads = [{ key: 'work', title: words.work, details: { request: 'req_work_7Hq2', time: Date.now(), text: 'Beyond Projects is unavailable (UNAVAILABLE)' }, run: async () => read.answer }];
	return (
		<Page template="overview" width="fluid" header={<PageHeader title={words.title} />}>
			<Recovery notice={notice} reads={reads} />
			<Section title={words.title}>
				<DataTable label={words.title} columns={columns} rows={words.projects} search={false} />
			</Section>
			<Section title={words.repositories}>
				<Picker label={words.repositories} source={read.source} delay={0} recovery={notice} outage={outage} details={details} />
			</Section>
			<Section title={words.rename}>
				<form className="closing-form" onSubmit={event => (event.preventDefault(), setRenamed(true))}>
					<label className="bui-field-label" htmlFor="closing-name">{words.field}</label>
					<input id="closing-name" className="bui-input" name="name" defaultValue="Atlas" />
					<button type="submit" className="bui-button bui-button-primary">{words.rename}</button>
					{renamed ? <ChangeOutcome outcome="unavailable" cause={words.cause} /> : null}
				</form>
			</Section>
		</Page>
	);
}

function Inbox() {
	window.fixture = { read, ready: true };
	return (
		<Page template="overview" width="fluid" header={<PageHeader title="Notifications" />}>
			<NotificationInbox adapter={read.adapter} locale="en" />
		</Page>
	);
}

createRoot(document.getElementById('root')).render(<StrictMode>{shape().inbox ? <Inbox /> : <Projects />}</StrictMode>);
