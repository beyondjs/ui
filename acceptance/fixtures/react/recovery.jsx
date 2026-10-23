// The 0.24.0 page of the React consumers (D163): the same Home as the DOM page, drawn with React's
// Recovery from props, Section's `unavailable` and `updated`. `?whole=1`: nothing on the page could be
// read, so the notice is its body. window.fixture answers the reads.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Page, PageHeader, Section, Recovery, RetryAction, AgainLine, TechnicalDetails, EmptyState, LastUpdate } from '@beyond-js/ui/react';
import { words as copy, shape } from '../data/recovery.js';

const { language, whole } = shape();
const words = copy[language];
const spanish = language === 'es';
document.documentElement.lang = language;
const read = { tries: 0, answer: false };
const labels = spanish ? { ...RetryAction.labels.es, ...AgainLine.labels.es, ...TechnicalDetails.labels.es } : {};
const outage = spanish ? { labels: EmptyState.labels.es } : true;
const kept = { time: Date.now() - 4 * 60_000, locale: language, labels: spanish ? LastUpdate.labels.es : {} };
const said = Date.now() - 2000;

function Home() {
	const [down, setDown] = useState(true);
	window.fixture = { read, ready: true };
	const run = async () => {
		read.tries += 1;
		if (read.answer) setDown(false);
	};
	const reads = down ? words.reads.map(([key, title]) => ({ key, title, details: { request: `req_${key}_7Hq2`, time: said, text: words.said }, run })) : [];
	return (
		<Page template="overview" width="fluid" header={<PageHeader title={words.title} facts={words.project} />}>
			<Recovery title={words.cause} reads={reads} whole={whole} labels={labels} locale={language} />
			{whole ? null : (
				<>
					<Section title={words.machines} unavailable={down ? outage : null}>
						<p id="answered">{words.answered}</p>
					</Section>
					<Section title={words.work} unavailable={outage} />
					<Section title={words.attention} updated={kept}>
						<ul className="recovery-kept">
							{words.kept.map(text => (
								<li key={text}>{text}</li>
							))}
						</ul>
					</Section>
				</>
			)}
		</Page>
	);
}

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<Home />
	</StrictMode>
);
