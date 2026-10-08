// The diff page of the React consumers (0.11.2), in Spanish through `Diff.labels.es`: one Diff of the
// patch named by `?patch=` (`main` by default, `many` for twelve files) inside StrictMode.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Diff } from '@beyond-js/ui/react';
import { patches } from '../data/diff.js';

const name = new URLSearchParams(location.search).get('patch') ?? 'main';
const fixture = { ready: false };
window.fixture = fixture;
const root = createRoot(document.getElementById('main'));
root.render(
	<StrictMode>
		<Diff patch={patches[name] ?? ''} label="Cambios de la conversación" labels={Diff.labels.es} locale="es" />
	</StrictMode>
);
fixture.destroy = () => root.unmount();
requestAnimationFrame(() => requestAnimationFrame(() => (fixture.ready = true)));
