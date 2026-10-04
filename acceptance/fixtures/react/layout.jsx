// The page system of the React consumers, in Spanish: the family bar with "Idioma y apariencia", the
// Sidebar (or ProductNav) and one Page whose template, width, side panel and arrival line the address chooses.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { FamilyBar, Sidebar, ProductNav, Page, PageHeader, Tabs, Section, Arrival as Line, Button, Status, Preferences } from '@beyond-js/ui/react';
import { Arrival as Words } from '@beyond-js/ui';
import { chosen, fallback, product } from '../data/family.js';
import { shape, words, groups } from '../data/layout.js';
import { es } from './labels.js';

const preferences = new Preferences({ key: 'beyond-layout', fallback: { appearance: 'system', locale: 'es' }, storage: null });
window.fixture = { preferences, ready: false };

function View() {
	const header = <PageHeader title={words.title} crumbs={[{ label: 'Entornos', href: '#/environments' }]} status={<Status label="Listo" tone="success" />} facts={words.facts} actions={<><Button label="Empezar una conversación" variant="primary" /><Button label="Detener el entorno" /><Button label="Más acciones" /></>} tabs={<Tabs items={['Resumen', 'Conversaciones', 'Repositorios', 'Motores de IA', 'Acceso', 'Ejecución'].map((label, index) => ({ label, href: `#${index}`, current: index === 0 }))} />} />;
	const aside = shape.aside ? (
		<>
			<h2>Acerca de</h2>
			<ul>{words.facts2.map(fact => <li key={fact}>{fact}</li>)}</ul>
		</>
	) : null;
	return (
		<>
			<FamilyBar product={product} brand={{ src: '../brand/wordmark.svg', href: '/projects/' }} descriptor={chosen()} fallback={fallback} labels={es.family} account={{ signout: () => {}, preferences: { preferences, everywhere: 'https://accounts.example.test/account' } }} />
			<div className={shape.nav === 'sidebar' ? 'bui-shell' : 'bui-stack'}>
				{shape.nav === 'sidebar' ? <Sidebar product="Conduict" groups={groups} context={{ label: 'Proyecto', name: 'Storefront' }} /> : <ProductNav items={groups[0].items} />}
				<main id="main">
					<Page template={shape.template} width={shape.width} arrival={shape.arrival ? <Line product="Conduict" href="#/back" onDismiss={() => {}} labels={Words.labels.es} /> : null} header={header} aside={aside} label="Acerca de este entorno">
						<Section title="Repositorios" description={words.description} actions={<Button label="Añadir un repositorio" />}>
							<ul>{words.rows.map(row => <li key={row}>{row}</li>)}</ul>
						</Section>
						<Section title="Acceso">
							<p className="bui-reading">{words.description}</p>
						</Section>
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
