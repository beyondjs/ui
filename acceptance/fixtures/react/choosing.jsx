// "Choose, never type" in the React consumers (0.7.0), in Spanish: the same parts as the DOM page,
// with React content in the side sheet, the picker's footer and the status row's action.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SideSheet, Picker, RefChooser, ProjectPicker, SecretField, StatusRow, CopyMessage, ProviderWindow, ListDetail, Collection, Button, Choices, AwaitedLine, useConfirm } from '@beyond-js/ui/react';
import { Collection as List } from '@beyond-js/ui';
import { shape, accounts, source, recognize, branches, projects, repositories, columns } from '../data/choosing.js';

const log = [];
window.fixture = { log, stall: false, ready: false };
const labels = Picker.labels.es;
const named = { items: accounts, connect: { label: 'Instalar en otra organización de GitHub', onSelect: () => log.push('connect') } };
const find = source(log);
const rows = List.local(repositories);
const began = Date.now() - 40_000;

function Choosing() {
	const [open, setOpen] = useState(shape.sheet);
	const [busy, setBusy] = useState(false);
	const { confirm } = useConfirm(useConfirm.labels.es);
	const picker = autofocus => <Picker label="Repositorios" source={find} delay={50} bound={2000} labels={labels} accounts={named} recognize={recognize} onRecognize={found => found && log.push(`recognized:${found.label}:${found.outcome}`)} onChange={items => log.push(`picked:${items.map(item => item.id).join(',')}`)} footer={<button type="button" className="bui-link-button" data-autofocus={autofocus ? '' : undefined} onClick={() => log.push('escape')}>Elegir en GitHub qué repositorios puede ver Beyond</button>} />;
	const detail = shape.detail ? <div><h2>acme/web</h2><p>Listo · actualizado desde GitHub al empezar la última conversación.</p></div> : null;
	return (
		<>
			<section id="sheeting">
				<Button label="Añadir repositorios" variant="primary" onClick={() => setOpen(true)} />
				<SideSheet open={open} title="Añadir repositorios a Storefront" description="Se añaden a Storefront en Beyond Projects y Conduict los clona en My first VM." busy={busy} labels={SideSheet.labels.es} onClose={value => (log.push(`sheet:${value}`), setOpen(false))} actions={<><Button label="Añadir 1 repositorio" variant="primary" onClick={() => setBusy(value => !value)} /><Button label="Cancelar" onClick={() => setOpen(false)} /></>}>
					{picker(false)}
				</SideSheet>
			</section>
			<section id="picking">{picker(false)}</section>
			<section id="refs"><RefChooser label="Rama base" refs={branches} value="main" labels={RefChooser.labels.es} onChange={value => log.push(`ref:${value}`)} /></section>
			<section id="projects"><ProjectPicker product="Delegate" projects={projects} labels={ProjectPicker.labels.es} onChange={id => log.push(`project:${id}`)} /></section>
			<section id="secret"><SecretField label="Acceso a Supabase" credential="token de acceso" labels={SecretField.labels.es} connect={{ label: 'Conectar Supabase', onSelect: () => log.push('supabase') }} /></section>
			<section id="rows">
				<StatusRow title="acme" kind="Organización de GitHub" state={{ label: 'Suspendida', tone: 'warning', checked: Date.now() - 120_000 }} reason="La aplicación de Beyond está suspendida en acme." owner="Quien la suspendió en GitHub" labels={StatusRow.labels.es} action={<Button label="Reactivar en GitHub" />} more={[{ label: 'Desconectar acme', onSelect: () => log.push('disconnect') }]} />
				<CopyMessage text="¿Puedes aprobar la aplicación de Beyond para acme en GitHub? Permite que Beyond lea los repositorios que elijamos para nuestros proyectos." label="Mensaje para un propietario de acme" labels={CopyMessage.labels.es} />
			</section>
			<section id="provider"><ProviderWindow provider="GitHub" href="../provider.html" origin={location.origin} same={false} labels={ProviderWindow.labels.es} read={async () => ({ state: localStorage.getItem('attempt') === 'done' ? 'done' : 'none' })} onEnd={outcome => log.push(`provider:${outcome}`)} /></section>
			<section id="following">
				<Choices legend="Motor de IA" type="radio" name="engine" value={null} options={[{ value: 'claude', label: 'Claude Code', hint: 'Conectado con el plan Max · su inicio de sesión dura hasta que lo desconectes', status: ['Listo', 'success'] }]} />
				<AwaitedLine title="Clonando acme/web" since={began} expected={{ median: 60_000, p90: 120_000 }} labels={AwaitedLine.labels.es} />
			</section>
			<section id="consequence">
				<Button label="Borrar My first VM" variant="danger" onClick={() => confirm({ title: '¿Borrar My first VM?', accept: 'Borrar entorno', tone: 'danger', consequence: { affected: ['Se detienen 2 conversaciones en curso'], lost: 'La máquina y sus copias', costing: 'La instantánea del disco, hasta que la borres', recovery: 'No se puede deshacer.' } }).then(answer => log.push(`confirm:${answer}`))} />
			</section>
			<section id="listing"><ListDetail label="Repositorio" list={<Collection label="Repositorios" columns={columns} source={rows} search={false} labels={List.labels.es} link={row => `?detail=1&repository=${row.id}`} />} detail={detail} back={{ label: 'Repositorios', href: '?' }} /></section>
		</>
	);
}

localStorage.removeItem('attempt');
createRoot(document.getElementById('root')).render(<StrictMode><Choosing /></StrictMode>);
window.fixture.ready = true;
