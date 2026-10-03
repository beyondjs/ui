// The family bar page of the React consumers, in Spanish passed through `labels`: FamilyBar with the
// descriptor `?family=` names and a sidebar toggle, ProductNav, Unavailable and a confirmation with its consequence.
// window.fixture.show(name) replaces the descriptor prop, as a product does when its relay answers.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FamilyBar, ProductNav, Sidebar, NotificationEntry, Unavailable, Button, Badge, Lockup, useConfirm, availability } from '@beyond-js/ui/react';
import { Notices } from '../data/notices.js';
import { chosen, descriptors, fallback, product, sidebar, sections } from '../data/family.js';
import { es } from './labels.js';

const log = [];
const notices = new Notices(new URLSearchParams(location.search).get('notices') ?? 'ready');
const adapter = notices.adapter;
const groups = sections(['Proyectos', 'Proyecto', 'Pedidos', 'Versiones', 'Entornos', 'Servicios', 'Consumo', 'Ajustes']);
const spanish = { Available: 'Disponible', 'Closed access': 'Acceso cerrado', 'In preparation': 'En preparación', Planned: 'Planificado', Retired: 'Retirado' };

function Page() {
	const [descriptor, setDescriptor] = useState(chosen);
	const [open, setOpen] = useState(false);
	const questions = useConfirm(es.questions);
	window.fixture.show = name => setDescriptor(descriptors[name]);
	return (
		<>
			<FamilyBar
				product={product}
				brand={{ src: '../brand/wordmark.svg', href: '/projects/' }}
				descriptor={descriptor}
				fallback={fallback}
				labels={es.family}
				notifications={<NotificationEntry adapter={adapter} href="#/notifications" locale="es" labels={es.notifications} />}
				account={{ signout: () => log.push('signout'), items: [{ label: 'Ajustes de Delegate', href: '#/settings' }] }}
				onNavigate={item => log.push(`navigate:${item.href}`)}
				toggle={sidebar ? null : { controls: 'sidebar', expanded: open, onChange: setOpen }}
			/>
			{sidebar ? null : (
				<nav id="sidebar" aria-label="Delegate" hidden={!open}>
					<a href="#/requests">Pedidos</a>
				</nav>
			)}
			{sidebar ? null : <ProductNav label="Delegate" items={['Pedidos', 'Versiones', 'Entornos', 'Servicios', 'Consumo', 'Ajustes'].map((label, index) => ({ label, href: `#/${index}`, current: index === 4 }))} />}
			<Shell>
				{sidebar ? <Sidebar product="Delegate" groups={groups} context={{ label: 'Proyecto', name: 'Storefront redesign' }} cut={Number(sidebar)} labels={es.sidebar} onNavigate={item => (log.push(`section:${item.href}`), document.querySelector('main h1').focus())} /> : null}
				<main id="main">
					<h1 tabIndex={-1}>Barra de la familia</h1>
					<section id="lockups" className="lockups" aria-label="Lockups">
						{Array.from({ length: 23 }, (_, index) => (
							<div key={index} style={{ '--bui-lockup-height': `${18 + index}px` }}>
								<Lockup src="../brand/wordmark.svg" name="Delegate" />
							</div>
						))}
					</section>
					<section id="patterns" className="row">
						<Unavailable title="Workspace aún no está abierto para ti" reason="Los entornos de desarrollo se abren por invitación." owner="Quien administra Northwind Studio" code="NOT_ADMITTED" labels={{ owner: 'Quién puede cambiarlo: ' }} action={<Button label="Pedir acceso" variant="primary" />} />
						<Button label="Borrar proyecto" variant="danger" onClick={async () => log.push(`confirm:${await questions.confirm({ title: '¿Borrar Storefront redesign?', message: 'El proyecto se borra para todos.', accept: 'Borrar proyecto', tone: 'danger', consequence: { lost: ['Sus entradas en cada producto', 'Sus repositorios'], kept: 'Los registros propios de cada producto', recovery: 'El borrado no se puede deshacer.' } })}`)} />
						{availability.map(state => <Badge key={state.key} label={spanish[state.label]} tone={state.tone} />)}
					</section>
					<div className="tall" />
				</main>
			</Shell>
		</>
	);
}

/** With `?sidebar=<cut>` the page is a shell with the product's sections. */
function Shell({ children }) {
	return sidebar ? <div className="bui-shell">{children}</div> : <>{children}</>;
}

const root = createRoot(document.getElementById('root'));
window.fixture = { log, notices, destroy: () => root.unmount(), ready: false };
root.render(<StrictMode><Page /></StrictMode>);
window.fixture.ready = true;
