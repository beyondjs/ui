// The 0.16.0 page of the React consumers (Spanish copy): the same parts as the DOM page, through the adapter.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FamilyBar, Sidebar, CommandPalette, ChoiceCards, Composer, CommandCard, Section, Button, Primaries } from '@beyond-js/ui/react';
import { chosen, fallback, product } from '../data/family.js';
import { sizes, sources, decisions } from '../data/wave.js';

const log = [];

function App() {
	const [needed, setNeeded] = useState(true);
	return (
		<>
			<FamilyBar product={product} brand={{ src: '../brand/wordmark.svg', href: '/projects/' }} descriptor={chosen()} fallback={fallback} account={{ signout: () => {} }} labels={FamilyBar.labels.es} />
			<div className="bui-shell">
				<Sidebar product="Conduict" merge groups={[{ heading: null, items: [{ label: 'Máquinas', href: '#/machines', current: true }, { label: 'Conversaciones', href: '#/conversations' }] }]} />
				<main className="wave-page" id="main">
					<CommandPalette sources={sources(log)} recent={{ key: 'fixture' }} shortcut delay={0} onNavigate={item => log.push(`palette:${item.href}`)} labels={CommandPalette.labels.es} />
					<ChoiceCards label="Tamaño" options={sizes} value="small" onChange={value => log.push(`size:${value}`)} />
					<Composer label="Mensaje" onSubmit={async message => log.push(`send:${message.text}`)} step={needed ? { label: 'Elegir una máquina y enviar', onSelect: async ({ text }) => (log.push(`step:${text}`), setNeeded(false), true) } : null} />
					<CommandCard title="Claude Code pide ejecutar un comando" command="rm -rf build" decisions={decisions} onDecide={answer => log.push(`decide:${answer.value}:${answer.note ?? ''}`)} labels={CommandCard.labels.es} />
					<Section title="Dos principales">
						<Button label="Uno" variant="primary" />
						<Button label="Dos" variant="primary" />
					</Section>
				</main>
			</div>
		</>
	);
}

createRoot(document.getElementById('root')).render(<App />);
// A development build (the fixture defines NODE_ENV) checks its regions, as a Page does by itself
if (Primaries.enabled) new Primaries({ root: document.getElementById('root') });
window.fixture = { log, ready: true };
