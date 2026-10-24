// The insets page of the React consumers (D184), in Spanish through the components' `labels.es`: the boxes
// no other fixture page draws, each in a block of its own named by its id, as the DOM page draws them, and
// a toast with a detail shown by window.fixture.toast().
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Callout, Button, EmptyState, Checklist, Section, Field, Unavailable, TechnicalDetails, useToaster } from '@beyond-js/ui/react';
import { words } from '../data/insets.js';

const copy = words.es;
const time = Date.now() - 60_000;

function App() {
	const toaster = useToaster(useToaster.labels.es);
	window.fixture.toast = () => toaster.show(copy.toast.title, { detail: copy.toast.detail, duration: 600_000 });
	return (
		<main className="insets-page">
			<div id="callout-actions">
				<Callout tone="info" title={copy.info.title} body={copy.info.body} actions={<><Button label={copy.info.action} variant="secondary" /><Button label={copy.info.other} variant="quiet" /></>} />
			</div>
			<div id="callout-text">
				<Callout tone="warning" title={copy.warning.title} body={copy.warning.body} />
			</div>
			<div id="callout-details">
				<Callout tone="danger" title={copy.danger.title} body={copy.danger.body} details={{ ...copy.danger.details, time, labels: TechnicalDetails.labels.es }} />
			</div>
			<div id="empty">
				<EmptyState kind="empty" title={copy.empty.title} text={copy.empty.text} action={{ label: copy.empty.action, onSelect: () => {} }} labels={EmptyState.labels.es} />
			</div>
			<div id="checklist">
				<Checklist title={copy.checklist.title} steps={copy.checklist.steps.map(step => (step.action ? { ...step, action: { ...step.action, onSelect: () => {} } } : step))} labels={Checklist.labels.es} />
			</div>
			<div id="section">
				<Section title={copy.section.title} raised>
					<p>{copy.section.text}</p>
				</Section>
			</div>
			<div id="notes">
				<Field label={copy.notes.label}>
					<textarea defaultValue={copy.notes.value} />
				</Field>
			</div>
			<div id="refusal">
				<Unavailable title={copy.refusal.title} reason={copy.refusal.reason} owner={copy.refusal.owner} labels={Unavailable.labels.es} />
			</div>
		</main>
	);
}

const root = createRoot(document.getElementById('root'));
window.fixture = { destroy: () => root.unmount(), ready: false };
root.render(<StrictMode><App /></StrictMode>);
window.fixture.ready = true;
