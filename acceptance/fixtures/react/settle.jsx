// The settling page of the React consumers (0.32.0), in Spanish through the components' own `labels.es`: the
// conversation of the DOM page, its running Codex turn's composer docked in the thread template (`?page=thread`)
// or held in a plain page's section (`?page=plain`), beside the Sidebar under the family bar with a panel kept in
// view from a 73rem region.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { FamilyBar, Sidebar, Page, PageHeader, Section, PanelToggle, Composer, ChoiceChip, Facts } from '@beyond-js/ui/react';
import { chosen, fallback, product } from '../data/family.js';
import { shape, words, groups, models, levels, summary, actions, paragraphs } from '../data/settle.js';
import { es } from './labels.js';

const copy = words.es;
const log = [];
const fixture = { log, ready: false };
window.fixture = fixture;
const entries = [{ label: copy.mention, keys: '@', run: () => log.push('mention') }];

function View() {
	const settings = (
		<>
			<ChoiceChip label={copy.model} options={models} value="sol" labels={ChoiceChip.labels.es} onChange={value => log.push(`model:${value}`)} />
			<ChoiceChip label={copy.autonomy} options={levels(copy)} value="folder" labels={ChoiceChip.labels.es} onChange={value => log.push(`autonomy:${value}`)} />
		</>
	);
	const composer = <Composer label={copy.message} placeholder={copy.placeholder} labels={Composer.labels.es} locale="es" add={entries} settings={settings} summary={summary} actions={actions(copy)} stop={{ label: copy.interrupt, onSelect: () => log.push('interrupt') }} onSubmit={message => log.push(`send:${message.action}:${message.text}`)} />;
	const header = <PageHeader title={copy.title} actions={<PanelToggle label={copy.details} />} />;
	const aside = <Facts head={{ title: copy.changes, value: copy.summary }} rows={[{ key: 'engine', label: copy.engine, value: 'Codex' }]} labels={Facts.labels.es} />;
	const panel = { cut: '73rem', title: copy.details, head: true, labels: { hide: 'Ocultar {title}', close: 'Cerrar' }, onChange: shown => log.push(`panel:${shown}`) };
	const thread = (
		<div className="fixture-thread" id="thread">
			{paragraphs.map(text => (
				<p key={text}>{text}</p>
			))}
		</div>
	);
	return (
		<>
			<FamilyBar product={product} brand={{ src: '../brand/wordmark.svg', href: '/projects/' }} descriptor={chosen()} fallback={fallback} labels={es.family} account={{ signout: () => {} }} />
			<div className="bui-shell">
				<Sidebar product={copy.product} context={{ label: copy.project, name: 'Storefront' }} groups={groups(copy)} labels={Sidebar.labels.es} />
				<main id="main">
					{shape.page === 'plain' ? (
						<Page header={header} aside={aside} label={copy.panel} panel={panel}>
							<Section title={copy.section}>{composer}</Section>
							{thread}
						</Page>
					) : (
						<Page template="thread" header={header} aside={aside} label={copy.panel} panel={panel} dock={composer}>
							{thread}
						</Page>
					)}
				</main>
			</div>
		</>
	);
}

const root = createRoot(document.getElementById('root'));
root.render(
	<StrictMode>
		<View />
	</StrictMode>
);
fixture.destroy = () => root.unmount();
requestAnimationFrame(() => requestAnimationFrame(() => (fixture.ready = true)));
