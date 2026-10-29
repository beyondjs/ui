import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FamilyBar, Sidebar } from '@beyond-js/ui/react';
import { groups, rail } from '../data/sidebar-rail.mjs';
import { descriptors } from '../data/family.js';

const log = [];
const presentation = new URLSearchParams(location.search).get('global');
const linked = new URLSearchParams(location.search).has('linked');
const objects = { ...groups[1], heading: 'Conversaciones', action: { ...groups[1].action, label: 'Nueva' }, search: { ...groups[1].search, label: 'Buscar conversaciones' }, ...(linked ? { href: '/conversations', current: true } : {}) };
function App() {
	const [open, setOpen] = useState(true);
	const [revision, setRevision] = useState(0);
	const current = [{ ...groups[0], items: groups[0].items.map(item => ({ ...item, ...(item.key === 'machines' && revision ? { meta: 3 } : {}), ...(linked ? { current: false } : {}) })) }, objects];
	window.fixture = { ready: true, log, update: () => setRevision(value => value + 1) };
	return <><FamilyBar product="conduict" brand={{ src: '../brand/wordmark.svg', href: '/home' }} descriptor={descriptors.inside} labels={FamilyBar.labels.es} /><div className="bui-shell"><Sidebar product="Conduict" groups={current} labels={Sidebar.labels.es} context={{ label: 'Proyecto', name: 'Storefront redesign' }} rail={presentation === 'inline' ? null : { ...rail, open, onChange: value => { log.push(value); setOpen(value); } }} navigation={presentation ? { key: 'fixture', onChange: value => log.push(`global:${value}`) } : null} merge onNavigate={item => { log.push(item.label); document.querySelector('main h1')?.focus(); }} /><main className="navigation-page"><h1 tabIndex={-1}>Repositorios</h1><p>Una prueba de navegación con datos ficticios.</p></main></div></>;
}
createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
