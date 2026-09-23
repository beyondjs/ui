// A React consumer whose application sits under a provider that reads an external store with
// `useSyncExternalStore` (as a product's language or session provider does), inside `StrictMode`.
// React's development double mount destroys and recreates each dialog, and React 18 renders the
// destroyed one first under such a provider; every dialog here must stay open until the person
// closes it, and its field must keep what is typed.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import { StrictMode, useState, useSyncExternalStore, version } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Dialog, Field } from '@beyond-js/ui/react';

/** A tiny external store of the interface language. */
class Language {
	#value = 'es';
	#listeners = new Set();

	get value() {
		return this.#value;
	}

	set value(value) {
		this.#value = value;
		for (const listener of this.#listeners) listener();
	}

	subscribe = listener => (this.#listeners.add(listener), () => this.#listeners.delete(listener));
	read = () => this.#value;
}

const language = new Language();
const log = [];

function Provider({ children }) {
	const current = useSyncExternalStore(language.subscribe, language.read);
	return <div lang={current}>{children}</div>;
}

function App() {
	const [first, setFirst] = useState(true);
	const [second, setSecond] = useState(false);
	const [name, setName] = useState('');
	return (
		<main id="main">
			<h1>Tienda externa, React {version.split('.')[0]}</h1>
			<Button label="Abrir segundo diálogo" onClick={() => setSecond(true)} />
			<Dialog open={first} title="Renombrar área" labels={{ close: 'Cerrar' }} onClose={value => (log.push(`first:${value}`), setFirst(false))}>
				<Field label="Nombre del área"><input name="area" /></Field>
			</Dialog>
			<Dialog open={second} title="Invitar persona" labels={{ close: 'Cerrar' }} onClose={value => (log.push(`second:${value}`), setSecond(false))} actions={<Button label="Invitar" variant="primary" onClick={() => (log.push(`invited:${name}`), setSecond(false))} />}>
				<Field label="Correo"><input name="email" value={name} onChange={event => setName(event.target.value)} /></Field>
			</Dialog>
		</main>
	);
}

const root = createRoot(document.getElementById('root'));
window.fixture = { log, language, react: version, destroy: () => root.unmount(), ready: false };
root.render(<StrictMode><Provider><App /></Provider></StrictMode>);
window.fixture.ready = true;
