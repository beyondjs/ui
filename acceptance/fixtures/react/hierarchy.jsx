// The hierarchy page of the React consumers, in Spanish (0.19.0, D158): the same machine panel as the DOM
// page, drawn with the React SideSheet, Section, Meter and ActionLine, and a dialog. window.fixture.show(name)
// opens the sheet or the dialog; window.fixture.warnings holds what the development build named.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SideSheet, Dialog, Section, Meter, ActionLine, Button, Status } from '@beyond-js/ui/react';

const warnings = [];
const warn = console.warn.bind(console);
console.warn = (message, ...rest) => {
	if (String(message).startsWith('@beyond-js/ui: the heading')) warnings.push(String(message));
	warn(message, ...rest);
};
let show = () => undefined;

function Page() {
	const [open, setOpen] = useState(null);
	show = setOpen;
	return (
		<main>
			<h1>Jerarquía</h1>
			<SideSheet open={open === 'sheet'} title="lab" description="Tu máquina en Storefront" onClose={() => setOpen(null)} labels={{ close: 'Cerrar' }}>
				<Section level={3} title="Estado">
					<div className="row">
						<Status label="Dormida" />
						<Button label="Despertar" variant="primary" small />
					</div>
					<p className="fixture-note">Dormida a las 17:08 por su política de inactividad</p>
				</Section>
				<Section level={3} title="Cuándo se duerme">
					<p>Cuando está despierta, se duerme tras 30 min sin nada en ejecución.</p>
					<ActionLine>
						<a href="#settings">Cambiar cuándo se duerme</a>
					</ActionLine>
				</Section>
				<Section level={3} title="Carga">
					<Meter label="Procesador" value={0} />
					<Meter label="Memoria" value={0.04} />
					<p className="fixture-note">Medido a las 17:07</p>
				</Section>
				<ActionLine label="Caminos">
					<a href="#machine">Abrir lab</a>
					<a href="#files">Archivos en lab</a>
				</ActionLine>
			</SideSheet>
			<Dialog open={open === 'dialog'} title="¿Dormir lab ahora?" onClose={() => setOpen(null)}>
				<p>El turno en ejecución se detiene; lo hecho hasta ahora se conserva.</p>
			</Dialog>
		</main>
	);
}

const root = createRoot(document.getElementById('root'));
window.fixture = { warnings, show: name => show(name), destroy: () => root.unmount(), ready: false };
root.render(<StrictMode><Page /></StrictMode>);
window.fixture.ready = true;
