// The 0.44.0 page of the React consumers, in Spanish under StrictMode (LOAD-01, D185): the DOM page's snapshot
// drawn before its reads answer, with `Reserved`, `SectionPart`, `PageHeader`'s `waiting`, an `Arrival` whose
// way back is null and the sidebar's objects waiting. window.fixture.answer() answers every read at once, and
// window.fixture.focus() asks for the title's focus through `headingRef`; `?refused=1` refuses Restore.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { StrictMode, createRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Sidebar, Page, PageHeader, Tabs, Section, SectionPart, Arrival, Button, ChoiceMenu, Reserved } from '@beyond-js/ui/react';
import { Sidebar as Rail, Arrival as Line } from '@beyond-js/ui';
import { words, earlier, projects, refused } from '../data/pending.js';

const copy = words.es;
const log = [];
const heading = createRef();
const objects = state => [{ items: [{ label: copy.home, href: '#/', current: true }] }, { kind: 'object', key: 'projects', heading: copy.projects, action: { label: copy.create, href: '#/new' }, ...state }];

function View() {
	const [read, setRead] = useState(false);
	window.fixture = { log, focus: () => heading.current?.focus({ preventScroll: true }), answer: () => setRead(true), ready: true };
	const restore = <Button label={copy.restore} variant="primary" onClick={() => log.push('restore')} />;
	const actions = read ? (refused ? null : restore) : <Reserved>{restore}</Reserved>;
	const facts = (
		<>
			{`${copy.facts} `}
			<ChoiceMenu label={copy.facts} options={earlier} value={earlier[0].value} labels={ChoiceMenu.labels.es} />
		</>
	);
	const tabs = <Tabs items={[copy.overview, copy.files].map((label, index) => ({ label, href: `#${index}`, current: index === 0 }))} />;
	const header = <PageHeader title={read ? copy.title : null} waiting={!read} headingRef={heading} labels={PageHeader.labels.es} crumbs={[{ label: copy.snapshots, href: '#/snapshots' }]} facts={facts} actions={actions} tabs={tabs} />;
	return (
		<div className="bui-shell">
			<Sidebar product="Beyond Home" labels={Rail.labels.es} groups={objects(read ? { groups: [{ kind: 'entries', key: 'all', items: projects }] } : { waiting: true })} />
			<main id="main">
				<Page template="detail" width="standard" arrival={<Arrival product={copy.from} href={read ? '#/projects/p0' : null} labels={Line.labels.es} />} header={header}>
					<Section title={copy.devices}>
						<div>
							<Button label={copy.away} />
						</div>
						<SectionPart waiting={read ? null : { rows: 2, language: 'es' }}>
							<ul className="bui-rows">
								<li>{copy.device}</li>
							</ul>
						</SectionPart>
					</Section>
					<Section title={copy.history} waiting={read ? null : { rows: 2, language: 'es' }}>
						<p>{copy.change}</p>
					</Section>
				</Page>
			</main>
		</div>
	);
}

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<View />
	</StrictMode>
);
