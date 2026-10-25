// The clear page of the React consumers, in Spanish under StrictMode (0.36.0): the family bar beside the
// Sidebar (merged with the bar with `?merged=1`) or over a ProductNav (`?nav=row`), and a machine's Settings
// whose two rows of tabs hold more than a phone shows, with long sections an address points at.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { StrictMode, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { FamilyBar, Sidebar, ProductNav, Page, PageHeader, Tabs, Section, Status, Button } from '@beyond-js/ui/react';
import { chosen, fallback, product } from '../data/family.js';
import { shape, words, entries } from '../data/clear.js';
import { es } from './labels.js';

const text = words.es;
window.fixture = { ready: false };

function View() {
	// Each part's heading is focused by code after a navigation, as a product's own place does
	useLayoutEffect(() => {
		for (const heading of document.querySelectorAll('.clear-part .bui-section-title')) heading.tabIndex = -1;
	}, []);
	const places = entries(text.places, text.place, key => `#/${key}`);
	const areas = <Tabs name={text.title} items={entries(text.areas, text.area, key => `#/machines/web-1/${key}`)} labels={Tabs.labels.es} />;
	const header = <PageHeader title={text.title} crumbs={[{ label: text.machines, href: '#/machines' }]} status={<Status label={text.ready} tone="success" />} tabs={areas} compact={shape.compact ? { actions: <Button label={text.restart} small /> } : null} />;
	return (
		<>
			<FamilyBar product={product} brand={{ src: '../brand/wordmark.svg', href: '/projects/' }} descriptor={chosen()} fallback={fallback} labels={es.family} account={{ signout: () => {} }} />
			<div className={shape.nav === 'row' ? 'bui-stack' : 'bui-shell'}>
				{shape.nav === 'row' ? <ProductNav items={places} labels={ProductNav.labels.es} /> : <Sidebar product={text.product} groups={[{ heading: null, items: places }]} context={text.project} merge={shape.merged} labels={Sidebar.labels.es} />}
				<main id="main">
					<Page template="settings" header={header}>
						<Tabs name={text.manage} items={entries(text.settings, shape.at)} labels={Tabs.labels.es} />
						{text.parts.map(([id, title, paragraphs]) => (
							<div key={id} id={id} className="clear-part">
								<Section title={title}>
									{paragraphs.map((words, index) => (
										<p key={index} className="bui-reading">
											{words}
										</p>
									))}
								</Section>
							</div>
						))}
					</Page>
				</main>
			</div>
		</>
	);
}

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<View />
	</StrictMode>
);
window.fixture.ready = true;
