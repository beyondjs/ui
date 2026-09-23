// A React consumer of @beyond-js/ui/react, built from the installed package the way Delegate
// consumes it, with Spanish copy passed through `labels`. The same page runs on React 18 and 19.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import { StrictMode, useMemo, useRef, useState, version } from 'react';
import { createRoot } from 'react-dom/client';
import { Header, NotificationEntry, NotificationInbox, Button, ActionMenu, Dialog, Picker, Collection, Help, Tooltip, Field, FocusedForm, Status, useConfirm, useToaster } from '@beyond-js/ui/react';
import { Collection as List } from '@beyond-js/ui';
import { People, teams } from '../data/people.js';
import { rows, states } from '../data/rows.js';
import { Notices } from '../data/notices.js';
import { es } from './labels.js';
import { terms, clauses } from '../data/terms.js';

const params = new URLSearchParams(location.search);
const notices = new Notices(params.get('notices'));
const people = new People();
const log = [];
const products = { delegate: 'Delegate', cdn: 'CDN', projects: 'Projects' };
let attempts = 0;
const work = () => new Promise((resolve, reject) => setTimeout(() => (++attempts === 1 ? reject(new Error('bloqueado')) : resolve()), 600));
const source = async request => (await new Promise(resolve => setTimeout(resolve, 40)), List.local(rows, (item, query, filters) => item.title.toLowerCase().includes(query.toLowerCase()) && (!filters.state || item.state === filters.state))(request));

function App() {
	const [open, setOpen] = useState(false);
	const [reading, setReading] = useState(false);
	const picker = useRef(null);
	const bell = useRef(null);
	const questions = useConfirm(es.questions);
	const toaster = useToaster({ region: 'Mensajes', dismiss: 'Descartar' });
	const columns = useMemo(() => [{ key: 'title', label: 'Pedido', primary: true }, { key: 'state', label: 'Estado', render: row => <Status label={row.state} tone={row.state === 'released' ? 'success' : 'neutral'} /> }, { key: 'votes', label: 'Apoyos', numeric: true }], []);
	const go = destination => (location.hash = destination.slice(1));
	window.fixture.picker = picker;
	window.fixture.entry = bell;
	return (
		<>
			<Header
				brand={{ label: 'Beyond', href: '#/' }}
				labels={es.header}
				context={[{ label: 'Northwind', href: '#/o/northwind' }, { label: 'Storefront', current: true }]}
				nav={[{ label: 'Pedidos', href: '#/requests', current: true }, { label: 'Versiones', href: '#/versions' }]}
				notifications={<NotificationEntry ref={bell} adapter={notices.adapter} href="#/notifications" products={products} locale="es" labels={es.notifications} onOpen={go} onView={() => (location.hash = '/notifications')} />}
				account={<ActionMenu label="AN" name="Cuenta: Ana" glyph={null} items={[{ label: 'Tu cuenta', href: '#/account' }, { label: 'Cerrar sesión', onSelect: () => log.push('signout') }]} />}
			/>
			<main id="main">
				<h1>Consumidor React {version.split('.')[0]}</h1>
				<section id="actions" aria-labelledby="actions-title">
					<h2 id="actions-title">Acciones y diálogos</h2>
					<div className="row">
						<Button label="Abrir diálogo" onClick={() => setOpen(true)} />
						<Button label={terms.es.open} onClick={() => setReading(true)} />
						<Button label="Borrar proyecto" variant="danger" onClick={async () => log.push(`confirm:${await questions.confirm({ title: '¿Borrar el proyecto?', message: 'No se puede deshacer.', tone: 'danger', accept: 'Borrar', work, explain: error => `No se borró: ${error.message}` })}`)} />
						<ActionMenu label="Más" name="Más acciones" items={[{ label: 'Duplicar', onSelect: () => log.push('menu:duplicate') }, { label: 'Archivar', disabled: true, reason: 'Solo quienes administran archivan' }, { label: 'Aviso', onSelect: () => toaster.show('Guardado') }]} />
						<Status label="En vivo" tone="success" />
					</div>
					<Dialog open={open} title="Renombrar área" description="Los miembros ven el nuevo nombre." backdrop labels={es.questions} onClose={value => (log.push(`dialog:${value}`), setOpen(false))} actions={<Button label="Cerrar" onClick={() => (log.push('dialog:closed'), setOpen(false))} />}>
						<Field label="Nombre"><input defaultValue="Facturación" /></Field>
					</Dialog>
					<Dialog open={reading} title={terms.es.title} labels={es.questions} onClose={() => setReading(false)} actions={<Button label={terms.es.accept} variant="primary" onClick={() => (log.push('terms:accepted'), setReading(false))} />}>
						{clauses('es').map(text => <p key={text}>{text}</p>)}
					</Dialog>
				</section>
				<section id="picking" aria-labelledby="picking-title">
					<h2 id="picking-title">Selector</h2>
					<Picker ref={picker} label="Personas del lote" hint="Busca por nombre." source={people.source} name="people" labels={es.picker} filters={useMemo(() => [{ name: 'team', label: 'Equipo', options: teams }], [])} selected={useMemo(() => [{ id: 'gone', label: 'Antiguo miembro', state: 'stale', reason: 'Dejó la organización' }], [])} onChange={items => log.push(`picked:${items.length}`)} />
				</section>
				<section id="listing" aria-labelledby="listing-title">
					<h2 id="listing-title">Colección</h2>
					<Collection label="Pedidos" columns={columns} source={source} link={row => `#/requests/${row.id}`} filters={[{ name: 'state', label: 'Estado', options: states }]} limit={5} labels={es.collection} onState={state => log.push(`state:${JSON.stringify(state)}`)} />
				</section>
				<section id="helping" aria-labelledby="helping-title">
					<h2 id="helping-title">Ayuda y tooltip</h2>
					<p className="row">Identificador del proyecto <code>prj_8f2a</code> <Help topic="Identificador del proyecto" labels={es.help} text={['El identificador nunca cambia.', 'Soporte lo pide.']} /></p>
					<Tooltip text="Copia la dirección de vista previa"><button type="button" className="bui-button bui-button-secondary bui-button-small">Copiar dirección</button></Tooltip>
				</section>
				<section id="form" aria-labelledby="form-title">
					<h2 id="form-title">Formulario</h2>
					<FocusedForm onSubmit={values => (log.push(`submit:${values.title}`), new Promise(resolve => setTimeout(resolve, 400)))} onSuccess={() => toaster.show('Pedido enviado')}>
						{busy => <>
							<Field label="Título del pedido"><input name="title" required /></Field>
							<Button label="Enviar pedido" labels={{ busy: 'Enviando…' }} variant="primary" type="submit" busy={busy} />
						</>}
					</FocusedForm>
				</section>
				<section id="inbox" aria-labelledby="inbox-title">
					<h2 id="inbox-title">Bandeja</h2>
					<NotificationInbox adapter={notices.adapter} products={products} locale="es" limit={10} labels={es.notifications} onOpen={go} onState={state => log.push(`inbox:${JSON.stringify(state)}`)} />
				</section>
			</main>
		</>
	);
}

const root = createRoot(document.getElementById('root'));
window.fixture = { notices, people, log, react: version, work, destroy: () => root.unmount(), ready: false };
root.render(<StrictMode><App /></StrictMode>);
window.fixture.ready = true;
