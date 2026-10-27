// The 0.15.0 audit page of the React consumers (Spanish copy): the same Floating menus, Status, ListRow,
// DataTable, Tabs, sidebar count and CommandCard as the DOM page, through the adapter.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { createRoot } from 'react-dom/client';
import { FamilyBar, Sidebar, ActionMenu, ChoiceChip, Status, ListRow, DataTable, Tabs, CommandCard } from '@beyond-js/ui/react';
import { chosen, fallback, product } from '../data/family.js';
import { machines, options, tones, command } from '../data/audit.js';

const log = [];
const es = { ListRow: ListRow.labels.es, DataTable: DataTable.labels.es, CommandCard: CommandCard.labels.es };

// A row's menu (0.44.0): a busy machine has no action, so its row draws an empty cell
const actions = machine => (machine.state === 'busy' ? [] : [{ label: 'Renombrar…', onSelect: () => log.push(`rename:${machine.id}`) }, { label: 'Borrar…', tone: 'danger', onSelect: () => log.push(`delete:${machine.id}`) }]);

function App() {
	return (
		<>
			<FamilyBar product={product} brand={{ src: '../brand/wordmark.svg', href: '/projects/' }} descriptor={chosen()} fallback={fallback} account={{ signout: () => {} }} labels={FamilyBar.labels.es} />
			<div className="bui-shell">
				<Sidebar product="Conduict" groups={[{ heading: 'Proyecto', items: [{ label: 'Máquinas', href: '#/machines', meta: '1 lista · 1 ocupada · 1 requiere atención', current: true }, { label: 'Conversaciones', href: '#/conversations', meta: 3 }] }]} />
				<main className="audit-page">
					<div id="chip">
						<ChoiceChip label="Modelo" options={options} value="default" placement="above" onChange={value => log.push(`model:${value}`)} />
					</div>
					<div className="audit-scroller" id="scroller">
						<div className="audit-scroller-inner">
							<ActionMenu label="Más" items={[{ label: 'Renombrar' }, { label: 'Duplicar' }, { label: 'Borrar', tone: 'danger' }]} />
						</div>
					</div>
					<div id="statuses">
						{tones.map(state => (
							<Status key={state} state={state} labels={Status.labels.es} />
						))}
					</div>
					<ul className="bui-rows" id="rows">
						{machines.map(machine => (
							<ListRow key={machine.id} title={machine.name} href={`#/machines/${machine.id}`} meta={[machine.size, `${machine.conversations} conversaciones`]} lead={{ state: machine.state }} status={{ state: machine.state }} facts={['3 d']} actions={[{ label: 'Despertar', onSelect: () => log.push(`wake:${machine.id}`) }]} menu={[{ label: 'Borrar…', tone: 'danger' }]} labels={es.ListRow} />
						))}
					</ul>
					<DataTable label="Máquinas" columns={[{ key: 'name', label: 'Nombre', sort: true }, { key: 'size', label: 'Tamaño' }, { key: 'conversations', label: 'Conversaciones', align: 'end', sort: true }, { key: 'id', label: 'Identificador', mono: true }]} rows={machines} onChange={state => log.push(`table:${JSON.stringify(state)}`)} menu={actions} labels={es.DataTable} />
					<Tabs items={['Resumen', 'Conversaciones', 'Repositorios', 'Motores de IA', 'Acceso', 'Ejecución', 'Costos', 'Ajustes'].map((label, index) => ({ label, href: `#${index}`, current: index === 0 }))} />
					<CommandCard title="Claude Code pide ejecutar un comando" command={command} scope={{ label: 'Permitir siempre comandos como este' }} onAllow={() => log.push('allow')} onDeny={() => log.push('deny')} labels={es.CommandCard} />
				</main>
			</div>
		</>
	);
}

createRoot(document.getElementById('root')).render(<App />);
window.fixture = { log, ready: true };
